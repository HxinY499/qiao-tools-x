import { Layers3 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CodeArea } from '@/components/code-area';
import { ColorPicker } from '@/components/color-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { createNewLayer, initialBoxShadowConfig, type ShadowLayer, useBoxShadowStore } from './store';

function buildLayerCss(layer: ShadowLayer): string {
  const parts: string[] = [];
  if (layer.inset) parts.push('inset');
  parts.push(
    `${layer.offsetX}px`,
    `${layer.offsetY}px`,
    `${layer.blurRadius}px`,
    `${layer.spreadRadius}px`,
    layer.color || 'rgba(15, 23, 42, 0.35)',
  );
  return parts.join(' ');
}

function buildCssSnippet(layers: ShadowLayer[]): string {
  if (!layers.length) {
    return 'box-shadow: none;';
  }
  const value = layers.map(buildLayerCss).join(',\n        ');
  return `.box-shadow-card {\n  box-shadow: ${value};\n}`;
}

function buildTailwindSnippet(layers: ShadowLayer[]): string {
  if (!layers.length) return 'shadow-none';
  const encoded = layers.map((layer) => buildLayerCss(layer).replace(/\s+/g, '_')).join(',');
  return `shadow-[${encoded}]`;
}

function buildThemeBoxShadowSnippet(layers: ShadowLayer[]): string {
  const value = layers.length ? layers.map(buildLayerCss).join(',\n        ') : 'none';
  return `// tailwind.config.js\nextend: {\n  boxShadow: {\n    'layered-card': \`${value}\`,\n  },\n},\n`;
}

