import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/utils';

interface StatsSummaryProps {
  total: number;
  /** 匹配数，null 表示当前未在过滤 */
  matchCount: number | null;
  /** 主徽章（可选；如格式徽章） */
  primaryBadge?: React.ReactNode;
  /** 详情面板内容（页面注入；建议用 StatsRow 拼） */
  details?: React.ReactNode;
}

/**
 * 顶栏右侧统计区。
 * - 默认仅显示一两个最关键的徽章（数量、可选的主徽章）
 * - 点击/悬停后弹出 Popover 展示完整统计细节
 */
export function StatsSummary({ total, matchCount, primaryBadge, details }: StatsSummaryProps) {
  const { t } = useTranslation('blockViewer');
  const hasMatch = matchCount !== null;
  const hasDetails = !!details;

  // 主显示：当有匹配筛选时展示 "命中/总数"；否则只展示总数
  const summary = hasMatch ? (
    <span className="font-mono tabular-nums">
      <span className="text-foreground">{matchCount}</span>
      <span className="text-muted-foreground/60"> / {total}</span>
    </span>
  ) : (
    <span className="font-mono tabular-nums text-foreground">{total}</span>
  );

  const trigger = (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-2 rounded-md border bg-card/50 px-2.5 h-7 text-xs',
        'hover:bg-accent/50 transition-colors',
        hasDetails && 'cursor-pointer',
        !hasDetails && 'cursor-default',
      )}
      title={hasDetails ? t('toolbar.statsTitle') : undefined}
      disabled={!hasDetails}
    >
      {primaryBadge}
      {summary}
    </button>
  );

  if (!hasDetails) return trigger;

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <div className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase mb-2">
          {t('toolbar.statsTitle')}
        </div>
        <dl className="space-y-1.5">{details}</dl>
      </PopoverContent>
    </Popover>
  );
}

interface StatsRowProps {
  label: string;
  value: React.ReactNode;
  /** 行强调色（用于成功/警告/错误等语义） */
  tone?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
}

/** 统计详情面板里的一行（label - value）。在各工具的 renderStatsDetails 里使用。 */
export function StatsRow({ label, value, tone = 'default' }: StatsRowProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'font-mono tabular-nums',
          tone === 'default' && 'text-foreground',
          tone === 'success' && 'text-emerald-600 dark:text-emerald-400',
          tone === 'warning' && 'text-amber-600 dark:text-amber-400',
          tone === 'destructive' && 'text-destructive',
          tone === 'info' && 'text-sky-600 dark:text-sky-400',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** 顶栏主徽章（如格式徽章）的轻量样式 —— 比 shadcn Badge 更瘦 */
export function PrimaryBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Badge variant="secondary" className={cn('h-5 px-1.5 text-[10px] font-medium', className)}>
      {children}
    </Badge>
  );
}
