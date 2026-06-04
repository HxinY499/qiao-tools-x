import { CodeArea } from '@/components/code-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RawTextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawText: string;
  /** 弹窗标题，如 "SSE 原始文本" */
  title: string;
  /** 弹窗描述 */
  description: string;
}

/** 查看导入时原始文本的弹窗 */
export function RawTextDialog({ open, onOpenChange, rawText, title, description }: RawTextDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          <CodeArea code={rawText} language="text" className="h-[60vh]" codeClassName="!text-[11px]" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
