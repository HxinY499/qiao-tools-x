import { Braces, ChevronDown, ChevronRight, ClipboardPaste, Radio, Trash2 } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { CodeArea } from '@/components/code-area';
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

import { looksLikeSse, parseSseToJson, SseDataBlock } from './utils';

const SseBlock = memo(function SseBlock({ block }: { block: SseDataBlock }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 mb-1">
        <button
          onClick={() => setCollapsed((v) => !v)}
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
        {!block.valid && (
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
            解析失败
          </Badge>
        )}
      </div>
      {!collapsed &&
        (block.valid ? (
          <CodeArea
            code={JSON.stringify(block.parsed, null, 2)}
            language="json"
            className="min-h-0"
            codeClassName="!text-[11px]"
            showCopyButton={false}
          />
        ) : (
          <div className="space-y-1.5">
            <div className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2 font-mono">
              {block.error}
            </div>
            <CodeArea code={block.raw} language="text" className="min-h-0" codeClassName="!text-[11px]" />
          </div>
        ))}
    </div>
  );
});

export default function SseToJsonPage() {
  const [blocks, setBlocks] = useState<SseDataBlock[]>([]);
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleConfirm = useCallback(() => {
    const value = textareaRef.current?.value ?? '';
    if (!value.trim()) return;
    setBlocks(parseSseToJson(value));
    setOpen(false);
  }, []);

  const handleClear = useCallback(() => {
    setBlocks([]);
  }, []);

  // 监听全局粘贴事件，弹窗打开时不拦截（让 textarea 正常工作）
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // 弹窗打开时跳过，让 textarea 自己处理
      if (open) return;
      const text = e.clipboardData?.getData('text/plain');
      if (!text || !looksLikeSse(text)) return;
      e.preventDefault();
      const result = parseSseToJson(text);
      setBlocks(result);
      toast.success(`已解析 ${result.length} 条 SSE 数据`);
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [open]);

  const validCount = blocks.filter((b) => b.valid).length;
  const invalidCount = blocks.filter((b) => !b.valid).length;

  const dialogContent = (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* DialogTrigger 由外部按钮控制，不在这里放 */}
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
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>
            <Braces className="h-3.5 w-3.5 mr-1.5" />
            解析
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        {dialogContent}
        <Radio className="h-16 w-16 text-muted-foreground/20" />
        <div className="text-center space-y-1.5">
          <p className="text-sm text-muted-foreground">
            直接按 <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[11px] font-mono">Ctrl+V</kbd> 粘贴 SSE
            数据即可自动解析
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
      {dialogContent}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <ClipboardPaste className="h-3.5 w-3.5 mr-1.5" />
            重新导入
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClear}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            清空
          </Button>
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
          {invalidCount > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5">
              {invalidCount} 失败
            </Badge>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {blocks.map((block) => (
          <SseBlock key={block.index} block={block} />
        ))}
      </div>
    </div>
  );
}
