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
}

/**
 * 块查看类工具（SSE / ljson 等）的通用状态逻辑：
 * 折叠管理、解析、清空、全局粘贴拦截、合并 JSON。
 */
export function useBlockViewer<B extends BaseBlock, R extends BaseParseResult<B>>(
  options: UseBlockViewerOptions<B, R>,
): BlockViewerController<B, R> {
  const { emptyResult, parse, looksLike, isMergeable, successMessage } = options;

  const [result, setResult] = useState<R>(emptyResult);
  const [open, setOpen] = useState(false);
  const [rawTextOpen, setRawTextOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  // 使用 Set 跟踪折叠状态（存储被折叠的 block index）
  const [collapsedSet, setCollapsedSet] = useState<Set<number>>(new Set());

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
  };
}
