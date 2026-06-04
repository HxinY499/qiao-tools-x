import { Braces } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { SUBMIT_SHORTCUT } from './isMac';

interface PasteInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (text: string) => void;
  /** 弹窗标题，如 "粘贴 SSE 原始数据" */
  title: string;
  /** 弹窗描述 */
  description: string;
  /** textarea 占位示例 */
  placeholder: string;
}

/** 粘贴原始数据并触发解析的输入弹窗 */
export function PasteInputDialog({ open, onOpenChange, onConfirm, title, description, placeholder }: PasteInputDialogProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 每次弹窗打开时清空 textarea 并聚焦
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <textarea
          ref={textareaRef}
          placeholder={placeholder}
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
            <kbd className="ml-1.5 text-[10px] opacity-60">{SUBMIT_SHORTCUT}</kbd>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
