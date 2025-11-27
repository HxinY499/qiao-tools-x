import { SlidersHorizontal } from 'lucide-react';
import { useMemo } from 'react';

import { CodeArea } from '@/components/code-area';
import { ColorPicker } from '@/components/color-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { type ColorStop, createNewStop, type GradientType, initialGradientConfig, useGradientStore } from './store';

function buildGradientCss(type: GradientType, angle: number, stops: ColorStop[]): string {
  if (!stops.length) return 'none';
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
  const stopStr = sortedStops.map((stop) => `${stop.color} ${stop.position}%`).join(', ');

  if (type === 'radial') {
    return `radial-gradient(circle at center, ${stopStr})`;
  }
  return `linear-gradient(${angle}deg, ${stopStr})`;
}

function buildCssSnippet(type: GradientType, angle: number, stops: ColorStop[]): string {
  const gradient = buildGradientCss(type, angle, stops);
  if (gradient === 'none') return 'background-image: none;';
  return `.gradient-card {\n  background-image: ${gradient};\n}`;
}

function buildTailwindSnippet(type: GradientType, angle: number, stops: ColorStop[]): string {
  const gradient = buildGradientCss(type, angle, stops);
  if (gradient === 'none') return 'bg-none';
  const arbitrary = gradient.replace(/\s+/g, '_');
  return `bg-[${arbitrary}]`;
}

function GradientGeneratorPage() {
  const { config, setConfig } = useGradientStore();

  const cssSnippet = useMemo(
    () => buildCssSnippet(config.type, config.angle, config.stops),
    [config.type, config.angle, config.stops],
  );

  const tailwindSnippet = useMemo(
    () => buildTailwindSnippet(config.type, config.angle, config.stops),
    [config.type, config.angle, config.stops],
  );

  const previewGradient = useMemo(
    () => buildGradientCss(config.type, config.angle, config.stops),
    [config.type, config.angle, config.stops],
  );

  function updateType(type: GradientType) {
    setConfig((prev) => ({
      ...prev,
      type,
    }));
  }

  function updateAngle(value: number) {
    const normalized = ((value % 360) + 360) % 360;
    setConfig((prev) => ({
      ...prev,
      angle: normalized,
    }));
  }

  function updateStop(id: string, patch: Partial<ColorStop>) {
    setConfig((prev) => ({
      ...prev,
      stops: prev.stops.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)),
    }));
  }

  function addStop() {
    setConfig((prev) => {
      const next = createNewStop(prev.stops.length + 1);
      return {
        ...prev,
        stops: [...prev.stops, next],
      };
    });
  }

  function removeStop(id: string) {
    setConfig((prev) => ({
      ...prev,
      stops: prev.stops.filter((stop) => stop.id !== id),
    }));
  }

  function resetConfig() {
    setConfig(() => initialGradientConfig);
  }

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <Card className="shadow-sm flex flex-col gap-4 p-4 lg:p-5">
        <header className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">配置渐变</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={resetConfig}>
              重置
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px] inline-flex items-center gap-1.5"
              onClick={addStop}
            >
              <SlidersHorizontal className="h-3 w-3" />
              新增断点
            </Button>
          </div>
        </header>

        <div className="space-y-4 text-xs flex flex-col">
          <div className="shrink-0">
            <div className="rounded-lg border bg-muted/60 px-3 py-3 space-y-2">
              <Label className="text-[11px]">渐变类型</Label>
              <RadioGroup
                value={config.type}
                onValueChange={(val) => updateType(val as GradientType)}
                className="flex flex-row gap-3"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem id="gradient-linear" value="linear" />
                  <Label htmlFor="gradient-linear" className="text-[11px]">
                    线性渐变（linear-gradient）
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem id="gradient-radial" value="radial" />
                  <Label htmlFor="gradient-radial" className="text-[11px]">
                    径向渐变（radial-gradient）
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {config.type === 'linear' && (
              <div className="rounded-lg border bg-muted/60 px-3 py-3 mt-2">
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-sm font-medium">角度</span>
                  <span className="text-[11px] text-muted-foreground">{config.angle.toFixed(0)}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="h-7 w-24 rounded-full px-2 py-1 text-xs"
                    value={config.angle}
                    onChange={(event) => updateAngle(Number(event.target.value || 0))}
                  />
                  <span className="text-[11px] text-muted-foreground">0° 指向上方，顺时针旋转。</span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-muted/60 px-3 py-3 space-y-2 flex-1 max-h-[50vh] flex flex-col">
            <div className="justify-between shrink-0">
              <span className="text-sm font-medium">颜色断点</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">支持多色渐变，按位置从左到右排序。</p>
            </div>

            <div className="space-y-2 overflow-auto min-h-0">
              {config.stops.map((stop, index) => (
                <div
                  key={stop.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex self-start h-6 w-6 items-center justify-center rounded-full bg-muted text-[11px]">
                      {index + 1}
                    </span>
                    <div className="flex flex-col gap-1">
                      <ColorPicker value={stop.color} onChange={(value) => updateStop(stop.id, { color: value })} />
                      <div className="flex items-center gap-2">
                        <Label className="text-[11px]">位置</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          className="h-7 w-20 rounded-full px-2 py-1 text-xs"
                          value={stop.position}
                          onChange={(event) => {
                            const value = Number(event.target.value || 0);
                            const clamped = Math.min(100, Math.max(0, value));
                            updateStop(stop.id, { position: clamped });
                          }}
                        />
                        <span className="text-[11px] text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                  {config.stops.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                      onClick={() => removeStop(stop.id)}
                    >
                      删除
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="shadow-sm flex flex-col gap-4 p-4 lg:p-5">
        <div>
          <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">预览 & 代码</h2>
        </div>

        <div className="rounded-lg border bg-background p-12 flex items-center justify-center">
          <div
            className="size-52 rounded-xl border bg-card text-card-foreground flex items-center justify-center text-xs"
            style={{ backgroundImage: previewGradient }}
          ></div>
        </div>

        <Tabs defaultValue="css" className="flex flex-col flex-1">
          <TabsList className="w-max">
            <TabsTrigger value="css" className="text-xs">
              CSS 代码
            </TabsTrigger>
            <TabsTrigger value="tailwind" className="text-xs">
              Tailwind 工具类
            </TabsTrigger>
          </TabsList>

          <TabsContent value="css" className="mt-3 flex-1">
            <CodeArea title="CSS background-image" code={cssSnippet} language="css" />
          </TabsContent>

          <TabsContent value="tailwind" className="mt-3 flex-1">
            <CodeArea title="Tailwind 渐变类名" code={tailwindSnippet} language="ts" />
          </TabsContent>
        </Tabs>

        <div className="border-t border-border pt-3 mt-1">
          <h3 className="text-xs font-semibold mb-1.5">使用小贴士</h3>
          <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-1">
            <li>线性渐变建议使用 120° ~ 160° 之间的角度，视觉更柔和。</li>
            <li>至少保留两个颜色断点，更多断点可以营造细腻的渐变层次。</li>
            <li>Tailwind arbitrary value 形式适合快速试验，可将常用渐变抽成自定义类名复用。</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

export default GradientGeneratorPage;
