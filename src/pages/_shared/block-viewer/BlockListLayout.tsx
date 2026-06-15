import { useVirtualizer } from '@tanstack/react-virtual';
import type { LucideIcon } from 'lucide-react';
import { ClipboardPaste, FileText, FoldVertical, Search, Trash2, UnfoldVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/utils';

import { FindBar } from './FindBar';
import { PASTE_SHORTCUT } from './isMac';
import { ScrollToTop } from './ScrollToTop';
import { useBlockViewerSettings } from './settings-store';
import type { BaseBlock, BaseParseResult, BlockViewerController } from './useBlockViewer';

interface BlockListLayoutProps<B extends BaseBlock, R extends BaseParseResult<B>> {
  controller: BlockViewerController<B, R>;
  /** 空状态图标 */
  emptyIcon: LucideIcon;
  /** 空状态/按钮里的数据类型文案，如 "SSE" / "ljson" */
  dataLabel: string;
  /** 原始文本按钮的 title */
  rawTextTitle: string;
  /** 渲染单个 block（页面注入，处理各自的块类型差异）。highlight 为是否启用语法高亮 */
  renderBlock: (block: B, collapsed: boolean, highlight: boolean) => ReactNode;
  /** 顶栏右侧统计 Badge 区（页面注入，处理各自统计字段差异） */
  renderStats: () => ReactNode;
}

/** 块查看类工具的通用布局：空状态 + 顶栏 + 块列表 + 回到顶部 */
export function BlockListLayout<B extends BaseBlock, R extends BaseParseResult<B>>({
  controller,
  emptyIcon: EmptyIcon,
  dataLabel,
  rawTextTitle,
  renderBlock,
  renderStats,
}: BlockListLayoutProps<B, R>) {
  const {
    result,
    collapsedSet,
    mergedJson,
    setOpen,
    setRawTextOpen,
    handleClear,
    expandAll,
    collapseAll,
    findOpen,
    setFindOpen,
    highlightedIndex,
    registerScroller,
  } = controller;

  const { highlightEnabled, virtualScrollEnabled, setHighlightEnabled, setVirtualScrollEnabled } =
    useBlockViewerSettings();

  const blocks = result.blocks;

  // `/` 键打开查找栏（聚焦在非输入元素时）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || findOpen) return;
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      setFindOpen(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [findOpen, setFindOpen]);

  if (blocks.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-5 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
          <EmptyIcon className="h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-sm text-muted-foreground">
            直接按 <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[11px] font-mono">{PASTE_SHORTCUT}</kbd>{' '}
            粘贴 {dataLabel} 数据即可自动解析
          </p>
          <p className="text-xs text-muted-foreground/60">或点击下方按钮手动输入</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <ClipboardPaste className="h-4 w-4 mr-2" />
          粘贴 {dataLabel} 数据
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 pb-5">
      <div className="sticky top-0 z-30 -mx-4 mb-4 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="flex items-center gap-3 px-4 py-2">
          {/* 左侧：操作按钮组（小屏可横向滚动，不再折行） */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar -my-1 py-1 flex-1 min-w-0">
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <ClipboardPaste className="h-3.5 w-3.5 mr-1.5" />
              重新导入
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClear}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              清空
            </Button>

            <div className="h-4 w-px bg-border mx-1 shrink-0" />

            <Button size="sm" variant="ghost" onClick={expandAll} title="全部展开">
              <UnfoldVertical className="h-3.5 w-3.5 mr-1.5" />
              展开
            </Button>
            <Button size="sm" variant="ghost" onClick={collapseAll} title="全部折叠">
              <FoldVertical className="h-3.5 w-3.5 mr-1.5" />
              折叠
            </Button>

            <div className="h-4 w-px bg-border mx-1 shrink-0" />

            <Button size="sm" variant="ghost" onClick={() => setRawTextOpen(true)} title={rawTextTitle}>
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              原始文本
            </Button>

            <Button
              size="sm"
              variant={findOpen ? 'secondary' : 'ghost'}
              onClick={() => setFindOpen(!findOpen)}
              title="查找并定位（/）"
            >
              <Search className="h-3.5 w-3.5 mr-1.5" />
              查找
            </Button>

            {mergedJson && (
              <>
                <div className="h-4 w-px bg-border mx-1 shrink-0" />
                <CopyButton text={mergedJson} mode="icon-text" size="sm" variant="ghost" copyText="复制全部 JSON" />
              </>
            )}

            <div className="h-4 w-px bg-border mx-1 shrink-0" />

            {/* 性能开关：语法高亮 / 虚拟滚动 */}
            <div className="flex items-center gap-1.5 shrink-0 pl-0.5">
              <Switch id="bv-highlight" checked={highlightEnabled} onCheckedChange={setHighlightEnabled} />
              <Label htmlFor="bv-highlight" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                语法高亮
              </Label>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 pl-2">
              <Switch id="bv-virtual" checked={virtualScrollEnabled} onCheckedChange={setVirtualScrollEnabled} />
              <Label
                htmlFor="bv-virtual"
                className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
                title="开启后仅渲染可视区域的块，浏览器查找（Ctrl/Cmd+F）将无法定位到视口外的块"
              >
                虚拟滚动
              </Label>
            </div>
          </div>

          {/* 右侧：统计 Badges（锁住不折行、不参与横滚） */}
          <div className="flex items-center gap-1.5 shrink-0">{renderStats()}</div>
        </div>

        {/* 查找栏：与顶栏同处 sticky 容器内，一起吸顶 */}
        {findOpen && (
          <div className="px-4 pb-2">
            <FindBar controller={controller} />
          </div>
        )}
      </div>

      {virtualScrollEnabled && (
        <p className="mb-3 text-[11px] text-amber-600 dark:text-amber-400">
          虚拟滚动已开启：仅渲染可视区域的块，浏览器查找（Ctrl/Cmd+F）无效。请用上方「查找」按钮（或按 /）搜索并定位。
        </p>
      )}

      {virtualScrollEnabled ? (
        <VirtualBlockList
          blocks={blocks}
          collapsedSet={collapsedSet}
          highlightEnabled={highlightEnabled}
          highlightedIndex={highlightedIndex}
          registerScroller={registerScroller}
          renderBlock={renderBlock}
        />
      ) : (
        <div className="divide-y divide-border/40">
          {blocks.map((block) => (
            <div
              key={block.index}
              data-block-index={block.index}
              className={cn(
                'block-cv py-3 first:pt-0 last:pb-0 transition-shadow',
                highlightedIndex === block.index &&
                  'rounded-md ring-2 ring-primary ring-offset-2 ring-offset-background',
              )}
            >
              {renderBlock(block, collapsedSet.has(block.index), highlightEnabled)}
            </div>
          ))}
        </div>
      )}

      <ScrollToTop />
    </div>
  );
}

/** 查找最近的可滚动祖先（只看 overflow 样式，不依赖当前尺寸），找不到回退 document 滚动元素 */
function findScrollAncestor(el: HTMLElement | null): HTMLElement {
  let node = el?.parentElement ?? null;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return node;
    }
    node = node.parentElement;
  }
  return document.scrollingElement as HTMLElement;
}

