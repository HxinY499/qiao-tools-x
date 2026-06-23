import { useVirtualizer } from '@tanstack/react-virtual';
import type { LucideIcon } from 'lucide-react';
import { ClipboardPaste, FileText, Filter, FoldVertical, Search, Trash2, UnfoldVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { CopyButton } from '@/components/copy-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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
  const { t } = useTranslation('blockViewer');
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
    conditions,
    matches,
    highlightedIndex,
    highlightNonce,
    registerScroller,
  } = controller;

  const {
    highlightEnabled,
    virtualScrollEnabled,
    showMatchedOnly,
    setHighlightEnabled,
    setVirtualScrollEnabled,
    setShowMatchedOnly,
  } = useBlockViewerSettings();

  const blocks = result.blocks;
  const hasQuery = conditions.some((c) => c.value.length > 0);

  // 是否启用"仅显示匹配"过滤：开关开启 + 有查询
  const filtering = showMatchedOnly && hasQuery;

  // 渲染用的 blocks：过滤模式下只保留命中块
  const visibleBlocks = useMemo(() => {
    if (!filtering) return blocks;
    const matchSet = new Set(matches);
    return blocks.filter((b) => matchSet.has(b.index));
  }, [blocks, matches, filtering]);

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
            <Trans
              t={t}
              i18nKey="empty.hint"
              values={{ shortcut: PASTE_SHORTCUT, label: dataLabel }}
              components={{
                kbd: <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[11px] font-mono" />,
              }}
            />
          </p>
          <p className="text-xs text-muted-foreground/60">{t('empty.manual')}</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <ClipboardPaste className="h-4 w-4 mr-2" />
          {t('empty.pasteButton', { label: dataLabel })}
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
              {t('toolbar.reimport')}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClear}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {t('toolbar.clear')}
            </Button>

            <div className="h-4 w-px bg-border mx-1 shrink-0" />

            <Button
              size="sm"
              variant="ghost"
              onClick={() => expandAll(filtering ? visibleBlocks.map((b) => b.index) : undefined)}
              title={filtering ? t('toolbar.expandFilteredTitle') : t('toolbar.expandAllTitle')}
            >
              <UnfoldVertical className="h-3.5 w-3.5 mr-1.5" />
              {t('toolbar.expand')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => collapseAll(filtering ? visibleBlocks.map((b) => b.index) : undefined)}
              title={filtering ? t('toolbar.collapseFilteredTitle') : t('toolbar.collapseAllTitle')}
            >
              <FoldVertical className="h-3.5 w-3.5 mr-1.5" />
              {t('toolbar.collapse')}
            </Button>

            <div className="h-4 w-px bg-border mx-1 shrink-0" />

            <Button size="sm" variant="ghost" onClick={() => setRawTextOpen(true)} title={rawTextTitle}>
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              {t('toolbar.rawText')}
            </Button>

            <Button
              size="sm"
              variant={findOpen ? 'secondary' : 'ghost'}
              onClick={() => setFindOpen(!findOpen)}
              title={t('toolbar.findTitle')}
            >
              <Search className="h-3.5 w-3.5 mr-1.5" />
              {t('toolbar.find')}
            </Button>

            <Button
              size="sm"
              variant={filtering ? 'secondary' : 'ghost'}
              onClick={() => setShowMatchedOnly(!showMatchedOnly)}
              disabled={!hasQuery}
              title={hasQuery ? t('toolbar.showMatchedOnlyTitle') : t('toolbar.showMatchedOnlyDisabled')}
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              {t('toolbar.showMatchedOnly')}
            </Button>

            {mergedJson && (
              <>
                <div className="h-4 w-px bg-border mx-1 shrink-0" />
                <CopyButton
                  text={mergedJson}
                  mode="icon-text"
                  size="sm"
                  variant="ghost"
                  copyText={t('toolbar.copyAllJson')}
                />
              </>
            )}

            <div className="h-4 w-px bg-border mx-1 shrink-0" />

            {/* 性能开关：语法高亮 / 虚拟滚动 */}
            <div className="flex items-center gap-1.5 shrink-0 pl-0.5">
              <Switch id="bv-highlight" checked={highlightEnabled} onCheckedChange={setHighlightEnabled} />
              <Label htmlFor="bv-highlight" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                {t('toolbar.syntaxHighlight')}
              </Label>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 pl-2">
              <Switch id="bv-virtual" checked={virtualScrollEnabled} onCheckedChange={setVirtualScrollEnabled} />
              <Label
                htmlFor="bv-virtual"
                className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
                title={t('toolbar.virtualScrollTitle')}
              >
                {t('toolbar.virtualScroll')}
              </Label>
            </div>
          </div>

          {/* 右侧：统计 Badges（锁住不折行、不参与横滚） */}
          <div className="flex items-center gap-1.5 shrink-0">
            {hasQuery && (
              <Badge
                variant="outline"
                className="text-[10px] h-5 font-mono tabular-nums"
                title={t('toolbar.matchCountTitle')}
              >
                {matches.length} / {blocks.length}
              </Badge>
            )}
            {renderStats()}
          </div>
        </div>

        {/* 查找栏：与顶栏同处 sticky 容器内，一起吸顶 */}
        {findOpen && (
          <div className="px-4 pb-2">
            <FindBar controller={controller} />
          </div>
        )}
      </div>

      {virtualScrollEnabled && (
        <p className="mb-3 text-[11px] text-amber-600 dark:text-amber-400">{t('toolbar.virtualScrollHint')}</p>
      )}

      {filtering && visibleBlocks.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">{t('list.noMatches')}</div>
      ) : virtualScrollEnabled ? (
        <VirtualBlockList
          blocks={visibleBlocks}
          collapsedSet={collapsedSet}
          highlightEnabled={highlightEnabled}
          highlightedIndex={highlightedIndex}
          highlightNonce={highlightNonce}
          registerScroller={registerScroller}
          renderBlock={renderBlock}
        />
      ) : (
        <div className="divide-y divide-border/40">
          {visibleBlocks.map((block) => {
            const isHighlighted = highlightedIndex === block.index;
            return (
              <div key={block.index} data-block-index={block.index} className="block-cv py-3 first:pt-0 last:pb-0">
                {isHighlighted ? (
                  // 用 nonce 作 key 让定位时重新挂载，重启脉冲动画
                  <div key={highlightNonce} className="block-viewer-highlight">
                    {renderBlock(block, collapsedSet.has(block.index), highlightEnabled)}
                  </div>
                ) : (
                  renderBlock(block, collapsedSet.has(block.index), highlightEnabled)
                )}
              </div>
            );
          })}
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
  highlightNonce,
  registerScroller,
  renderBlock,
}: {
  blocks: B[];
  collapsedSet: Set<number>;
  highlightEnabled: boolean;
  highlightedIndex: number | null;
  highlightNonce: number;
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

  // block.index → 当前 blocks 数组下标的映射（过滤模式下与 block.index 不再相等）
  const indexMap = useMemo(() => {
    const m = new Map<number, number>();
    blocks.forEach((b, i) => m.set(b.index, i));
    return m;
  }, [blocks]);

  // 把 scrollToIndex 能力注册给 controller，供查找定位调用
  useEffect(() => {
    registerScroller((blockIndex: number) => {
      const arrayIdx = indexMap.get(blockIndex);
      if (arrayIdx === undefined) return;
      virtualizer.scrollToIndex(arrayIdx, { align: 'center' });
    });
    return () => registerScroller(null);
  }, [registerScroller, virtualizer, indexMap]);

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={listRef} className="relative" style={{ height: virtualizer.getTotalSize() }}>
      <div
        className="absolute left-0 top-0 w-full divide-y divide-border/40"
        style={{ transform: `translateY(${(items[0]?.start ?? 0) - scrollMargin}px)` }}
      >
        {items.map((virtualItem) => {
          const block = blocks[virtualItem.index];
          const isHighlighted = highlightedIndex === block.index;
          return (
            <div
              key={block.index}
              data-index={virtualItem.index}
              data-block-index={block.index}
              ref={virtualizer.measureElement}
              className="py-3"
            >
              {isHighlighted ? (
                // 用 nonce 作 key 让定位时重新挂载，重启脉冲动画
                <div key={highlightNonce} className="block-viewer-highlight">
                  {renderBlock(block, collapsedSet.has(block.index), highlightEnabled)}
                </div>
              ) : (
                renderBlock(block, collapsedSet.has(block.index), highlightEnabled)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
