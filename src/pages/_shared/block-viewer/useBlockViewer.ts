import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

/** block 必须具备的最小字段：唯一索引 + 解析结果 */
export interface BaseBlock {
  index: number;
  parsed: unknown | null;
}

/** 解析结果必须具备的最小形态 */
export interface BaseParseResult<B extends BaseBlock> {
  blocks: B[];
}

/** 超过此数量时默认折叠后面的块 */
const AUTO_COLLAPSE_THRESHOLD = 20;

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
  expandAll: () => void;
  collapseAll: () => void;
  // ── 内置查找 ──
  /** 查找栏是否打开 */
  findOpen: boolean;
  setFindOpen: (open: boolean) => void;
  /** 查找关键词 */
  query: string;
  setQuery: (q: string) => void;
  /** 命中的 block index 列表 */
  matches: number[];
  /** 当前命中在 matches 中的序号（-1 表示无） */
  activeMatchIdx: number;
  /** 切换到上一个/下一个命中（dir=1 下一个，-1 上一个） */
  gotoMatch: (dir: 1 | -1) => void;
  /** 当前高亮定位的 block index（null 表示无） */
  highlightedIndex: number | null;
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

  const [result, setResult] = useState<R>(emptyResult);
  const [open, setOpen] = useState(false);
  const [rawTextOpen, setRawTextOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  // 使用 Set 跟踪折叠状态（存储被折叠的 block index）
  const [collapsedSet, setCollapsedSet] = useState<Set<number>>(new Set());

  // ── 内置查找状态 ──
  const [findOpen, setFindOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeMatchIdx, setActiveMatchIdx] = useState(-1);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  // 虚拟滚动列表注册的 scrollToIndex 回调（无则回退 DOM scrollIntoView）
  const scrollerRef = useRef<((index: number) => void) | null>(null);

  const blocks = result.blocks;
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const handleParse = useCallback(
    (text: string): R => {
      const parsed = parse(text);
      setResult(parsed);
      setRawText(text);
      // 超过阈值时，默认折叠后面的块
      if (parsed.blocks.length > AUTO_COLLAPSE_THRESHOLD) {
        const collapsed = new Set<number>();
        parsed.blocks.forEach((b) => {
          if (b.index >= AUTO_COLLAPSE_THRESHOLD) collapsed.add(b.index);
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
    setQuery('');
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

  const expandAll = useCallback(() => setCollapsedSet(new Set()), []);

  const collapseAll = useCallback(() => {
    setCollapsedSet(new Set(blocksRef.current.map((b) => b.index)));
  }, []);

  // 合并所有可纳入的 block 为 JSON 数组字符串
  const mergedJson = useMemo(() => {
    const mergeable = blocks.filter(isMergeable);
    if (mergeable.length === 0) return '';
    return JSON.stringify(
      mergeable.map((b) => b.parsed),
      null,
      2,
    );
  }, [blocks, isMergeable]);

  // ── 内置查找：命中块 index 列表（大小写不敏感 includes） ──
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return blocks.filter((b) => getSearchText(b).toLowerCase().includes(q)).map((b) => b.index);
  }, [query, blocks, getSearchText]);

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

  // 全局粘贴事件
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
    query,
    setQuery,
    matches,
    activeMatchIdx,
    gotoMatch,
    highlightedIndex,
    registerScroller,
  };
}
