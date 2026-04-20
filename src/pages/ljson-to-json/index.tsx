import {
  ArrowUp,
  Braces,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  FileText,
  FileType2,
  FoldVertical,
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

import { isMac, type LjsonLineBlock, looksLikeLjson, type ParseResult, parseLjsonToJson } from './utils';

// ─── 单条 ljson 行 ──────────────────────────────────────────

const LjsonBlock = memo(function LjsonBlock({
  block,
  collapsed,
  onToggle,
}: {
  block: LjsonLineBlock;
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
          <span>L{block.lineNo}</span>
        </button>
        {!block.valid && (
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
            解析失败
          </Badge>
        )}
      </div>
      {!collapsed && (
        <>
          {block.valid && (
            <CodeArea
              code={block.formatted ?? ''}
              language="json"
              className="min-h-0"
              codeClassName="!text-[11px]"
              showCopyButton={false}
            />
          )}
          {!block.valid && (
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

// ─── 粘贴输入弹窗 ───────────────────────────────────────────

function LjsonInputDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (text: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
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
          <DialogTitle>粘贴 ljson 原始数据</DialogTitle>
          <DialogDescription>
            将 ljson (JSON Lines / NDJSON) 原始文本粘贴到下方，一行一个 JSON 对象
          </DialogDescription>
        </DialogHeader>
        <textarea
          ref={textareaRef}
          placeholder={`{"id":"1","type":"message","text":"hello"}\n{"id":"2","type":"topic","topic":"greeting"}`}
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

// ─── 原始文本查看弹窗 ────────────────────────────────────────

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
          <DialogTitle>ljson 原始文本</DialogTitle>
          <DialogDescription>以下是导入时的 ljson 原始数据</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          <CodeArea code={rawText} language="text" className="h-[60vh]" codeClassName="!text-[11px]" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 回到顶部按钮（监听最近的滚动祖先） ─────────────────────────

function findScrollParent(el: HTMLElement | null): HTMLElement | Window {
  let node = el?.parentElement ?? null;
  while (node) {
    const style = getComputedStyle(node);
    const overflowY = style.overflowY;
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return window;
}

function ScrollToTop() {
  const anchorRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLElement | Window | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scroller = findScrollParent(anchorRef.current);
    scrollerRef.current = scroller;

    const getTop = () => (scroller === window ? window.scrollY : (scroller as HTMLElement).scrollTop);
    const handleScroll = () => setVisible(getTop() > 400);

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => scroller.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (scroller === window) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      (scroller as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <>
      <div ref={anchorRef} className="hidden" aria-hidden />
      {visible && (
        <Button
          size="icon"
          variant="outline"
          className="fixed bottom-6 right-6 z-50 h-9 w-9 rounded-full shadow-md bg-background/80 backdrop-blur-sm"
          onClick={scrollToTop}
          title="回到顶部"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}

// ─── 默认折叠阈值 ─────────────────────────────────────────────

const AUTO_COLLAPSE_THRESHOLD = 20;

// isMac() 在运行期间不会变化，缓存为模块级常量避免每次渲染重算
const PASTE_SHORTCUT = isMac() ? '⌘V' : 'Ctrl+V';

// ─── 主页面 ─────────────────────────────────────────────────

export default function LjsonToJsonPage() {
  const [parseResult, setParseResult] = useState<ParseResult>({
    blocks: [],
    validCount: 0,
    invalidCount: 0,
  });
  const [open, setOpen] = useState(false);
  const [rawTextOpen, setRawTextOpen] = useState(false);
  const [rawLjsonText, setRawLjsonText] = useState('');
  const [collapsedSet, setCollapsedSet] = useState<Set<number>>(new Set());

  const { blocks, validCount, invalidCount } = parseResult;
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const handleParse = useCallback((text: string): ParseResult => {
    const result = parseLjsonToJson(text);
    setParseResult(result);
    setRawLjsonText(text);
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
    setParseResult({ blocks: [], validCount: 0, invalidCount: 0 });
    setCollapsedSet(new Set());
    setRawLjsonText('');
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
    const validBlocks = blocks.filter((b) => b.valid);
    if (validBlocks.length === 0) return '';
    return JSON.stringify(
      validBlocks.map((b) => b.parsed),
      null,
      2,
    );
  }, [blocks]);

  // 全局粘贴事件
  useEffect(() => {
    const handlePasteEvent = (e: ClipboardEvent) => {
      if (open) return;
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) {
        return;
      }
      const text = e.clipboardData?.getData('text/plain');
      if (!text || !looksLikeLjson(text)) return;
      e.preventDefault();
      const result = handleParse(text);
      toast.success(`已解析 ${result.blocks.length} 条 ljson 数据`, { position: 'top-right' });
    };
    document.addEventListener('paste', handlePasteEvent);
    return () => document.removeEventListener('paste', handlePasteEvent);
  }, [open, handleParse]);

  if (blocks.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-5 px-4">
        <LjsonInputDialog open={open} onOpenChange={setOpen} onConfirm={handleConfirmFromDialog} />
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
          <FileType2 className="h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-sm text-muted-foreground">
            直接按 <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[11px] font-mono">{PASTE_SHORTCUT}</kbd>{' '}
            粘贴 ljson 数据即可自动解析
          </p>
          <p className="text-xs text-muted-foreground/60">或点击下方按钮手动输入</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <ClipboardPaste className="h-4 w-4 mr-2" />
          粘贴 ljson 数据
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8">
      <LjsonInputDialog open={open} onOpenChange={setOpen} onConfirm={handleConfirmFromDialog} />
      <RawTextDialog open={rawTextOpen} onOpenChange={setRawTextOpen} rawText={rawLjsonText} />

      <div className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-3 px-4 py-2 bg-background/80 backdrop-blur-sm border-b border-border/40">
        {/* 左侧：操作按钮组 */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar -my-1 py-1 flex-1 min-w-0">
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <ClipboardPaste className="h-3.5 w-3.5 mr-1.5" />
            重新导入
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClear}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            清空
          </Button>

          <div className="h-4 w-px bg-border mx-1 shrink-0" />

          <Button size="sm" variant="ghost" onClick={expandAll} title="全部展开">
            <UnfoldVertical className="h-3.5 w-3.5 mr-1.5" />
            展开
          </Button>
          <Button size="sm" variant="ghost" onClick={collapseAll} title="全部折叠">
            <FoldVertical className="h-3.5 w-3.5 mr-1.5" />
            折叠
          </Button>

          <div className="h-4 w-px bg-border mx-1 shrink-0" />

          <Button size="sm" variant="ghost" onClick={() => setRawTextOpen(true)} title="查看原始 ljson 文本">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            原始文本
          </Button>

          {mergedJson && (
            <>
              <div className="h-4 w-px bg-border mx-1 shrink-0" />
              <CopyButton text={mergedJson} mode="icon-text" size="sm" variant="ghost" copyText="复制全部 JSON" />
            </>
          )}
        </div>

        {/* 右侧：统计 Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="secondary" className="text-[10px] h-5">
            共 {blocks.length} 条
          </Badge>
          {validCount > 0 && (
            <Badge className="text-[10px] h-5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15">
              {validCount} 成功
            </Badge>
          )}
          {invalidCount > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5">
              {invalidCount} 失败
            </Badge>
          )}
        </div>
      </div>

      <div className="divide-y divide-border/40">
        {blocks.map((block) => (
          <div key={block.index} className="py-3 first:pt-0 last:pb-0">
            <LjsonBlock block={block} collapsed={collapsedSet.has(block.index)} onToggle={toggleBlock} />
          </div>
        ))}
      </div>

      <ScrollToTop />
    </div>
  );
}
