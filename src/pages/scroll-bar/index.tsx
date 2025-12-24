import './index.css';

import { type ChangeEvent, useEffect, useMemo, useState } from 'react';

import { CodeArea } from '@/components/code-area';
import { ColorPicker } from '@/components/color-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { BorderStyle, ConfigType, initConfig, useScrollbarStore } from './store';

function loadBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as boolean;
  } catch {
    return fallback;
  }
}

function generateCss(config: ConfigType, hasHorizontal: boolean, showWhenHover: boolean): string {
  const width = config.scrollbar.width;
  const heightLine = hasHorizontal ? `\n    height: ${width}px;` : '';
  const baseVisibility = showWhenHover ? '\n    visibility: hidden;' : '';

  const trackVisibility = showWhenHover ? '\n    visibility: hidden;' : '';
  const thumbVisibility = showWhenHover ? '\n    visibility: hidden;' : '';

  const hoverPart = showWhenHover
    ? `\n.scrollbar-code-area:hover::-webkit-scrollbar-track,\n.scrollbar-code-area:hover::-webkit-scrollbar-thumb,\n.scrollbar-code-area:hover::-webkit-scrollbar {\n  visibility: visible;\n}\n`
    : '';

  return `
  .scrollbar-code-area::-webkit-scrollbar {
      width: ${width}px;${heightLine}${baseVisibility}
  }

  .scrollbar-code-area::-webkit-scrollbar-track {
      border: ${config.track['border-width']}px ${config.track['border-style']} ${config.track['border-color']};
      border-radius: ${config.track['border-radius']}px;
      background-color: ${config.track['background-color']};${trackVisibility}
  }

  .scrollbar-code-area::-webkit-scrollbar-thumb {
      border: ${config.thumb['border-width']}px ${config.thumb['border-style']} ${config.thumb['border-color']};
      border-radius: ${config.thumb['border-radius']}px;
      background-color: ${config.thumb['background-color']};${thumbVisibility}
  }

  .scrollbar-code-area::-webkit-scrollbar-corner {
      background-color: ${config.corner['background-color']};
  }

${hoverPart}`;
}

