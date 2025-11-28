import { useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ImageProps {
  /**
   * 图片的 URL（必填）
   */
  src: string | null;
  /**
   * 图片的 alt 文本
   */
  alt: string;
  /**
   * 是否启用点击放大预览功能
   * @default false
   */
  canPreview?: boolean;
  /**
   * 图片加载失败或 src 为空时显示的占位文本
   * @default '图片加载失败'
   */
  placeholder?: string;
  /**
   * 图片容器的自定义类名
   */
  className?: string;
  /**
   * 图片本身的自定义类名
   */
  imgClassName?: string;
  /**
   * 放大预览对话框的最大宽度类名
   * @default 'max-w-4xl'
   */
  dialogMaxWidth?: string;
}

export function Image({
  src,
  alt,
  canPreview = false,
  placeholder = '图片加载失败',
  className = '',
  imgClassName = 'max-h-72 object-contain',
  dialogMaxWidth = 'max-w-4xl',
}: ImageProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 没有图片或加载失败时显示占位符
  if (!src || hasError) {
    return (
      <div
        className={`relative rounded-lg border bg-background min-h-[180px] flex items-center justify-center ${className}`}
      >
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground px-4 text-center">
          {placeholder}
        </div>
      </div>
    );
  }

  // 有图片且启用缩放
  if (canPreview) {
    return (
      <>
        <div
          className={`relative rounded-lg border bg-background min-h-[180px] flex items-center justify-center overflow-hidden ${className}`}
        >
          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            className="group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded-md"
            aria-label={`点击放大预览${alt}`}
          >
            <img
              src={src}
              alt={alt}
              className={`${imgClassName} transition-transform group-hover:scale-[1.02]`}
              onError={() => setHasError(true)}
            />
          </button>
        </div>

        <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
          <DialogContent className={`${dialogMaxWidth} border bg-background/95`}>
            <div className="w-full flex items-center justify-center">
              <img src={src} alt={`${alt}大图预览`} className="max-h-[80vh] w-full object-contain" />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // 有图片但不启用缩放
  return (
    <div
      className={`relative rounded-lg border bg-background min-h-[180px] flex items-center justify-center overflow-hidden ${className}`}
    >
      <img src={src} alt={alt} className={imgClassName} onError={() => setHasError(true)} />
    </div>
  );
}
