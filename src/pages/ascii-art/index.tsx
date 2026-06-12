import { ChevronDown, Code2, Download, RefreshCw, Shuffle, Type } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils';

import { useAsciiArtStore } from './store';
import {
  BORDER_STYLES,
  type BorderValue,
  COMMENT_FORMATS,
  type CommentFormat,
  FONT_LIST,
  type FontName,
  KERNING_OPTIONS,
  type KerningValue,
  SAMPLE_TEXTS,
} from './types';
import { applyBorder, downloadAsTxt, pickRandomDifferent, renderAsciiArt, wrapAsComment } from './utils';

const MAX_TEXT_LEN = 32;

function AsciiArtPage() {
  const { t } = useTranslation('tools');
  const { text, font, kerning, border, setText, setFont, setKerning, setBorder } = useAsciiArtStore();
  const [rawOutput, setRawOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // text/font/kerning 任一变化时重新渲染（loadFont 内部有缓存，重复切换字体很快）
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    renderAsciiArt(text, font, kerning)
      .then((result) => {
        if (cancelled) return;
        if (result === null) {
          setError(t('asciiArt.errorFontLoad'));
          setRawOutput('');
        } else {
          setRawOutput(result);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [text, font, kerning, t]);

  // 应用边框得到最终展示/复制的内容
  const output = useMemo(() => applyBorder(rawOutput, border), [rawOutput, border]);

  const previewWidth = useMemo(() => {
    if (!output) return 0;
    return output.split('\n').reduce((max, line) => Math.max(max, line.length), 0);
  }, [output]);

  const handleRandomText = () => {
    setText(pickRandomDifferent(SAMPLE_TEXTS, text));
  };

  const handleRandomFont = () => {
    setFont(pickRandomDifferent(FONT_LIST, font) as FontName);
  };

  const handleDownload = () => {
    if (!output) return;
    const safeName = (text || 'ascii-art').replace(/[^\w-]+/g, '_').slice(0, 24);
    downloadAsTxt(output, `${safeName}.txt`);
    toast.success(t('asciiArt.toastDownloaded'));
  };

  const handleCopyAsComment = async (format: CommentFormat) => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(wrapAsComment(output, format));
      toast.success(t('asciiArt.toastCopiedAsComment', { format: format.label.split(' ')[0] }));
    } catch {
      toast.error(t('asciiArt.toastCopyFailed'));
    }
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-6">
      {/* 配置区 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Type className="w-4 h-4" />
            {t('asciiArt.sectionConfig')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 文字内容 */}
          <div className="space-y-2">
            <Label htmlFor="ascii-text">{t('asciiArt.labelText')}</Label>
            <div className="flex gap-2">
              <Input
                id="ascii-text"
                value={text}
                maxLength={MAX_TEXT_LEN}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('asciiArt.placeholderText')}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={handleRandomText} title={t('asciiArt.btnRandomTextTitle')}>
                <Shuffle className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('asciiArt.hintAsciiOnly')}</p>
          </div>

          {/* 字体网格 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('asciiArt.labelFont')}</Label>
              <Button variant="ghost" size="sm" onClick={handleRandomFont} className="h-7 text-xs">
                <Shuffle className="w-3.5 h-3.5 mr-1" />
                {t('asciiArt.btnRandomFont')}
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {FONT_LIST.map((f) => {
                const active = f === font;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFont(f)}
                    className={cn(
                      'h-9 px-3 text-xs rounded-md border transition-colors truncate',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
                    )}
                    title={f}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 字符间距 + 边框 同一行展示，桌面双列 */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('asciiArt.labelKerning')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {KERNING_OPTIONS.map((k) => {
                  const active = k.value === kerning;
                  return (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => setKerning(k.value as KerningValue)}
                      className={cn(
                        'h-9 px-3 text-xs rounded-md border transition-colors',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      {t(k.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('asciiArt.labelBorder')}</Label>
              <div className="grid grid-cols-4 gap-2">
                {BORDER_STYLES.map((b) => {
                  const active = b.value === border;
                  return (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => setBorder(b.value as BorderValue)}
                      className={cn(
                        'h-9 px-3 text-xs rounded-md border transition-colors',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      {t(b.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 预览区 */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {t('asciiArt.sectionPreview')}
              {previewWidth > 0 && (
                <span className="text-xs font-normal text-muted-foreground">{t('asciiArt.colWidth', { count: previewWidth })}</span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <CopyButton
                text={output}
                mode="icon-text"
                variant="ghost"
                size="sm"
                disabled={!output}
                className="h-8 px-2 lg:px-3"
                onCopy={() => toast.success(t('asciiArt.toastCopied'))}
              />
              {/* 复制为注释下拉 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={!output} className="h-8 px-2 lg:px-3">
                    <Code2 className="w-4 h-4 mr-1" />
                    {t('asciiArt.btnCommentFormat')}
                    <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>{t('asciiArt.dropdownCopyAsComment')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {COMMENT_FORMATS.map((f) => (
                    <DropdownMenuItem key={f.key} onClick={() => handleCopyAsComment(f)}>
                      {f.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" disabled={!output} onClick={handleDownload} className="h-8 px-2 lg:px-3">
                <Download className="w-4 h-4 mr-1" />
                {t('asciiArt.btnDownload')}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <div className="rounded-md border bg-muted/30 overflow-auto custom-scrollbar">
              <pre className="font-mono text-[12px] leading-tight p-4 whitespace-pre min-h-[200px]">
                {output || (loading ? t('asciiArt.rendering') : t('asciiArt.emptyHint'))}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AsciiArtPage;
