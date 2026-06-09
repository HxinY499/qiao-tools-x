import { Download, RefreshCw, Shuffle, Type } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils';

import { useAsciiArtStore } from './store';
import { FONT_LIST, type FontName, SAMPLE_TEXTS } from './types';
import { downloadAsTxt, pickRandomDifferent, renderAsciiArt } from './utils';

const MAX_TEXT_LEN = 32;

function AsciiArtPage() {
  const { text, font, setText, setFont } = useAsciiArtStore();
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // text/font 任一变化时重新渲染（loadFont 内部有缓存，重复切换字体很快）
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    renderAsciiArt(text, font)
      .then((result) => {
        if (cancelled) return;
        if (result === null) {
          setError('字体加载失败，请换一个字体试试');
          setOutput('');
        } else {
          setOutput(result);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [text, font]);

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
    toast.success('已下载 .txt 文件');
  };

  // 预览框的字符数（最长行）用于估算需不需要横向滚动
  const previewWidth = useMemo(() => {
    if (!output) return 0;
    return output.split('\n').reduce((max, line) => Math.max(max, line.length), 0);
  }, [output]);

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-6">
      {/* 配置区 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Type className="w-4 h-4" />
            生成配置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="ascii-text">文字内容</Label>
            <div className="flex gap-2">
              <Input
                id="ascii-text"
                value={text}
                maxLength={MAX_TEXT_LEN}
                onChange={(e) => setText(e.target.value)}
                placeholder="输入文字（建议英文/数字，最多 32 个字符）"
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={handleRandomText} title="随机示例文案">
                <Shuffle className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">提示：figlet 字体只支持 ASCII 字符，中文不会渲染。</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>字体</Label>
              <Button variant="ghost" size="sm" onClick={handleRandomFont} className="h-7 text-xs">
                <Shuffle className="w-3.5 h-3.5 mr-1" />
                随机字体
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
        </CardContent>
      </Card>

      {/* 预览区 */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              预览结果
              {previewWidth > 0 && (
                <span className="text-xs font-normal text-muted-foreground">{previewWidth} 列宽</span>
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
                onCopy={() => toast.success('已复制到剪贴板')}
              />
              <Button variant="ghost" size="sm" disabled={!output} onClick={handleDownload} className="h-8 px-2 lg:px-3">
                <Download className="w-4 h-4 mr-1" />
                下载
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
                {output || (loading ? '渲染中…' : '在上方输入文字开始生成')}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AsciiArtPage;
