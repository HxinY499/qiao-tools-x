import { useVirtualizer } from '@tanstack/react-virtual';
import type { LucideIcon } from 'lucide-react';
import {
  ClipboardPaste,
  Eye,
  EyeOff,
  FileText,
  Filter,
  FoldVertical,
  Gauge,
  Highlighter,
  Trash2,
  UnfoldVertical,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/utils';

import { AdaptiveToolbar, type ToolbarUnit } from './AdaptiveToolbar';
import { FindBar } from './FindBar';
import { PASTE_SHORTCUT } from './isMac';
import { ScrollToTop } from './ScrollToTop';
import { useBlockViewerSettings } from './settings-store';
import { StatsSummary } from './StatsSummary';
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
  /** Popover 详情区（页面注入；用 dl/dt/dd 等表格化内容呈现各自的统计字段） */
  renderStatsDetails?: () => ReactNode;
  /** 顶栏快速主徽章（页面注入；通常是「格式」一项） */
  renderPrimaryBadge?: () => ReactNode;
  /** 空状态：可选的「示例数据」按钮（点击后用此文本调用 onLoadExample） */
  exampleText?: string;
}

/** 块查看类工具的通用布局：空状态 + 顶栏 + 块列表 + 回到顶部 */
export function BlockListLayout<B extends BaseBlock, R extends BaseParseResult<B>>({
  controller,
  emptyIcon: EmptyIcon,
  dataLabel,
  rawTextTitle,
  renderBlock,
  renderStatsDetails,
  renderPrimaryBadge,
  exampleText,
}: BlockListLayoutProps<B, R>) {
  const { t, i18n } = useTranslation('blockViewer');
  const {
    result,
    collapsedSet,
    setOpen,
    setRawTextOpen,
    handleClear,
    handleConfirmFromDialog,
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

  // ─── 可折叠工具按钮单元（按「保留优先级」从高到低；空间不足时从末尾起收进菜单）───
  const toolbarUnits = useMemo<ToolbarUnit[]>(() => {
    const arr: ToolbarUnit[] = [];

    // 展开 / 折叠
    arr.push({
      id: 'fold',
      toolbar: (
        <>
          <div className="h-4 w-px bg-border shrink-0" />
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
        </>
      ),
      menu: (
        <>
          <DropdownMenuItem onClick={() => expandAll(filtering ? visibleBlocks.map((b) => b.index) : undefined)}>
            <UnfoldVertical className="h-4 w-4 mr-2" />
            {filtering ? t('toolbar.expandFilteredTitle') : t('toolbar.expandAllTitle')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => collapseAll(filtering ? visibleBlocks.map((b) => b.index) : undefined)}>
            <FoldVertical className="h-4 w-4 mr-2" />
            {filtering ? t('toolbar.collapseFilteredTitle') : t('toolbar.collapseAllTitle')}
          </DropdownMenuItem>
        </>
      ),
    });

    // 语法高亮
    arr.push({
      id: 'highlight',
      toolbar: (
        <>
          <div className="h-4 w-px bg-border shrink-0" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setHighlightEnabled(!highlightEnabled)}
            title={t('toolbar.syntaxHighlight')}
            className={cn(
              highlightEnabled &&
                'border border-primary/60 text-primary bg-primary/5 hover:bg-primary/10 hover:text-primary',
            )}
          >
            <Highlighter className="h-3.5 w-3.5 mr-1.5" />
            {t('toolbar.syntaxHighlight')}
          </Button>
        </>
      ),
      menu: (
        <DropdownMenuItem className="cursor-default focus:bg-transparent" onSelect={(e) => e.preventDefault()}>
          <Switch id="bv-highlight" checked={highlightEnabled} onCheckedChange={setHighlightEnabled} className="mr-2" />
          <Label htmlFor="bv-highlight" className="text-xs cursor-pointer">
            {t('toolbar.syntaxHighlight')}
          </Label>
        </DropdownMenuItem>
      ),
    });

    // 清空数据（destructive）
    arr.push({
      id: 'clear',
      toolbar: (
        <>
          <div className="h-4 w-px bg-border shrink-0" />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            title={t('toolbar.clear')}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {t('toolbar.clear')}
          </Button>
        </>
      ),
      menu: (
        <DropdownMenuItem
          onClick={handleClear}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {t('toolbar.clear')}
        </DropdownMenuItem>
      ),
    });

    // 虚拟滚动（低频，优先收起）
    arr.push({
      id: 'virtual',
      toolbar: (
        <>
          <div className="h-4 w-px bg-border shrink-0" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setVirtualScrollEnabled(!virtualScrollEnabled)}
            title={t('toolbar.virtualScrollTitle')}
            className={cn(
              virtualScrollEnabled &&
                'border border-primary/60 text-primary bg-primary/5 hover:bg-primary/10 hover:text-primary',
            )}
          >
            <Gauge className="h-3.5 w-3.5 mr-1.5" />
            {t('toolbar.virtualScroll')}
          </Button>
        </>
      ),
      menu: (
        <DropdownMenuItem className="cursor-default focus:bg-transparent" onSelect={(e) => e.preventDefault()}>
          <Switch
            id="bv-virtual"
            checked={virtualScrollEnabled}
            onCheckedChange={setVirtualScrollEnabled}
            className="mr-2"
          />
          <Label htmlFor="bv-virtual" className="text-xs cursor-pointer" title={t('toolbar.virtualScrollTitle')}>
            {t('toolbar.virtualScroll')}
          </Label>
        </DropdownMenuItem>
      ),
    });

    return arr;
  }, [
    t,
    filtering,
    visibleBlocks,
    expandAll,
    collapseAll,
    highlightEnabled,
    setHighlightEnabled,
    handleClear,
    virtualScrollEnabled,
    setVirtualScrollEnabled,
  ]);

  // 测量重置键：语言 / 是否过滤态（影响展开折叠文案宽度）变化时重新测量
  const measureKey = `${i18n.language}|${filtering ? 1 : 0}`;

  if (blocks.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-6 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
          <EmptyIcon className="h-10 w-10 text-primary/60" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-lg font-semibold text-foreground">{t('empty.heading', { label: dataLabel })}</h2>
          <p className="text-sm text-muted-foreground">{t('empty.subheading')}</p>
          <p className="text-xs text-muted-foreground/80 pt-1">
            <Trans
              t={t}
              i18nKey="empty.hint"
              values={{ shortcut: PASTE_SHORTCUT, label: dataLabel }}
              components={{
                kbd: <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[11px] font-mono" />,
              }}
            />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setOpen(true)}>
            <ClipboardPaste className="h-4 w-4 mr-2" />
            {t('empty.pasteButton', { label: dataLabel })}
          </Button>
          {exampleText && (
            <Button variant="outline" onClick={() => handleConfirmFromDialog(exampleText)}>
              <FileText className="h-4 w-4 mr-2" />
              {t('empty.example')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 pb-5">
      <div className="sticky top-0 z-30 -mx-4 mb-4 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <AdaptiveToolbar
          measureKey={measureKey}
          moreLabel={t('toolbar.more')}
          units={toolbarUnits}
          leading={
            <>
              {/* 数据导入（始终可见） */}
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                  <ClipboardPaste className="h-3.5 w-3.5 mr-1.5" />
                  {t('toolbar.reimport')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRawTextOpen(true)} title={rawTextTitle}>
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  {t('toolbar.rawText')}
                </Button>
              </div>

              <div className="h-4 w-px bg-border shrink-0" />

              {/* 过滤（始终可见） */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFindOpen(!findOpen)}
                  title={t('toolbar.findTitle')}
                  className={cn(
                    findOpen &&
                      'border border-primary/60 text-primary bg-primary/5 hover:bg-primary/10 hover:text-primary',
                  )}
                >
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  {t('toolbar.find')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowMatchedOnly(!showMatchedOnly)}
                  disabled={!hasQuery}
                  title={hasQuery ? t('toolbar.showMatchedOnlyTitle') : t('toolbar.showMatchedOnlyDisabled')}
                  className={cn(
                    filtering &&
                      'border border-primary/60 text-primary bg-primary/5 hover:bg-primary/10 hover:text-primary',
                  )}
                >
                  {filtering ? <Eye className="h-3.5 w-3.5 mr-1.5" /> : <EyeOff className="h-3.5 w-3.5 mr-1.5" />}
                  {t('toolbar.showMatchedOnly')}
                </Button>
              </div>
            </>
          }
          trailing={
            <StatsSummary
              total={blocks.length}
              matchCount={hasQuery ? matches.length : null}
              primaryBadge={renderPrimaryBadge?.()}
              details={renderStatsDetails?.()}
            />
          }
        />

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