/** 虚拟滚动列表：自动绑定最近的可滚动祖先容器（工具内容区在 tool-page 的 overflow-y-auto 容器内滚动） */
function VirtualBlockList<B extends BaseBlock>({
  blocks,
  collapsedSet,
  highlightEnabled,
  highlightedIndex,
  registerScroller,
  renderBlock,
}: {
  blocks: B[];
  collapsedSet: Set<number>;
  highlightEnabled: boolean;
  highlightedIndex: number | null;
  registerScroller: (fn: ((index: number) => void) | null) => void;
  renderBlock: (block: B, collapsed: boolean, highlight: boolean) => ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  // 挂载后定位真正的滚动容器（不是 window，而是 tool-page 内 overflow-y-auto 的 div），
  // 并记录列表相对该容器【内容顶部】的偏移（顶栏/提示语占位）。
  useLayoutEffect(() => {
    const scroller = findScrollAncestor(listRef.current);
    setScrollEl(scroller);
    if (listRef.current && scroller) {
      const listTop = listRef.current.getBoundingClientRect().top;
      const scrollerTop = scroller.getBoundingClientRect().top;
      setScrollMargin(listTop - scrollerTop + scroller.scrollTop);
    }
  }, []);

  const virtualizer = useVirtualizer({
    count: blocks.length,
    getScrollElement: () => scrollEl,
    estimateSize: () => 220,
    overscan: 6,
    scrollMargin,
  });

  // 把 scrollToIndex 能力注册给 controller，供查找定位调用
  useEffect(() => {
    registerScroller((index: number) => {
      // blocks 的 index 字段即数组下标（解析时递增生成），这里直接用
      virtualizer.scrollToIndex(index, { align: 'center' });
    });
    return () => registerScroller(null);
  }, [registerScroller, virtualizer]);

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={listRef} className="relative" style={{ height: virtualizer.getTotalSize() }}>
      <div
        className="absolute left-0 top-0 w-full divide-y divide-border/40"
        style={{ transform: `translateY(${(items[0]?.start ?? 0) - scrollMargin}px)` }}
      >
        {items.map((virtualItem) => {
          const block = blocks[virtualItem.index];
          return (
            <div
              key={block.index}
              data-index={virtualItem.index}
              data-block-index={block.index}
              ref={virtualizer.measureElement}
              className={cn(
                'py-3 transition-shadow',
                highlightedIndex === block.index &&
                  'rounded-md ring-2 ring-primary ring-offset-2 ring-offset-background',
              )}
            >
              {renderBlock(block, collapsedSet.has(block.index), highlightEnabled)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
