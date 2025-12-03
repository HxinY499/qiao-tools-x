import { FileDiff, SquareSplitVertical } from 'lucide-react';
import { useRef } from 'react';

import { CopyButton } from '@/components/copy-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/utils';

import type { DiffLine, DiffViewMode, TextDiffStats } from './types';

interface TextDiffResultViewProps {
  hasResult: boolean;
  lines: DiffLine[];
  syncScroll: boolean;
  onSyncScrollChange: (value: boolean) => void;
  viewMode: DiffViewMode;
  onViewModeChange: (value: DiffViewMode) => void;
  summaryText: string;
  stats: TextDiffStats;
}

function getRowClassName(type: DiffLine['type']): string {
  if (type === 'added') {
    return 'bg-emerald-500/10 dark:bg-emerald-500/15 border-l-2 border-emerald-500/70';
  }

  if (type === 'removed') {
    return 'bg-red-500/10 dark:bg-red-500/15 border-l-2 border-red-500/70';
  }

  if (type === 'modified') {
    return 'bg-amber-500/10 dark:bg-amber-500/15 border-l-2 border-amber-500/70';
  }

  return 'border-l border-border/60';
}

function renderSegments(line: DiffLine, side: 'left' | 'right') {
  const segments = side === 'left' ? line.leftSegments : line.rightSegments;

  if (!segments.length) {
    return <span className="text-muted-foreground/50">&nbsp;</span>;
  }

  return segments.map((segment, index) => {
    const isAdded = segment.type === 'added';
    const isRemoved = segment.type === 'removed';

    const highlightClassName = cn(
      'whitespace-pre-wrap break-words',
      isAdded && side === 'right' && 'bg-emerald-500/30 text-emerald-950 dark:text-emerald-50',
      isRemoved && side === 'left' && 'bg-red-500/30 text-red-950 dark:text-red-50',
    );

    if (!isAdded && !isRemoved) {
      return (
        <span key={index} className="whitespace-pre-wrap break-words">
          {segment.value}
        </span>
      );
    }

    return (
      <span key={index} className={highlightClassName}>
        {segment.value}
      </span>
    );
  });
}

export function TextDiffResultView({
  hasResult,
  lines,
  syncScroll,
  onSyncScrollChange,
  viewMode,
  onViewModeChange,
  summaryText,
  stats,
}: TextDiffResultViewProps) {
  const leftResultRef = useRef<HTMLDivElement | null>(null);
  const rightResultRef = useRef<HTMLDivElement | null>(null);
  const isSyncingScrollRef = useRef(false);

  const handleSyncScroll = (source: 'left' | 'right', event: React.UIEvent<HTMLDivElement>) => {
    if (!syncScroll) {
      return;
    }

    if (isSyncingScrollRef.current) {
      return;
    }

    const targetRef = source === 'left' ? rightResultRef : leftResultRef;
    const target = targetRef.current;

    if (!target) {
      return;
    }

    isSyncingScrollRef.current = true;
    target.scrollTop = event.currentTarget.scrollTop;

    window.requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  };

  return (
    <Card className="shadow-sm border bg-card/80 backdrop-blur">
      <CardHeader className="pb-3 border-b border-border/60 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <SquareSplitVertical className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base lg:text-lg">对比结果</CardTitle>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end">
            <div className="flex items-center gap-2">
              <Label htmlFor="view-mode" className="text-xs text-muted-foreground">
                仅显示差异
              </Label>
              <Switch
                id="view-mode"
                checked={viewMode === 'changes'}
                onCheckedChange={(checked) => onViewModeChange(checked ? 'changes' : 'all')}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sync-scroll" className="text-xs text-muted-foreground">
                同步滚动
              </Label>
              <Switch id="sync-scroll" checked={syncScroll} onCheckedChange={onSyncScrollChange} />
            </div>
            <CopyButton
              text={summaryText}
              mode="icon-text"
              variant="outline"
              size="sm"
              disabled={!hasResult || !summaryText}
              copyText="复制对比结果"
              successText="已复制"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            新增行
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            删除行
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            修改行
          </Badge>
          <span className="ml-auto flex flex-wrap gap-3">
            <span>
              左侧：{stats.leftLineCount} 行 / {stats.leftCharCount} 字符
            </span>
            <span>
              右侧：{stats.rightLineCount} 行 / {stats.rightCharCount} 字符
            </span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {hasResult ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div
              ref={leftResultRef}
              onScroll={(event) => handleSyncScroll('left', event)}
              className="relative border rounded-md bg-background/80 max-h-[520px] lg:max-h-[620px] overflow-auto text-xs md:text-sm custom-scrollbar"
            >
              <div className="sticky top-0 z-10 flex border-b border-border/70 bg-muted/80 backdrop-blur px-2 py-1 text-[11px] md:text-xs text-muted-foreground">
                <span className="w-14 text-right pr-2">行号</span>
                <span className="flex-1">左侧</span>
              </div>
              <div>
                {lines.map((line) => (
                  <div
                    key={line.index}
                    className={cn(
                      'flex border-b border-border/60 last:border-b-0 text-[11px] md:text-xs',
                      getRowClassName(line.type),
                    )}
                  >
                    <div className="w-14 shrink-0 px-2 py-1 text-right text-muted-foreground">
                      {line.leftLineNumber ?? ''}
                    </div>
                    <div className="flex-1 px-2 py-1 font-mono leading-relaxed">{renderSegments(line, 'left')}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              ref={rightResultRef}
              onScroll={(event) => handleSyncScroll('right', event)}
              className="relative border rounded-md bg-background/80 max-h-[520px] lg:max-h-[620px] overflow-auto text-xs md:text-sm custom-scrollbar"
            >
              <div className="sticky top-0 z-10 flex border-b border-border/70 bg-muted/80 backdrop-blur px-2 py-1 text-[11px] md:text-xs text-muted-foreground">
                <span className="w-14 text-right pr-2">行号</span>
                <span className="flex-1">右侧</span>
              </div>
              <div>
                {lines.map((line) => (
                  <div
                    key={line.index}
                    className={cn(
                      'flex border-b border-border/60 last:border-b-0 text-[11px] md:text-xs',
                      getRowClassName(line.type),
                    )}
                  >
                    <div className="w-14 shrink-0 px-2 py-1 text-right text-muted-foreground">
                      {line.rightLineNumber ?? ''}
                    </div>
                    <div className="flex-1 px-2 py-1 font-mono leading-relaxed">{renderSegments(line, 'right')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground/70 text-sm">
            <FileDiff className="h-10 w-10 opacity-30" />
            <p>等待对比结果，先在上方输入文本并点击“开始对比”。</p>
            <p className="text-xs max-w-md text-center">
              所有计算均在浏览器本地完成，不会上传任何文本内容，适合用来对比配置文件、接口响应或代码片段。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
