import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/utils';

interface ResizablePanelsProps {
  /** 左侧/上方面板内容 */
  left: React.ReactNode;
  /** 右侧/下方面板内容 */
  right: React.ReactNode;
  /** 初始左侧宽度百分比，默认 50 */
  defaultLeftPercent?: number;
  /** 最小宽度百分比，默认 20 */
  minPercent?: number;
  /** 最大宽度百分比，默认 80 */
  maxPercent?: number;
  /** 是否隐藏左侧面板（用于全屏模式） */
  hideLeft?: boolean;
  /** 容器类名 */
  className?: string;
  /** 左侧面板类名 */
  leftClassName?: string;
  /** 右侧面板类名 */
  rightClassName?: string;
  /** 方向：horizontal 水平分割（默认），vertical 垂直分割 */
  direction?: 'horizontal' | 'vertical';
}

/**
 * 可拖动调整大小的双面板组件
 *
 * 桌面端（lg 及以上）显示为左右/上下布局，可拖动分隔条调整比例
 * 移动端显示为上下堆叠布局
 */
export function ResizablePanels({
  left,
  right,
  defaultLeftPercent = 50,
  minPercent = 20,
  maxPercent = 80,
  hideLeft = false,
  className,
  leftClassName,
  rightClassName,
  direction = 'horizontal',
}: ResizablePanelsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
  const [isDragging, setIsDragging] = useState(false);

  const isHorizontal = direction === 'horizontal';

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const clientPos = 'touches' in e ? e.touches[0] : e;

      let newPercent: number;
      if (isHorizontal) {
        newPercent = ((clientPos.clientX - rect.left) / rect.width) * 100;
      } else {
        newPercent = ((clientPos.clientY - rect.top) / rect.height) * 100;
      }

      setLeftPercent(Math.min(maxPercent, Math.max(minPercent, newPercent)));
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isHorizontal, minPercent, maxPercent]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col lg:flex-row overflow-hidden',
        isHorizontal ? 'lg:flex-row' : 'lg:flex-col',
        isDragging && 'select-none',
        className,
      )}
    >
      {/* 左侧/上方面板 */}
      <div
        className={cn(
          'flex flex-col min-h-[300px] lg:min-h-0 min-w-0 border-b lg:border-b-0 border-border',
          isHorizontal ? 'lg:border-b-0' : 'lg:border-r-0 lg:border-b',
          hideLeft && 'hidden',
          leftClassName,
        )}
        style={{ flex: `0 0 ${leftPercent}%` }}
      >
        {left}
      </div>

      {/* 拖动分隔条 - 仅桌面端显示 */}
      {!hideLeft && (
        <div
          className={cn(
            'hidden lg:flex items-center justify-center transition-colors group',
            isHorizontal
              ? 'w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30'
              : 'h-1 cursor-row-resize hover:bg-primary/20 active:bg-primary/30',
          )}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div
            className={cn(
              'rounded-full bg-border group-hover:bg-primary/50 group-active:bg-primary transition-colors',
              isHorizontal ? 'w-0.5 h-8' : 'h-0.5 w-8',
            )}
          />
        </div>
      )}

      {/* 右侧/下方面板 */}
      <div className={cn('flex flex-col flex-1 min-h-[300px] lg:min-h-0 min-w-0', rightClassName)}>{right}</div>
    </div>
  );
}
