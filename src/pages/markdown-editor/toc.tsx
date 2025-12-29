import { List, Pin, PinOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TocProps {
  htmlContent: string;
  previewRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  pinned?: boolean;
  onPinChange?: (pinned: boolean) => void;
}

/**
 * 从 HTML 内容中提取标题生成目录
 */
function extractHeadings(html: string): TocItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

  return Array.from(headings).map((heading, index) => {
    const level = parseInt(heading.tagName[1], 10);
    const text = heading.textContent?.trim() || '';
    // 生成唯一 ID
    const id = heading.id || `heading-${index}`;
    return { id, text, level };
  });
}

/**
 * 为预览区的标题添加 ID（如果没有的话）
 */
function ensureHeadingIds(previewElement: HTMLElement) {
  const headings = previewElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((heading, index) => {
    if (!heading.id) {
      heading.id = `heading-${index}`;
    }
  });
}

export function Toc({ htmlContent, previewRef, className, pinned, onPinChange }: TocProps) {
  const [activeId, setActiveId] = useState<string>('');

  // 提取目录
  const tocItems = useMemo(() => extractHeadings(htmlContent), [htmlContent]);

  // 确保预览区标题有 ID
  useEffect(() => {
    if (previewRef.current) {
      const article = previewRef.current.querySelector('.markdown-body');
      if (article) {
        ensureHeadingIds(article as HTMLElement);
      }
    }
  }, [htmlContent, previewRef]);

  // 监听滚动，高亮当前可见的标题
  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || tocItems.length === 0) return;

    const handleScroll = () => {
      const article = preview.querySelector('.markdown-body');
      if (!article) return;

      const headings = article.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const scrollTop = preview.scrollTop;
      const offset = 100; // 偏移量，提前高亮

      let currentId = '';
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        const previewRect = preview.getBoundingClientRect();
        const relativeTop = rect.top - previewRect.top + scrollTop;

        if (relativeTop <= scrollTop + offset) {
          currentId = heading.id;
        }
      });

      if (currentId !== activeId) {
        setActiveId(currentId);
      }
    };

    preview.addEventListener('scroll', handleScroll);
    // 初始化时也执行一次
    handleScroll();

    return () => preview.removeEventListener('scroll', handleScroll);
  }, [previewRef, tocItems, activeId]);

  // 点击跳转
  const handleClick = useCallback(
    (id: string) => {
      const preview = previewRef.current;
      if (!preview) return;

      const article = preview.querySelector('.markdown-body');
      if (!article) return;

      const heading = article.querySelector(`#${CSS.escape(id)}`);
      if (heading) {
        const rect = heading.getBoundingClientRect();
        const previewRect = preview.getBoundingClientRect();
        const scrollTop = preview.scrollTop + rect.top - previewRect.top - 20;

        preview.scrollTo({
          top: scrollTop,
          behavior: 'smooth',
        });
        setActiveId(id);
      }
    },
    [previewRef],
  );

  // 没有标题时显示提示
  if (tocItems.length === 0) {
    return (
      <div className={cn('flex flex-col', className)}>
        <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
          <List className="h-3.5 w-3.5" />
          <span>目录</span>
        </div>
        <div className="p-4 text-xs text-muted-foreground text-center">暂无标题</div>
      </div>
    );
  }

  // 计算最小层级，用于缩进
  const minLevel = Math.min(...tocItems.map((item) => item.level));

  return (
    <div className={cn('flex flex-col min-h-0 h-full', className)}>
      {/* 标题栏 */}
      <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border shrink-0">
        <List className="h-3.5 w-3.5" />
        <span>目录</span>
        <span className="text-[10px] opacity-60">{tocItems.length}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-auto"
              onClick={() => onPinChange?.(!pinned)}
            >
              {pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{pinned ? '取消固定' : '固定目录'}</TooltipContent>
        </Tooltip>
      </div>

      {/* 目录列表 */}
      <nav className="flex-1 overflow-auto custom-scrollbar p-2 min-h-0">
        <ul className="space-y-0.5">
          {tocItems.map((item) => (
            <li key={item.id}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClick(item.id)}
                className={cn(
                  'w-full justify-start h-auto py-1.5 px-2 text-xs font-normal',
                  'hover:bg-accent/50 transition-colors',
                  activeId === item.id && 'bg-accent text-accent-foreground font-medium',
                )}
                style={{
                  paddingLeft: `${(item.level - minLevel) * 12 + 8}px`,
                }}
              >
                <span className="truncate">{item.text}</span>
              </Button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
