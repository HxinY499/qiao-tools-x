import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

export type PasteImageDialogProps = {
  onConfirm: (imageUrl: string, description: string) => void;
};

export function PasteImageDialog({ onConfirm }: PasteImageDialogProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setValue('');
      setError('');
      setIsSubmitting(false);
    }
  }, [open]);

  function handleParse() {
    const raw = value.trim();

    if (!raw) {
      setError('请输入要解析的图片 Base64 或 Data URL');
      return;
    }

    setIsSubmitting(true);

    let url = raw;

    if (raw.startsWith('data:image/')) {
      onConfirm(url, '来自 Base64 粘贴的图片');
      setOpen(false);
      return;
    }

    const compact = raw.replace(/\s+/g, '');

    if (compact.length % 4 !== 0 || !base64Pattern.test(compact)) {
      setError('当前内容看起来不是合法的图片 Base64');
      setIsSubmitting(false);
      return;
    }

    url = `data:image/png;base64,${compact}`;
    onConfirm(url, '来自 Base64 粘贴的图片');
    setOpen(false);
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => setOpen(true)}>
        从 Base64 粘贴图片
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">粘贴图片 Base64 / Data URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Textarea
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  if (error) setError('');
                }}
                placeholder="将 data:image/... 或纯 Base64 串粘贴到这里，例如从网络请求或配置文件中复制。"
                className="min-h-[140px] text-xs"
              />
              {error ? (
                <p className="text-[11px] text-destructive mt-1">{error}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-1">
                  支持完整的 Data URL（包含 data:image/...;base64, 前缀）或仅包含 Base64
                  主体的字符串，换行和空白会被自动忽略。
                </p>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">所有解析操作仅在本地完成，不会上传到服务器。</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-3 text-[11px]"
                  onClick={handleParse}
                  disabled={!value.trim() || isSubmitting}
                >
                  解析并预览
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