function BoxShadowPage() {
  const { config, setConfig } = useBoxShadowStore();
  const [activeLayerId, setActiveLayerId] = useState<string | null>(() => config.layers[0]?.id ?? null);

  const layers = config.layers;

  const cssSnippet = useMemo(() => buildCssSnippet(layers), [layers]);
  const tailwindSnippet = useMemo(() => buildTailwindSnippet(layers), [layers]);
  const themeSnippet = useMemo(() => buildThemeBoxShadowSnippet(layers), [layers]);
  const boxShadowValue = useMemo(() => (layers.length ? layers.map(buildLayerCss).join(', ') : 'none'), [layers]);

  function updateLayer(id: string, patch: Partial<ShadowLayer>) {
    setConfig((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)),
    }));
  }

  function addLayer() {
    setConfig((prev) => {
      const nextIndex = prev.layers.length + 1;
      const nextLayer = createNewLayer(nextIndex);
      return {
        ...prev,
        layers: [...prev.layers, nextLayer],
      };
    });
  }

  function removeLayer(id: string) {
    setConfig((prev) => {
      const nextLayers = prev.layers.filter((layer) => layer.id !== id);
      const nextConfig = { ...prev, layers: nextLayers };
      if (!nextLayers.length) {
        setActiveLayerId(null);
      } else if (id === activeLayerId) {
        setActiveLayerId(nextLayers[0]?.id ?? null);
      }
      return nextConfig;
    });
  }

  function resetConfig() {
    setConfig(() => initialBoxShadowConfig);
    setActiveLayerId(initialBoxShadowConfig.layers[0]?.id ?? null);
  }

  function renderLayerRow(layer: ShadowLayer, index: number) {
    const isActive = layer.id === activeLayerId;
    return (
      <button
        key={layer.id}
        type="button"
        onClick={() => setActiveLayerId(layer.id)}
        className={`flex items-center justify-between w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
          isActive ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/60'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[11px]">
            {index + 1}
          </span>
          <div className="flex flex-col">
            <span className="font-medium">阴影层 {index + 1}</span>
            <span className="text-[11px] text-muted-foreground">
              {layer.inset ? '内阴影' : '外阴影'} · {layer.offsetX}px, {layer.offsetY}px, {layer.blurRadius}px
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-5 w-5 rounded-full border border-border"
            style={{ backgroundColor: layer.color || 'rgba(15, 23, 42, 0.35)' }}
          />
          <button
            type="button"
            className="text-[11px] text-muted-foreground hover:text-destructive"
            onClick={(event) => {
              event.stopPropagation();
              removeLayer(layer.id);
            }}
          >
            删除
          </button>
        </div>
      </button>
    );
  }

  const activeLayer = layers.find((layer) => layer.id === activeLayerId) ?? layers[0] ?? null;

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <section className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 lg:p-5 flex flex-col gap-4">
        <header className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">配置阴影层</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={resetConfig}>
              重置
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 px-2 text-[11px] inline-flex items-center gap-1.5"
              onClick={addLayer}
            >
              <Layers3 className="h-3 w-3" />
              新增层
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3 text-xs">
          <div className="space-y-2">
            <Label className="text-[11px]">阴影层列表</Label>
            <ScrollArea className="h-40 pr-1">
              <div className="space-y-1.5">
                {layers.map((layer, index) => renderLayerRow(layer, index))}
                {!layers.length && (
                  <p className="text-[11px] text-muted-foreground">暂无阴影层，点击右上角「新增层」开始配置。</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {activeLayer && (
            <div className="rounded-lg border bg-muted/60 px-3 py-3 space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">当前编辑：阴影层 {layers.indexOf(activeLayer) + 1}</p>
                  <p className="text-[11px] text-muted-foreground">细调每一层的位置、范围和颜色。</p>
                </div>
                <label className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={activeLayer.inset}
                    onCheckedChange={(value) => updateLayer(activeLayer.id, { inset: Boolean(value) })}
                  />
                  <span>内阴影（inset）</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">水平偏移 X</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="h-7 w-24 rounded-full px-2 py-1 text-xs"
                      value={activeLayer.offsetX}
                      onChange={(event) => updateLayer(activeLayer.id, { offsetX: Number(event.target.value || 0) })}
                    />
                    <span className="text-[11px] text-muted-foreground">px</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">垂直偏移 Y</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="h-7 w-24 rounded-full px-2 py-1 text-xs"
                      value={activeLayer.offsetY}
                      onChange={(event) => updateLayer(activeLayer.id, { offsetY: Number(event.target.value || 0) })}
                    />
                    <span className="text-[11px] text-muted-foreground">px</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">模糊半径 blur</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      className="h-7 w-24 rounded-full px-2 py-1 text-xs"
                      value={activeLayer.blurRadius}
                      onChange={(event) => updateLayer(activeLayer.id, { blurRadius: Number(event.target.value || 0) })}
                    />
                    <span className="text-[11px] text-muted-foreground">px</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">扩展半径 spread</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="h-7 w-24 rounded-full px-2 py-1 text-xs"
                      value={activeLayer.spreadRadius}
                      onChange={(event) =>
                        updateLayer(activeLayer.id, { spreadRadius: Number(event.target.value || 0) })
                      }
                    />
                    <span className="text-[11px] text-muted-foreground">px</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 flex flex-col">
                <Label className="text-[11px]">阴影颜色</Label>
                <ColorPicker
                  value={activeLayer.color}
                  onChange={(value) => updateLayer(activeLayer.id, { color: value })}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 lg:p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">预览 & 代码</h2>
        </div>

        <div className="rounded-lg border bg-background p-12 flex items-center justify-center">
          <div
            className="w-40 h-24 rounded-xl border bg-card text-card-foreground flex items-center justify-center text-xs"
            style={{ boxShadow: boxShadowValue }}
          >
            阴影预览
          </div>
        </div>

        <Tabs defaultValue="css" className="flex flex-col flex-1">
          <TabsList className="w-max">
            <TabsTrigger value="css" className="text-xs">
              CSS 代码
            </TabsTrigger>
            <TabsTrigger value="tailwind" className="text-xs">
              Tailwind 工具类
            </TabsTrigger>
            <TabsTrigger value="theme" className="text-xs">
              主题 boxShadow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="css" className="flex-1">
            <CodeArea code={cssSnippet} language="css" className="border-none bg-transparent" />
          </TabsContent>

          <TabsContent value="tailwind" className="flex-1">
            <CodeArea code={tailwindSnippet} language="js" className="border-none bg-transparent" />
          </TabsContent>

          <TabsContent value="theme" className="flex-1">
            <CodeArea code={themeSnippet} language="js" className="border-none bg-transparent" />
          </TabsContent>
        </Tabs>

        <div className="border-t border-border pt-3 mt-1">
          <h3 className="text-xs font-semibold mb-1.5">使用建议</h3>
          <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-1">
            <li>使用多层阴影模拟真实光照：一层柔和大阴影 + 一层小而锐利的阴影。</li>
            <li>扩展半径为负值可以收紧阴影边缘，避免蒙住卡片外部内容。</li>
            <li>在 Tailwind 中建议把生成的 shadow-[...] 抽成组件 class，保持样式统一。</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default BoxShadowPage;
