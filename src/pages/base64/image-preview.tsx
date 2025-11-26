import { useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

type ImagePreviewProps = {
  imageUrl: string | null;
  placeholder?: string;
};

export function ImagePreview({ imageUrl, placeholder }: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasImage = Boolean(imageUrl);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border bg-muted/40 p-3 flex items-center justify-center min-h-[160px]">
        {hasImage ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded-md"
            aria-label="点击放大预览图片"
          >
            <img
              src={imageUrl || ''}
              alt="图片预览"
              className="max-h-60 max-w-full object-contain transition-transform group-hover:scale-[1.02]"
            />
          </button>
        ) : (
          <p className="text-[11px] text-muted-foreground text-center">{placeholder || '预览'}</p>
        )}
      </div>

      {hasImage ? (
        <DialogContent className="max-w-4xl border bg-background/95">
          <div className="w-full flex items-center justify-center">
            <img src={imageUrl || ''} alt="图片大图预览" className="max-h-[80vh] w-full object-contain" />
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
