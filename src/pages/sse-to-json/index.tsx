import {
  Braces,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  FileText,
  FoldVertical,
  Radio,
  Trash2,
  UnfoldVertical,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { CodeArea } from '@/components/code-area';
import { CopyButton } from '@/components/copy-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { isMac, looksLikeSse, type ParseResult, parseSseToJson, type SseDataBlock } from './utils';

// ─── 单条 SSE 块 ────────────────────────────────────────────

const SseBlock = memo(function SseBlock({
  block,
  collapsed,
  onToggle,
}: {
  block: SseDataBlock;
  collapsed: boolean;
  onToggle: (index: number) => void;
}) {
  const handleToggle = useCallback(() => onToggle(block.index), [onToggle, block.index]);

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 mb-1">
        <button
          onClick={handleToggle}
          className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          <span>#{block.index + 1}</span>
        </button>
        {block.event && (
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">
            {block.event}
          </Badge>
        )}
        {block.id && (
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono text-muted-foreground">
            id: {block.id}
          </Badge>
        )}
        {block.type === 'signal' && (
          <Badge className="text-[10px] h-4 px-1.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15">
            {block.raw}
          </Badge>
        )}
        {block.type === 'text' && !block.valid && (
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
            解析失败
          </Badge>
        )}
      </div>
      {!collapsed && (
        <>
          {block.type === 'json' && (
            <CodeArea
              code={block.formatted ?? ''}
              language="json"
              className="min-h-0"
              codeClassName="!text-[11px]"
              showCopyButton={false}
            />
          )}
          {block.type === 'signal' && (
            <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-md px-3 py-2 font-mono">
              流信号: {block.raw}
            </div>
          )}
          {block.type === 'text' && !block.valid && (
            <div className="space-y-1.5">
              <div className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2 font-mono">
                {block.error}
              </div>
              <CodeArea code={block.raw} language="text" className="min-h-0" codeClassName="!text-[11px]" />
            </div>
          )}
        </>
      )}
    </div>
  );
});

// ─── SSE 输入弹窗 ───────────────────────────────────────────

function SseInputDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (text: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 每次弹窗打开时清空 textarea
  useEffect(() => {
    if (open) {
      // 使用 requestAnimationFrame 确保 DOM 已渲染
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.value = '';
          textareaRef.current.focus();
        }
      });
    }
  }, [open]);

  const handleConfirm = useCallback(() => {
    const value = textareaRef.current?.value ?? '';
    if (!value.trim()) return;
    onConfirm(value);
  }, [onConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    },
    [handleConfirm],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>粘贴 SSE 原始数据</DialogTitle>
          <DialogDescription>
            将 SSE (Server-Sent Events) 原始文本粘贴到下方，点击解析后提取所有 data 字段
          </DialogDescription>
        </DialogHeader>
        <textarea
          ref={textareaRef}
          placeholder={`event: message\ndata: {"key": "value"}\n\nevent: message\ndata: {"another": "object"}`}
          className="h-80 w-full font-mono text-xs resize-none p-3 leading-relaxed custom-scrollbar rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          spellCheck={false}
          onKeyDown={handleKeyDown}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>
            <Braces className="h-3.5 w-3.5 mr-1.5" />
            解析
            <kbd className="ml-1.5 text-[10px] opacity-60">{isMac() ? '⌘↵' : 'Ctrl+↵'}</kbd>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── SSE 原始文本查看弹窗 ────────────────────────────────────

function RawTextDialog({
  open,
  onOpenChange,
  rawText,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawText: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>SSE 原始文本</DialogTitle>
          <DialogDescription>以下是导入时的 SSE 原始数据</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          <CodeArea code={rawText} language="text" className="h-[60vh]" codeClassName="!text-[11px]" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 默认折叠阈值：超过此数量时默认折叠后面的块 ─────────────────

const AUTO_COLLAPSE_THRESHOLD = 20;

// ─── 主页面 ─────────────────────────────────────────────────

export default function SseToJsonPage() {
  const [parseResult, setParseResult] = useState<ParseResult>({
    blocks: [],
    validCount: 0,
    invalidCount: 0,
    signalCount: 0,
  });
  const [open, setOpen] = useState(false);
  const [rawTextOpen, setRawTextOpen] = useState(false);
  const [rawSseText, setRawSseText] = useState('');
  // 使用 Set 跟踪折叠状态（存储被折叠的 block index）
  const [collapsedSet, setCollapsedSet] = useState<Set<number>>(new Set());

  const { blocks, validCount, invalidCount, signalCount } = parseResult;
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const handleParse = useCallback((text: string): ParseResult => {
    const result = parseSseToJson(text);
    setParseResult(result);
    setRawSseText(text);
    // 超过阈值时，默认折叠后面的块
    if (result.blocks.length > AUTO_COLLAPSE_THRESHOLD) {
      const collapsed = new Set<number>();
      result.blocks.forEach((b) => {
        if (b.index >= AUTO_COLLAPSE_THRESHOLD) collapsed.add(b.index);
      });
      setCollapsedSet(collapsed);
    } else {
      setCollapsedSet(new Set());
    }
    return result;
  }, []);

  const handleConfirmFromDialog = useCallback(
    (text: string) => {
      handleParse(text);
      setOpen(false);
    },
    [handleParse],
  );

  const handleClear = useCallback(() => {
    setParseResult({ blocks: [], validCount: 0, invalidCount: 0, signalCount: 0 });
    setCollapsedSet(new Set());
    setRawSseText('');
  }, []);

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

  // 合并所有有效 JSON 为数组的字符串
  const mergedJson = useMemo(() => {
    const validBlocks = blocks.filter((b) => b.type === 'json' && b.valid);
    if (validBlocks.length === 0) return '';
    return JSON.stringify(
      validBlocks.map((b) => b.parsed),
      null,
      2,
    );
  }, [blocks]);

  // 快捷键提示
  const pasteShortcut = useMemo(() => (isMac() ? '⌘V' : 'Ctrl+V'), []);

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
      if (!text || !looksLikeSse(text)) return;
      e.preventDefault();
      const result = handleParse(text);
      toast.success(`已解析 ${result.blocks.length} 条 SSE 数据`);
    };
    document.addEventListener('paste', handlePasteEvent);
    return () => document.removeEventListener('paste', handlePasteEvent);
  }, [open, handleParse]);

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <SseInputDialog open={open} onOpenChange={setOpen} onConfirm={handleConfirmFromDialog} />
        <Radio className="h-16 w-16 text-muted-foreground/20" />
        <div className="text-center space-y-1.5">
          <p className="text-sm text-muted-foreground">
            直接按 <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[11px] font-mono">{pasteShortcut}</kbd>{' '}
            粘贴 SSE 数据即可自动解析
          </p>
          <p className="text-xs text-muted-foreground/60">或点击下方按钮手动输入</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <ClipboardPaste className="h-4 w-4 mr-2" />
          粘贴 SSE 数据
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8">
      <SseInputDialog open={open} onOpenChange={setOpen} onConfirm={handleConfirmFromDialog} />
      <RawTextDialog open={rawTextOpen} onOpenChange={setRawTextOpen} rawText={rawSseText} />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <ClipboardPaste className="h-3.5 w-3.5 mr-1.5" />
            重新导入
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClear}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            清空
          </Button>

          <div className="h-4 w-px bg-border" />

          <Button size="sm" variant="ghost" onClick={expandAll} title="全部展开">
            <UnfoldVertical className="h-3.5 w-3.5 mr-1.5" />
            展开
          </Button>
          <Button size="sm" variant="ghost" onClick={collapseAll} title="全部折叠">
            <FoldVertical className="h-3.5 w-3.5 mr-1.5" />
            折叠
          </Button>

          <div className="h-4 w-px bg-border" />

          <Button size="sm" variant="ghost" onClick={() => setRawTextOpen(true)} title="查看原始 SSE 文本">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            原始文本
          </Button>

          {mergedJson && (
            <>
              <div className="h-4 w-px bg-border" />
              <CopyButton text={mergedJson} mode="icon-text" size="sm" variant="ghost" copyText="复制全部 JSON" />
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px] h-5">
            共 {blocks.length} 条
          </Badge>
          {validCount > 0 && (
            <Badge className="text-[10px] h-5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15">
              {validCount} 成功
            </Badge>
          )}
          {signalCount > 0 && (
            <Badge className="text-[10px] h-5 bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15">
              {signalCount} 信号
            </Badge>
          )}
          {invalidCount > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5">
              {invalidCount} 失败
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {blocks.map((block) => (
          <SseBlock key={block.index} block={block} collapsed={collapsedSet.has(block.index)} onToggle={toggleBlock} />
        ))}
      </div>
    </div>
  );
}
