import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

export type PasteImageDialogProps = {
  onConfirm: (imageUrl: string, description: string) => void;
};

export function PasteImageDialog({ onConfirm }: PasteImageDialogProps) {
  const { t } = useTranslation('tools');
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // 关闭时重置内部状态
      setValue('');
      setError('');
      setIsSubmitting(false);
    }
  }

  function handleParse() {
    const raw = value.trim();

    if (!raw) {
      setError(t('base64.dialogErrorEmpty'));
      return;
    }

    setIsSubmitting(true);

    let url = raw;

    if (raw.startsWith('data:image/')) {
      onConfirm(url, t('base64.pastedImageDescription'));
      setOpen(false);
      return;
    }

    const compact = raw.replace(/\s+/g, '');

    if (compact.length % 4 !== 0 || !base64Pattern.test(compact)) {
      setError(t('base64.dialogErrorInvalid'));
      setIsSubmitting(false);
      return;
    }

    url = `data:image/png;base64,${compact}`;
    onConfirm(url, t('base64.pastedImageDescription'));
    setOpen(false);
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => setOpen(true)}>
        {t('base64.btnPasteFromBase64')}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">{t('base64.dialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Textarea
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  if (error) setError('');
                }}
                placeholder={t('base64.dialogPlaceholder')}
                className="min-h-[140px] text-xs"
              />
              {error ? (
                <p className="text-[11px] text-destructive mt-1">{error}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('base64.dialogHint')}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">{t('base64.dialogLocalOnly')}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  {t('base64.btnCancel')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-3 text-[11px]"
                  onClick={handleParse}
                  disabled={!value.trim() || isSubmitting}
                >
                  {t('base64.btnParseAndPreview')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
