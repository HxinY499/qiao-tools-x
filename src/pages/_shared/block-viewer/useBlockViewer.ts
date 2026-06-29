import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { compileMatcher, createEmptyCondition, type FindCondition } from './query-matcher';
import { useBlockViewerSettings } from './settings-store';

/** block 必须具备的最小字段：唯一索引 + 解析结果 */
export interface BaseBlock {
  index: number;
  parsed: unknown | null;
}

/** 解析结果必须具备的最小形态 */
export interface BaseParseResult<B extends BaseBlock> {
  blocks: B[];
}

/** 默认折叠阈值（fallback，实际值从 settings store 读取） */
const DEFAULT_AUTO_COLLAPSE_THRESHOLD = 20;

interface UseBlockViewerOptions<B extends BaseBlock, R extends BaseParseResult<B>> {
  /** 空结果（清空时复位用），由各工具提供以保留各自统计字段 */
  emptyResult: R;
  /** 解析函数 */
  parse: (text: string) => R;
  /** 粗判文本是否属于本工具，用于全局粘贴拦截 */
  looksLike: (text: string) => boolean;
  /** 判断某 block 是否应纳入 mergedJson */
  isMergeable: (block: B) => boolean;
  /** 解析成功的 toast 文案构造（如 `已解析 N 条 SSE 数据`） */
  successMessage: (count: number) => string;
  /** 取某 block 的可搜索文本（用于内置查找定位） */
  getSearchText: (block: B) => string;
}

export interface BlockViewerController<B extends BaseBlock, R extends BaseParseResult<B>> {
  result: R;
  rawText: string;
  collapsedSet: Set<number>;
  mergedJson: string;
  /** 输入弹窗开关 */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** 原始文本弹窗开关 */
  rawTextOpen: boolean;
  setRawTextOpen: (open: boolean) => void;
  /** 解析并写入状态（手动输入/重新导入用） */
  handleConfirmFromDialog: (text: string) => void;
  handleClear: () => void;
  toggleBlock: (index: number) => void;
  /** 展开块；传入 indices 只展开这些块，不传展开全部 */
  expandAll: (indices?: number[]) => void;
  /** 折叠块；传入 indices 只折叠这些块，不传折叠全部 */
  collapseAll: (indices?: number[]) => void;
  // ── 内置查找 ──
  /** 查找栏是否打开 */
  findOpen: boolean;
  setFindOpen: (open: boolean) => void;
  /** 查找条件列表（包含 / 不包含） */
  conditions: FindCondition[];
  setConditions: Dispatch<SetStateAction<FindCondition[]>>;
  /** 命中的 block index 列表 */
  matches: number[];
  /** 正则模式下首个非法正则的错误信息（普通模式恒 null） */
  queryError: string | null;
  /** 当前命中在 matches 中的序号（-1 表示无） */
  activeMatchIdx: number;
  /** 切换到上一个/下一个命中（dir=1 下一个，-1 上一个） */
  gotoMatch: (dir: 1 | -1) => void;
  /** 当前高亮定位的 block index（null 表示无） */
  highlightedIndex: number | null;
  /** 高亮 nonce：每次"定位"动作递增，用于让 UI 重启脉冲动画（即便定位到的还是同一个块） */
  highlightNonce: number;
  /** 供虚拟滚动列表注册 scrollToIndex 回调；传 null 注销 */
  registerScroller: (fn: ((index: number) => void) | null) => void;
}

/**
 * 块查看类工具（SSE / ljson 等）的通用状态逻辑：
 * 折叠管理、解析、清空、全局粘贴拦截、合并 JSON。
 */
