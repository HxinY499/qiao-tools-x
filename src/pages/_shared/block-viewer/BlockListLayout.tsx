import { ClipboardPaste, FileText, FoldVertical, Trash2, UnfoldVertical } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';

import { PASTE_SHORTCUT } from './isMac';
import { ScrollToTop } from './ScrollToTop';
import type { BaseBlock, BlockViewerController, BaseParseResult } from './useBlockViewer';

interface BlockListLayoutProps<B extends BaseBlock, R extends BaseParseResult<B>> {
  controller: BlockViewerController<B, R>;
  /** 空状态图标 */
  emptyIcon: LucideIcon;
  /** 空状态/按钮里的数据类型文案，如 "SSE" / "ljson" */
  dataLabel: string;
  /** 原始文本按钮的 title */
  rawTextTitle: string;
  /** 渲染单个 block（页面注入，处理各自的块类型差异） */
  renderBlock: (block: B, collapsed: boolean) => ReactNode;
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
  } = controller;

  const blocks = result.blocks;

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
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8">
      <div className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-3 px-4 py-2 bg-background/80 backdrop-blur-sm border-b border-border/40">
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

          {mergedJson && (
            <>
              <div className="h-4 w-px bg-border mx-1 shrink-0" />
              <CopyButton text={mergedJson} mode="icon-text" size="sm" variant="ghost" copyText="复制全部 JSON" />
            </>
          )}
        </div>

        {/* 右侧：统计 Badges（锁住不折行、不参与横滚） */}
        <div className="flex items-center gap-1.5 shrink-0">{renderStats()}</div>
      </div>

      <div className="divide-y divide-border/40">
        {blocks.map((block) => (
          <div key={block.index} className="py-3 first:pt-0 last:pb-0">
            {renderBlock(block, collapsedSet.has(block.index))}
          </div>
        ))}
      </div>

      <ScrollToTop />
    </div>
  );
}