function ScrollBarPage() {
  const { config, setConfig } = useScrollbarStore();
  const [hasHorizontal, setHasHorizontal] = useState<boolean>(() => loadBool('Scrollbar__hasHorizontal', false));
  const [showWhenHover, setShowWhenHover] = useState<boolean>(() => loadBool('Scrollbar__showWhenHover', false));
  const [cssCode, setCssCode] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('Scrollbar__config', JSON.stringify(config));
      window.localStorage.setItem('Scrollbar__hasHorizontal', JSON.stringify(hasHorizontal));
      window.localStorage.setItem('Scrollbar__showWhenHover', JSON.stringify(showWhenHover));
    }
    setCssCode(generateCss(config, hasHorizontal, showWhenHover));
  }, [config, hasHorizontal, showWhenHover]);

  const scrollVars = useMemo(
    () => ({
      '--sb-width': `${config.scrollbar.width}px`,
      '--sb-track-border-width': `${config.track['border-width']}px`,
      '--sb-track-border-radius': `${config.track['border-radius']}px`,
      '--sb-track-border-style': config.track['border-style'],
      '--sb-track-border-color': config.track['border-color'],
      '--sb-track-background-color': config.track['background-color'],
      '--sb-thumb-border-width': `${config.thumb['border-width']}px`,
      '--sb-thumb-border-radius': `${config.thumb['border-radius']}px`,
      '--sb-thumb-border-style': config.thumb['border-style'],
      '--sb-thumb-border-color': config.thumb['border-color'],
      '--sb-thumb-background-color': config.thumb['background-color'],
      '--sb-corner-background-color': config.corner['background-color'],
      '--sb-visibility': showWhenHover ? 'hidden' : 'visible',
    }),
    [config, showWhenHover],
  ) as React.CSSProperties;

  function handleNumberChange(e: ChangeEvent<HTMLInputElement>, section: keyof ConfigType, field: string) {
    const raw = e.target.value;
    const value = raw === '' ? 0 : Number(raw);
    if (Number.isNaN(value)) return;
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, unknown>),
        [field]: value,
      },
    }));
  }

  function updateColor(section: keyof ConfigType, field: string, value: string) {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, unknown>),
        [field]: value,
      },
    }));
  }

  function handleBorderStyleChange(section: 'track' | 'thumb', value: BorderStyle) {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, unknown>),
        'border-style': value,
      },
    }));
  }

  function resetConfig() {
    setConfig(() => initConfig);
    setHasHorizontal(false);
    setShowWhenHover(false);
  }

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* 左侧：配置区域 */}
      <Card className="shadow-sm flex flex-col gap-4 p-4 lg:p-5">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div>
            <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">配置滚动条样式</h2>
          </div>
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={resetConfig}>
            重置
          </Button>
        </div>

        <div className="space-y-4 text-xs">
          {/* 主体 */}
          <div className="rounded-lg border bg-muted/60 px-3 py-3 space-y-2">
            <div className="flex items-end gap-2 mb-1">
              <span className="text-sm font-medium">主体</span>
              <span className="text-[11px] text-muted-foreground">scrollbar</span>
            </div>
            <div className="grid grid-cols-[auto,minmax(0,1fr)] items-center gap-2">
              <Label className="text-[11px]">width</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="h-7 w-20 rounded-full px-2 py-1 text-xs"
                  value={config.scrollbar.width}
                  min={0}
                  onChange={(e) => handleNumberChange(e, 'scrollbar', 'width')}
                />
                <span className="text-[11px] text-muted-foreground">px</span>
              </div>
            </div>
          </div>

          {/* 轨道 */}
          <div className="rounded-lg border bg-muted/60 px-3 py-3 space-y-2">
            <div className="flex items-end gap-2 mb-1">
              <span className="text-sm font-medium">轨道</span>
              <span className="text-[11px] text-muted-foreground">track</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">background-color</Label>
                <ColorPicker
                  value={config.track['background-color']}
                  onChange={(val) => updateColor('track', 'background-color', val)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">border-color</Label>
                <ColorPicker
                  value={config.track['border-color']}
                  onChange={(val) => updateColor('track', 'border-color', val)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">border-width</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="h-7 w-20 rounded-full px-2 py-1 text-xs"
                    value={config.track['border-width']}
                    min={0}
                    onChange={(e) => handleNumberChange(e, 'track', 'border-width')}
                  />
                  <span className="text-[11px] text-muted-foreground">px</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">border-radius</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="h-7 w-20 rounded-full px-2 py-1 text-xs"
                    value={config.track['border-radius']}
                    min={0}
                    onChange={(e) => handleNumberChange(e, 'track', 'border-radius')}
                  />
                  <span className="text-[11px] text-muted-foreground">px</span>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <Label className="mb-1 block text-[11px]">border-style</Label>
              <RadioGroup
                value={config.track['border-style']}
                onValueChange={(val) => handleBorderStyleChange('track', val as BorderStyle)}
                className="flex flex-wrap gap-2"
              >
                {(['solid', 'dashed', 'dotted', 'double'] as BorderStyle[]).map((style) => (
                  <div key={style} className="flex items-center gap-1.5">
                    <RadioGroupItem id={`track-style-${style}`} value={style} />
                    <Label htmlFor={`track-style-${style}`} className="text-[11px]">
                      {style}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* 滑块 */}
          <div className="rounded-lg border bg-muted/60 px-3 py-3 space-y-2">
            <div className="flex items-end gap-2 mb-1">
              <span className="text-sm font-medium">滑块</span>
              <span className="text-[11px] text-muted-foreground">thumb</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">background-color</Label>
                <ColorPicker
                  value={config.thumb['background-color']}
                  onChange={(val) => updateColor('thumb', 'background-color', val)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">border-color</Label>
                <ColorPicker
                  value={config.thumb['border-color']}
                  onChange={(val) => updateColor('thumb', 'border-color', val)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">border-width</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="h-7 w-20 rounded-full px-2 py-1 text-xs"
                    value={config.thumb['border-width']}
                    min={0}
                    onChange={(e) => handleNumberChange(e, 'thumb', 'border-width')}
                  />
                  <span className="text-[11px] text-muted-foreground">px</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">border-radius</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="h-7 w-20 rounded-full px-2 py-1 text-xs"
                    value={config.thumb['border-radius']}
                    min={0}
                    onChange={(e) => handleNumberChange(e, 'thumb', 'border-radius')}
                  />
                  <span className="text-[11px] text-muted-foreground">px</span>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <Label className="mb-1 block text-[11px]">border-style</Label>
              <RadioGroup
                value={config.thumb['border-style']}
                onValueChange={(val) => handleBorderStyleChange('thumb', val as BorderStyle)}
                className="flex flex-wrap gap-2"
              >
                {(['solid', 'dashed', 'dotted', 'double'] as BorderStyle[]).map((style) => (
                  <div key={style} className="flex items-center gap-1.5">
                    <RadioGroupItem id={`thumb-style-${style}`} value={style} />
                    <Label htmlFor={`thumb-style-${style}`} className="text-[11px]">
                      {style}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* 拐角 */}
          <div className="rounded-lg border bg-muted/60 px-3 py-3 space-y-2">
            <div className="flex items-end gap-2 mb-1">
              <span className="text-sm font-medium">拐角</span>
              <span className="text-[11px] text-muted-foreground">corner</span>
            </div>
            <div className="space-y-1 flex flex-col">
              <Label className="text-[11px]">background-color</Label>
              <ColorPicker
                value={config.corner['background-color']}
                onChange={(val) => updateColor('corner', 'background-color', val)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 右侧：预览 + 代码 */}
      <Card className="shadow-sm flex flex-col gap-4 p-4 lg:p-5">
        <div>
          <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">预览 & CSS 代码</h2>
        </div>

        <div className="rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">滚动条预览区域</span>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <Checkbox checked={showWhenHover} onCheckedChange={(v) => setShowWhenHover(Boolean(v))} />
                <span>仅 hover 时显示</span>
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <Checkbox checked={hasHorizontal} onCheckedChange={(v) => setHasHorizontal(Boolean(v))} />
                <span>包含横向滚动</span>
              </label>
            </div>
          </div>
          <div
            id="scrollbar-code-area"
            className="scrollbar-code-area border rounded-md bg-background text-[11px] leading-relaxed h-48 overflow-auto px-3 py-2"
            style={scrollVars}
          >
            <div style={{ width: hasHorizontal ? '1000px' : '100%' }}>
              <p className="mb-2">
                这里是滚动条预览区域，你可以上下滚动（如果开启横向，也可以左右滚动）来查看样式效果。
              </p>
              {Array.from({ length: 12 }).map((_, idx) => (
                <p key={idx} className="mb-1.5">
                  第 {idx + 1} 行：Scrollbar visual config demo —
                  调整左侧参数，观察滚动条的宽度、颜色、圆角、边框等变化。
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="border bg-muted/40 p-3">
          <CodeArea title="CSS Code" code={cssCode} language="css" codeStyle={scrollVars} />
        </div>

        <div className="border-t border-border pt-3 mt-1">
          <h3 className="text-xs font-semibold mb-1.5">使用小贴士</h3>
          <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-1">
            <li>生成的 CSS 默认使用选择器 .scrollbar-code-area，你可以根据实际项目修改为自己的类名。</li>
            <li>如果只想在 hover 时显示滚动条，请勾选「仅 hover 时显示」。</li>
            <li>横向滚动开关只影响预览区域的内容宽度，方便你同时预览横向滚动条样式。</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

export default ScrollBarPage;
