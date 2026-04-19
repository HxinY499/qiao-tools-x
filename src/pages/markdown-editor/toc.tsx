import { List, Pin, PinOff } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
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

// ─── 单行（memo 化，activeId 变化只会重渲对应行） ─────────────
interface TocRowProps {
  item: TocItem;
  isActive: boolean;
  indent: number;
  onClick: (id: string) => void;
}

const TocRow = memo(function TocRow({ item, isActive, indent, onClick }: TocRowProps) {
  const handleClick = useCallback(() => onClick(item.id), [onClick, item.id]);
  return (
    <li>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={cn(
          'w-full justify-start h-auto py-1.5 px-2 text-xs font-normal',
          'hover:bg-accent/50 transition-colors',
          isActive && 'bg-accent text-accent-foreground font-medium',
        )}
        style={{ paddingLeft: `${indent}px` }}
      >
        <span className="truncate">{item.text}</span>
      </Button>
    </li>
  );
});

export function Toc({ htmlContent, previewRef, className, pinned, onPinChange }: TocProps) {
  const [activeId, setActiveId] = useState<string>('');

  // 提取目录
  const tocItems = useMemo(() => extractHeadings(htmlContent), [htmlContent]);

  // 计算最小层级（稳定引用，防止 TocRow 的 indent 频繁变化）
  const minLevel = useMemo(
    () => (tocItems.length === 0 ? 0 : Math.min(...tocItems.map((item) => item.level))),
    [tocItems],
  );

  // 确保预览区标题有 ID
  useEffect(() => {
    if (previewRef.current) {
      const article = previewRef.current.querySelector('.markdown-body');
      if (article) {
        ensureHeadingIds(article as HTMLElement);
      }
    }
  }, [htmlContent, previewRef]);

  // 用 ref 持有最新 activeId，避免把它放进 scroll effect 的 deps
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  // 监听滚动，高亮当前可见的标题
  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || tocItems.length === 0) return;

    // 缓存 headings 列表，避免 scroll 里每次都重查 DOM
    let headings: HTMLElement[] = [];
    const refreshHeadings = () => {
      const article = preview.querySelector('.markdown-body');
      headings = article ? (Array.from(article.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[]) : [];
    };
    refreshHeadings();

    const handleScroll = () => {
      if (headings.length === 0) return;
      const scrollTop = preview.scrollTop;
      const offset = 100;
      const previewTop = preview.getBoundingClientRect().top;

      let currentId = '';
      for (const heading of headings) {
        const rect = heading.getBoundingClientRect();
        const relativeTop = rect.top - previewTop + scrollTop;
        if (relativeTop <= scrollTop + offset) {
          currentId = heading.id;
        } else {
          break; // headings 按文档顺序，可以早退
        }
      }

      if (currentId !== activeIdRef.current) {
        setActiveId(currentId);
      }
    };

    preview.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => preview.removeEventListener('scroll', handleScroll);
  }, [previewRef, tocItems]);

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

  return (
    <div className={cn('flex flex-col min-h-0 h-full', className)}>
      {/* 标题栏 */}
      <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border shrink-0">
        <List className="h-3.5 w-3.5" />
        <span>目录</span>
        <span className="text-[10px] opacity-60">{tocItems.length}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => onPinChange?.(!pinned)}>
          {pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
        </Button>
      </div>

      {/* 目录列表 */}
      <nav className="flex-1 overflow-auto custom-scrollbar p-2 min-h-0">
        <ul className="space-y-0.5">
          {tocItems.map((item) => (
            <TocRow
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              indent={(item.level - minLevel) * 12 + 8}
              onClick={handleClick}
            />
          ))}
        </ul>
      </nav>
    </div>
  );
}