export function useBlockViewer<B extends BaseBlock, R extends BaseParseResult<B>>(
  options: UseBlockViewerOptions<B, R>,
): BlockViewerController<B, R> {
  const { emptyResult, parse, looksLike, isMergeable, successMessage, getSearchText } = options;

  // 从 settings store 读取配置（放在顶部，确保后续逻辑可用）
  const caseSensitive = useBlockViewerSettings((s) => s.caseSensitive);
  const regexMode = useBlockViewerSettings((s) => s.regexMode);
  const autoCollapseThreshold = useBlockViewerSettings((s) => s.autoCollapseThreshold);

  const [result, setResult] = useState<R>(emptyResult);
  const [open, setOpen] = useState(false);
  const [rawTextOpen, setRawTextOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  // 使用 Set 跟踪折叠状态（存储被折叠的 block index）
  const [collapsedSet, setCollapsedSet] = useState<Set<number>>(new Set());

  // ── 内置查找状态 ──
  const [findOpen, setFindOpen] = useState(false);
  // 默认带一个空的"包含"条件，方便用户直接输入
  const [conditions, setConditions] = useState<FindCondition[]>(() => [createEmptyCondition('include')]);
  const [activeMatchIdx, setActiveMatchIdx] = useState(-1);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [highlightNonce, setHighlightNonce] = useState(0);
  // 虚拟滚动列表注册的 scrollToIndex 回调（无则回退 DOM scrollIntoView）
  const scrollerRef = useRef<((index: number) => void) | null>(null);

  const blocks = result.blocks;
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  // 粘贴去重：记录上一次粘贴内容的哈希，避免重复解析
  const lastPasteRef = useRef('');

  // 用 ref 保证 handleParse 中读取最新的 autoCollapseThreshold
  const autoCollapseThresholdRef = useRef(DEFAULT_AUTO_COLLAPSE_THRESHOLD);
  autoCollapseThresholdRef.current = autoCollapseThreshold;

  const handleParse = useCallback(
    (text: string): R => {
      const parsed = parse(text);
      setResult(parsed);
      setRawText(text);
      // 超过阈值时，默认折叠后面的块（0 表示不自动折叠）
      const threshold = autoCollapseThresholdRef.current;
      if (threshold > 0 && parsed.blocks.length > threshold) {
        const collapsed = new Set<number>();
        parsed.blocks.forEach((b) => {
          if (b.index >= threshold) collapsed.add(b.index);
        });
        setCollapsedSet(collapsed);
      } else {
        setCollapsedSet(new Set());
      }
      return parsed;
    },
    [parse],
  );

  const handleConfirmFromDialog = useCallback(
    (text: string) => {
      handleParse(text);
      setOpen(false);
    },
    [handleParse],
  );

  const handleClear = useCallback(() => {
    setResult(emptyResult);
    setCollapsedSet(new Set());
    setRawText('');
    setConditions([createEmptyCondition('include')]);
    setActiveMatchIdx(-1);
    setHighlightedIndex(null);
  }, [emptyResult]);

  const toggleBlock = useCallback((index: number) => {
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  /**
   * 展开（取消折叠）：传入 indices 时只展开这些；不传则展开全部。
   * 用于"仅显示匹配"场景下，让按钮只作用于当前可见的块。
   */
  const expandAll = useCallback((indices?: number[]) => {
    if (!indices) {
      setCollapsedSet(new Set());
      return;
    }
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      for (const i of indices) next.delete(i);
      return next;
    });
  }, []);

  /**
   * 折叠：传入 indices 时只折叠这些；不传则折叠全部。
   */
  const collapseAll = useCallback((indices?: number[]) => {
    if (!indices) {
      setCollapsedSet(new Set(blocksRef.current.map((b) => b.index)));
      return;
    }
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      for (const i of indices) next.add(i);
      return next;
    });
  }, []);

  // 合并所有可纳入的 block 为 JSON 数组字符串（lazy：仅在调用时计算）
  const mergedJsonRef = useRef<{ blocks: B[]; value: string } | null>(null);
  const mergedJson = useMemo(() => {
    // 使用 getter 模式：仍然是 string 类型对外，但利用缓存避免重复序列化
    if (mergedJsonRef.current && mergedJsonRef.current.blocks === blocks) {
      return mergedJsonRef.current.value;
    }
    const mergeable = blocks.filter(isMergeable);
    const value = mergeable.length === 0 ? '' : JSON.stringify(mergeable.map((b) => b.parsed), null, 2);
    mergedJsonRef.current = { blocks, value };
    return value;
  }, [blocks, isMergeable]);

  // ── 内置查找：按 conditions + caseSensitive + regexMode 编译 matcher，对 blocks 过滤 ──

  const compiled = useMemo(
    () => compileMatcher({ conditions, caseSensitive, regexMode }),
    [conditions, caseSensitive, regexMode],
  );

  const matches = useMemo(() => {
    if (compiled.isEmpty || compiled.error) return [];
    return blocks.filter((b) => compiled.test(getSearchText(b))).map((b) => b.index);
  }, [compiled, blocks, getSearchText]);

  const queryError = compiled.error;

  const registerScroller = useCallback((fn: ((index: number) => void) | null) => {
    scrollerRef.current = fn;
  }, []);

  // 定位到某个 block index：展开它 + 高亮 + 滚动到视口中央
  const scrollToBlock = useCallback((blockIndex: number) => {
    // 确保展开（从折叠集合移除）
    setCollapsedSet((prev) => {
      if (!prev.has(blockIndex)) return prev;
      const next = new Set(prev);
      next.delete(blockIndex);
      return next;
    });
    setHighlightedIndex(blockIndex);
    setHighlightNonce((n) => n + 1);
    // 优先用虚拟滚动注册的 scrollToIndex，否则回退 DOM
    requestAnimationFrame(() => {
      if (scrollerRef.current) {
        scrollerRef.current(blockIndex);
      } else {
        const el = document.querySelector(`[data-block-index="${blockIndex}"]`);
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
  }, []);

  // 查询变化时，自动定位到第一个命中
  useEffect(() => {
    if (matches.length === 0) {
      setActiveMatchIdx(-1);
      setHighlightedIndex(null);
      return;
    }
    setActiveMatchIdx(0);
    scrollToBlock(matches[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches]);

  const gotoMatch = useCallback(
    (dir: 1 | -1) => {
      if (matches.length === 0) return;
      setActiveMatchIdx((prev) => {
        const nextIdx = (prev + dir + matches.length) % matches.length;
        scrollToBlock(matches[nextIdx]);
        return nextIdx;
      });
    },
    [matches, scrollToBlock],
  );

  // 全局粘贴事件（含去重：相同内容不重复解析）
  useEffect(() => {
    const handlePasteEvent = (e: ClipboardEvent) => {
      if (open) return;
      // 避免劫持输入元素中的粘贴操作
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) {
        return;
      }
      const text = e.clipboardData?.getData('text/plain');
      if (!text || !looksLike(text)) return;
      // 去重：与上次粘贴内容完全相同则跳过
      if (text === lastPasteRef.current) return;
      lastPasteRef.current = text;
      e.preventDefault();
      const parsed = handleParse(text);
      toast.success(successMessage(parsed.blocks.length), { position: 'top-right' });
    };
    document.addEventListener('paste', handlePasteEvent);
    return () => document.removeEventListener('paste', handlePasteEvent);
  }, [open, handleParse, looksLike, successMessage]);

  return {
    result,
    rawText,
    collapsedSet,
    mergedJson,
    open,
    setOpen,
    rawTextOpen,
    setRawTextOpen,
    handleConfirmFromDialog,
    handleClear,
    toggleBlock,
    expandAll,
    collapseAll,
    findOpen,
    setFindOpen,
    conditions,
    setConditions,
    matches,
    queryError,
    activeMatchIdx,
    gotoMatch,
    highlightedIndex,
    highlightNonce,
    registerScroller,
  };
}
