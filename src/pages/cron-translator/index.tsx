import { Clock, Code, FileText, Sparkles, TerminalSquare, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils';

import { useCronTranslatorStore } from './store';
import { CRON_FORMATS, CRON_TEMPLATES, type CronFormat } from './types';
import { detectFormat, formatNextRun, parseCron } from './utils';

function CronTranslatorPage() {
  const { expression, format, setExpression, setFormat } = useCronTranslatorStore();
  const [detectHint, setDetectHint] = useState<string | null>(null);

  // 当输入字段数与当前格式不一致时，给出温和提示（不强制切换）
  useEffect(() => {
    const detected = detectFormat(expression);
    if (detected && detected !== format) {
      const target = CRON_FORMATS.find((f) => f.value === detected);
      setDetectHint(target ? `检测到 ${target.fields} 字段，可能需要切换到「${target.label}」` : null);
    } else {
      setDetectHint(null);
    }
  }, [expression, format]);

  // 解析结果 / 错误（同步计算即可，cron-parser/cronstrue 都是同步）
  const parseState = useMemo(() => {
    try {
      return { ok: true as const, result: parseCron(expression, format) };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
    }
  }, [expression, format]);

  const withSeconds = format === 'with-seconds';

  const handleApplyTemplate = (tplExpr: string) => {
    setExpression(tplExpr);
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-6">
      {/* 输入区 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <TerminalSquare className="w-4 h-4" />
            Cron 表达式
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 格式选择 */}
          <div className="space-y-2">
            <Label>格式</Label>
            <div className="grid grid-cols-2 gap-2">
              {CRON_FORMATS.map((f) => {
                const active = f.value === format;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFormat(f.value as CronFormat)}
                    className={cn(
                      'h-12 px-3 text-sm rounded-md border transition-colors flex flex-col items-center justify-center',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <span className="font-medium">{f.label}</span>
                    <span className={cn('text-[11px]', active ? 'opacity-80' : 'text-muted-foreground')}>{f.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 输入框 */}
          <div className="space-y-2">
            <Label htmlFor="cron-expr">表达式</Label>
            <div className="flex gap-2">
              <Input
                id="cron-expr"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder={withSeconds ? '例如：0 0 9 * * 1-5' : '例如：0 9 * * 1-5'}
                className="flex-1 font-mono"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
              {expression && (
                <Button variant="outline" size="icon" onClick={() => setExpression('')} title="清空">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {detectHint && <p className="text-xs text-amber-600 dark:text-amber-500">提示：{detectHint}</p>}
          </div>

          {/* 常用模板 */}
          <div className="space-y-2">
            <Label>常用模板</Label>
            <div className="flex flex-wrap gap-2">
              {CRON_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => handleApplyTemplate(withSeconds ? t.withSeconds : t.standard)}
                  className="px-3 h-7 text-xs rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 错误状态 */}
      {!parseState.ok && (
        <Card className="border-destructive/50">
          <CardContent className="py-4">
            <div className="text-sm text-destructive">{parseState.error}</div>
          </CardContent>
        </Card>
      )}

      {/* 成功状态 */}
      {parseState.ok && (
        <>
          {/* 翻译 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  翻译
                </span>
                <CopyButton
                  text={parseState.result.description}
                  mode="icon-text"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 lg:px-3"
                  onCopy={() => toast.success('已复制翻译')}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium leading-relaxed">{parseState.result.description}</p>
            </CardContent>
          </Card>

          {/* 字段拆解 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Code className="w-4 h-4" />
                字段拆解
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2 font-medium w-20">字段</th>
                      <th className="px-3 py-2 font-medium w-24">值</th>
                      <th className="px-3 py-2 font-medium">取值范围</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseState.result.fields.map((f) => (
                      <tr key={f.name} className="border-t">
                        <td className="px-3 py-2 text-muted-foreground">{f.name}</td>
                        <td className="px-3 py-2 font-mono font-medium">{f.value}</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{f.range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 未来执行 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                未来 5 次执行
              </CardTitle>
            </CardHeader>
            <CardContent>
              {parseState.result.nextRuns.length === 0 ? (
                <div className="text-sm text-muted-foreground py-3">无法计算执行时间（表达式可能含不支持的语法）</div>
              ) : (
                <ol className="space-y-1">
                  {parseState.result.nextRuns.map((ts, i) => {
                    const { absolute, relative } = formatNextRun(ts, withSeconds);
                    return (
                      <li
                        key={ts}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs text-muted-foreground tabular-nums w-5">{i + 1}.</span>
                          <span className="font-mono text-sm">{absolute}</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{relative}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
              <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="w-3 h-3" />
                基于当前本地时间计算
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default CronTranslatorPage;
