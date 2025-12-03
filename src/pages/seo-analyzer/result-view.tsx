import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Image as ImageIcon,
  Info,
  Link2,
  ListTree,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { FixedSizeList as List } from 'react-window';

import { CopyButton } from '@/components/copy-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/utils';

import type { IssueSeverity, SeoAnalysisResult, SeoCategory, SeoCheckItem } from './types';

interface SeoResultViewProps {
  result: SeoAnalysisResult;
  onReset: () => void;
}

const severityConfig: Record<IssueSeverity, { icon: typeof CheckCircle2; color: string; bgColor: string }> = {
  success: { icon: CheckCircle2, color: 'text-green-600 dark:text-green-500', bgColor: 'bg-green-500/10' },
  info: { icon: Info, color: 'text-blue-600 dark:text-blue-500', bgColor: 'bg-blue-500/10' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600 dark:text-yellow-500', bgColor: 'bg-yellow-500/10' },
  error: { icon: XCircle, color: 'text-red-600 dark:text-red-500', bgColor: 'bg-red-500/10' },
};

// 评分环
function ScoreRing({ score, size = 'lg' }: { score: number; size?: 'sm' | 'lg' }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-500';
    if (s >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return '优秀';
    if (s >= 60) return '良好';
    if (s >= 40) return '一般';
    return '较差';
  };

  const dimensions = size === 'lg' ? 'h-24 w-24' : 'h-16 w-16';
  const textSize = size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={cn('relative flex items-center justify-center', dimensions)}>
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${score * 2.64} 264`}
            className={getScoreColor(score)}
          />
        </svg>
        <span className={cn('absolute font-bold', textSize, getScoreColor(score))}>{score}</span>
      </div>
      <span className={cn('text-xs font-medium', getScoreColor(score))}>{getScoreLabel(score)}</span>
    </div>
  );
}

// 统计卡片
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className={cn('text-xl font-bold', color)}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

// 检查项行
function CheckItemRow({ item }: { item: SeoCheckItem }) {
  const config = severityConfig[item.severity];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-start gap-2.5 rounded-md p-2.5', config.bgColor)}>
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.color)} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium">{item.name}</span>
          {item.value && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {item.value}
            </Badge>
          )}
          {item.scoreModifier !== undefined && item.scoreModifier < 0 && (
            <Badge
              variant="outline"
              className="h-5 border-red-500/50 px-1.5 text-[10px] text-red-600 dark:text-red-400"
            >
              {item.scoreModifier} 分
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{item.description}</p>
        {item.suggestion && (
          <p className="text-xs text-blue-600 dark:text-blue-400">
            <span className="mr-1">💡</span>
            {item.suggestion}
          </p>
        )}
      </div>
    </div>
  );
}

// 分类卡片
function CategorySection({ category }: { category: SeoCategory }) {
  const [isOpen, setIsOpen] = useState(true);

  const counts = {
    error: category.items.filter((i) => i.severity === 'error').length,
    warning: category.items.filter((i) => i.severity === 'warning').length,
    success: category.items.filter((i) => i.severity === 'success').length,
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-muted/50">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{category.icon}</span>
            <span className="text-sm font-medium">{category.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {counts.error > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                {counts.error}
              </Badge>
            )}
            {counts.warning > 0 && (
              <Badge variant="outline" className="h-5 border-yellow-500/50 px-1.5 text-[10px] text-yellow-600">
                {counts.warning}
              </Badge>
            )}
            {counts.success > 0 && (
              <Badge variant="outline" className="h-5 border-green-500/50 px-1.5 text-[10px] text-green-600">
                {counts.success}
              </Badge>
            )}
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 px-1 pb-2">
          {category.items.map((item) => (
            <CheckItemRow key={item.id} item={item} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// 搜索预览
function SearchPreview({ result }: { result: SeoAnalysisResult }) {
  const displayUrl = result.finalUrl || result.url || 'example.com';

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">搜索结果预览</Label>
      <div className="rounded-lg border bg-card p-3 space-y-1">
        <p className="text-base font-medium text-blue-600 dark:text-blue-400 line-clamp-1">
          {result.meta.title || '(无标题)'}
        </p>
        <p className="text-xs text-green-700 dark:text-green-500 line-clamp-1">{displayUrl}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{result.meta.description || '(无描述)'}</p>
      </div>
    </div>
  );
}

// 社交预览
function SocialPreview({ result }: { result: SeoAnalysisResult }) {
  if (!result.openGraph.title && !result.openGraph.image) return null;

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">社交媒体预览</Label>
      <div className="overflow-hidden rounded-lg border bg-card">
        {result.openGraph.image && (
          <div className="aspect-[1.91/1] bg-muted">
            <img
              src={result.openGraph.image}
              alt="OG Image"
              className="h-full w-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          </div>
        )}
        <div className="p-3 space-y-0.5">
          <p className="text-[10px] uppercase text-muted-foreground">
            {result.openGraph.siteName || (result.url ? new URL(result.url).hostname : 'example.com')}
          </p>
          <p className="text-sm font-medium line-clamp-1">{result.openGraph.title || result.meta.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {result.openGraph.description || result.meta.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// 标题结构
function HeadingsPanel({ headings }: { headings: SeoAnalysisResult['headings'] }) {
  if (headings.length === 0) {
    return <p className="py-8 text-center text-xs text-muted-foreground">页面没有标题标签</p>;
  }

  const HeadingRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const h = headings[index];
    return (
      <div style={style} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50">
        <div style={{ paddingLeft: `${(h.level - 1) * 12}px` }} className="flex items-center gap-2 flex-1 min-w-0">
          <Badge variant="outline" className="h-5 w-7 shrink-0 justify-center px-0 text-[10px] font-mono">
            H{h.level}
          </Badge>
          <span className="truncate text-xs">{h.text || '(空)'}</span>
        </div>
      </div>
    );
  };

  return (
    <List height={280} itemCount={headings.length} itemSize={32} width="100%" className="custom-scrollbar">
      {HeadingRow}
    </List>
  );
}

// 图片列表
function ImagesPanel({ images, baseUrl }: { images: SeoAnalysisResult['images']; baseUrl?: string }) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewAlt, setPreviewAlt] = useState<string>('');

  if (images.length === 0) {
    return <p className="py-8 text-center text-xs text-muted-foreground">页面没有图片</p>;
  }

  const withoutAlt = images.filter((img) => !img.hasAlt).length;

  const resolveSrc = (rawSrc: string | undefined | null): string | null => {
    if (!rawSrc) return null;
    const src = rawSrc.trim();
    if (!src) return null;

    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      return src;
    }

    if (!baseUrl) return null;

    try {
      return new URL(src, baseUrl).href;
    } catch {
      return null;
    }
  };

  const handlePreview = (rawSrc: string | undefined | null, alt: string) => {
    const src = resolveSrc(rawSrc);
    if (!src) return;
    setPreviewSrc(src);
    setPreviewAlt(alt || '图片预览');
  };

  const ImageRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const img = images[index];
    const hasPreview = !!resolveSrc(img.src as string | undefined);

    return (
      <div
        style={style}
        role={hasPreview ? 'button' : undefined}
        className={cn(
          'flex items-center gap-2 rounded px-2 py-1.5 text-xs',
          hasPreview && 'cursor-zoom-in hover:bg-muted/50',
        )}
        onClick={() => hasPreview && handlePreview(img.src as string | undefined, img.alt || img.src || '')}
      >
        {img.hasAlt ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
        )}
        <div className="h-9 w-14 shrink-0 overflow-hidden rounded border bg-background">
          {hasPreview ? (
            <img
              src={resolveSrc(img.src as string | undefined) ?? ''}
              alt={img.alt || img.src || '图片预览'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
              无预览
            </div>
          )}
        </div>
        <span className="min-w-0 flex-1 truncate text-muted-foreground">{img.src || '(无 src)'}</span>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3 text-xs">
        <span className="text-muted-foreground">
          总计 <span className="font-medium text-foreground">{images.length}</span> 张
        </span>
        <span className={withoutAlt > 0 ? 'text-yellow-600' : 'text-green-600'}>
          缺少 Alt: <span className="font-medium">{withoutAlt}</span>
        </span>
      </div>

      <List height={280} itemCount={images.length} itemSize={48} width="100%" className="custom-scrollbar">
        {ImageRow}
      </List>

      <Dialog open={!!previewSrc} onOpenChange={(open) => !open && setPreviewSrc(null)}>
        <DialogContent className="max-w-4xl border bg-background/95">
          {previewSrc && (
            <div className="flex w-full items-center justify-center">
              <img src={previewSrc} alt={previewAlt} className="max-h-[80vh] w-full object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 链接列表
function LinksPanel({ links, baseUrl }: { links: SeoAnalysisResult['links']; baseUrl?: string }) {
  const internal = links.filter((l) => !l.isExternal);
  const external = links.filter((l) => l.isExternal);

  const resolveHref = (rawHref: string | undefined): string | null => {
    if (!rawHref) return null;
    const href = rawHref.trim();
    if (!href) return null;

    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href;
    }

    if (!baseUrl) return null;

    try {
      return new URL(href, baseUrl).href;
    } catch {
      return null;
    }
  };

  const handleRowClick = (rawHref: string | undefined) => {
    const target = resolveHref(rawHref);
    if (!target) return;
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  const InternalLinkRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const link = internal[index];
    return (
      <div
        style={style}
        role="button"
        className="group flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-xs transition-colors hover:bg-muted/60 min-w-0"
        onClick={() => handleRowClick(link.href)}
        title={link.href}
      >
        <span className="shrink-0 text-muted-foreground">{link.text || '(无文字)'}</span>
        <span className="text-muted-foreground/50">→</span>
        <span className="min-w-0 flex-1 truncate">{link.href || '(无 href)'}</span>
      </div>
    );
  };

  const ExternalLinkRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const link = external[index];
    return (
      <div
        style={style}
        role="button"
        className="group flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-xs transition-colors hover:bg-muted/60"
        onClick={() => handleRowClick(link.href)}
        title={link.href}
      >
        <span className="shrink-0 text-muted-foreground">{link.text || '(无文字)'}</span>
        <span className="text-muted-foreground/50">→</span>
        <span className="min-w-0 flex-1 truncate">{link.href || '(无 href)'}</span>
        {link.hasNofollow && (
          <Badge variant="outline" className="h-4 shrink-0 px-1 text-[9px]">
            nofollow
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>
          内链 <span className="font-medium text-foreground">{internal.length}</span>
        </span>
        <span>
          外链 <span className="font-medium text-foreground">{external.length}</span>
        </span>
      </div>
      <Tabs defaultValue="internal" className="w-full">
        <TabsList className="h-8 w-full">
          <TabsTrigger value="internal" className="flex-1 text-xs">
            内部链接
          </TabsTrigger>
          <TabsTrigger value="external" className="flex-1 text-xs">
            外部链接
          </TabsTrigger>
        </TabsList>
        <TabsContent value="internal" className="mt-2">
          {internal.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">无内部链接</p>
          ) : (
            <List height={280} itemCount={internal.length} itemSize={32} width="100%" className="custom-scrollbar">
              {InternalLinkRow}
            </List>
          )}
        </TabsContent>
        <TabsContent value="external" className="mt-2">
          {external.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">无外部链接</p>
          ) : (
            <List height={280} itemCount={external.length} itemSize={32} width="100%" className="custom-scrollbar">
              {ExternalLinkRow}
            </List>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 结构化数据
function StructuredDataPanel({ data }: { data: SeoAnalysisResult['structuredData'] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center">
        <p className="text-center text-xs text-muted-foreground">未检测到结构化数据</p>
      </div>
    );
  }

  return (
    <div className="custom-scrollbar h-[280px] overflow-auto pr-1 custom-scrollbar">
      <div className="space-y-2.5">
        {data.map((item, i) => (
          <div key={i} className="overflow-hidden rounded-md border bg-muted/30">
            <div className="flex items-center gap-1.5 border-b bg-muted/50 px-3 py-2">
              <Badge className="h-5 px-1.5 text-[10px] cursor-default">{item.type.toUpperCase()}</Badge>
              {item.schemaType && (
                <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-none cursor-default">
                  {item.schemaType}
                </Badge>
              )}

              <CopyButton text={item.content} className="ml-auto" />
            </div>
            <pre className="p-3 text-xs text-muted-foreground text-wrap">{item.content}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeoResultView({ result, onReset }: SeoResultViewProps) {
  const counts = {
    error: result.categories.reduce((acc, cat) => acc + cat.items.filter((i) => i.severity === 'error').length, 0),
    warning: result.categories.reduce((acc, cat) => acc + cat.items.filter((i) => i.severity === 'warning').length, 0),
    success: result.categories.reduce((acc, cat) => acc + cat.items.filter((i) => i.severity === 'success').length, 0),
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onReset} className="h-8 gap-1.5 px-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">重新分析</span>
        </Button>
        {result.url && (
          <a
            href={result.finalUrl || result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="max-w-[200px] truncate sm:max-w-[300px]">{result.finalUrl || result.url}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        )}
      </div>

      {/* Score Card */}
      <Card className="p-4">
        <div className="flex items-center gap-6">
          <ScoreRing score={result.score} />
          <Separator orientation="vertical" className="h-16" />
          <div className="flex flex-1 items-center justify-around">
            <StatCard label="错误" value={counts.error} color="text-red-500" />
            <StatCard label="警告" value={counts.warning} color="text-yellow-500" />
            <StatCard label="通过" value={counts.success} color="text-green-500" />
          </div>
        </div>
        <Progress value={result.score} className="mt-4 h-1.5" />
      </Card>

      {/* Main Grid */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left: Check Results */}
        <Card className="p-3 lg:col-span-3">
          <Label className="mb-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            检测结果
          </Label>
          <div className="divide-y">
            {result.categories.map((category) => (
              <CategorySection key={category.id} category={category} />
            ))}
          </div>
        </Card>

        {/* Right: Details */}
        <div className="space-y-4 lg:col-span-2 min-w-0">
          {/* Preview */}
          <Card className="p-3 space-y-4 min-w-0">
            <SearchPreview result={result} />
            <SocialPreview result={result} />
          </Card>

          {/* Page Analysis Tabs */}
          <Card className="p-3 min-w-0">
            <Tabs defaultValue="headings" className="w-full">
              <TabsList className="mb-3 h-8 w-full">
                <TabsTrigger value="headings" className="flex-1 gap-1 text-xs">
                  <ListTree className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">标题</span>
                </TabsTrigger>
                <TabsTrigger value="images" className="flex-1 gap-1 text-xs">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">图片</span>
                </TabsTrigger>
                <TabsTrigger value="links" className="flex-1 gap-1 text-xs">
                  <Link2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">链接</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="headings">
                <HeadingsPanel headings={result.headings} />
              </TabsContent>
              <TabsContent value="images">
                <ImagesPanel images={result.images} baseUrl={result.finalUrl || result.url} />
              </TabsContent>
              <TabsContent value="links">
                <LinksPanel links={result.links} baseUrl={result.finalUrl || result.url} />
              </TabsContent>
            </Tabs>
          </Card>

          {/* Structured Data */}
          <Card className="p-3">
            <Label className="mb-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              结构化数据
            </Label>
            <StructuredDataPanel data={result.structuredData} />
          </Card>

          {/* Stats */}
          <Card className="p-3 min-w-0">
            <Label className="mb-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              页面统计
            </Label>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-md bg-muted/50 p-2">
                <p className="text-lg font-semibold">{result.wordCount.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">文字</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2">
                <p className="text-lg font-semibold">{result.images.length}</p>
                <p className="text-[10px] text-muted-foreground">图片</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2">
                <p className="text-lg font-semibold">{result.links.length}</p>
                <p className="text-[10px] text-muted-foreground">链接</p>
              </div>
              <div className="rounded-md bg-muted/50 p-2">
                <p className="text-lg font-semibold">{result.headings.length}</p>
                <p className="text-[10px] text-muted-foreground">标题</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
