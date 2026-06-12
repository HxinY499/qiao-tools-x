import { Layers3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CodeArea } from '@/components/code-area';
import { ColorPicker } from '@/components/color-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

function BoxShadowPage() {
  const { t } = useTranslation('tools');
  const { config, setConfig } = useBoxShadowStore();
  // activeLayerId 只作为"用户点选意图"的 raw 值；真正用到的 activeLayer 是派生值，
  // 这样 store hydrate / 删除当前层 / 外部清空等场景都不会脱同步。
  const [activeLayerIdRaw, setActiveLayerId] = useState<string | null>(null);

  const layers = config.layers;

  const snippets = useMemo(() => {
    const lines = layers.map(buildLayerCss);
    const joinedInline = lines.length ? lines.join(', ') : 'none';
    const joinedBlock = lines.length ? lines.join(',\n        ') : 'none';

    return {
      boxShadowValue: joinedInline,
      css: lines.length ? `.box-shadow-card {\n  box-shadow: ${joinedBlock};\n}` : 'box-shadow: none;',
      tailwind: lines.length ? `shadow-[${lines.map((l) => l.replace(/\s+/g, '_')).join(',')}]` : 'shadow-none',
      theme: `// tailwind.config.js\nextend: {\n  boxShadow: {\n    'layered-card': \`${joinedBlock}\`,\n  },\n},\n`,
    };
  }, [layers]);

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
    setConfig((prev) => ({
      ...prev,
      layers: prev.layers.filter((layer) => layer.id !== id),
    }));
    // 无需处理 activeLayerId：activeLayer 是派生值，被删除时会自动 fallback 到第一层
  }

  function resetConfig() {
    setConfig(() => initialBoxShadowConfig);
    setActiveLayerId(initialBoxShadowConfig.layers[0]?.id ?? null);
  }

  // 派生当前激活层：raw id 仍在 layers 中就用它，否则兜底到第一层
  const activeLayer = layers.find((l) => l.id === activeLayerIdRaw) ?? layers[0] ?? null;
  const activeLayerId = activeLayer?.id ?? null;

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
            <span className="font-medium">{t('boxShadow.layers.layerLabel', { index: index + 1 })}</span>
            <span className="text-[11px] text-muted-foreground">
              {layer.inset ? t('boxShadow.layers.inset') : t('boxShadow.layers.outer')} · {layer.offsetX}px, {layer.offsetY}px, {layer.blurRadius}px
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
            {t('boxShadow.actions.delete')}
          </button>
        </div>
      </button>
    );
  }

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <Card className="shadow-sm flex flex-col gap-4 p-4 lg:p-5">
        <header className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">{t('boxShadow.sections.config')}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={resetConfig}>
              {t('boxShadow.actions.reset')}
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 px-2 text-[11px] inline-flex items-center gap-1.5"
              onClick={addLayer}
            >
              <Layers3 className="h-3 w-3" />
              {t('boxShadow.actions.addLayer')}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3 text-xs">
          <div className="space-y-2">
            <Label className="text-[11px]">{t('boxShadow.layers.listLabel')}</Label>
            <ScrollArea className="h-40 pr-1">
              <div className="space-y-1.5">
                {layers.map((layer, index) => renderLayerRow(layer, index))}
                {!layers.length && (
                  <p className="text-[11px] text-muted-foreground">{t('boxShadow.layers.empty')}</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {activeLayer && (
            <div className="rounded-lg border bg-muted/60 px-3 py-3 space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('boxShadow.editor.title', { index: layers.indexOf(activeLayer) + 1 })}</p>
                  <p className="text-[11px] text-muted-foreground">{t('boxShadow.editor.subtitle')}</p>
                </div>
                <label className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={activeLayer.inset}
                    onCheckedChange={(value) => updateLayer(activeLayer.id, { inset: Boolean(value) })}
                  />
                  <span>{t('boxShadow.editor.insetLabel')}</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">{t('boxShadow.editor.offsetX')}</Label>
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
                  <Label className="text-[11px]">{t('boxShadow.editor.offsetY')}</Label>
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
                  <Label className="text-[11px]">{t('boxShadow.editor.blurRadius')}</Label>
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
                  <Label className="text-[11px]">{t('boxShadow.editor.spreadRadius')}</Label>
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
                <Label className="text-[11px]">{t('boxShadow.editor.shadowColor')}</Label>
                <ColorPicker
                  value={activeLayer.color}
                  onChange={(value) => updateLayer(activeLayer.id, { color: value })}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="shadow-sm flex flex-col gap-4 p-4 lg:p-5">
        <div>
          <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">{t('boxShadow.sections.preview')}</h2>
        </div>

        <div className="rounded-lg border bg-background p-12 flex items-center justify-center">
          <div
            className="w-40 h-24 rounded-xl border bg-card text-card-foreground flex items-center justify-center text-xs"
            style={{ boxShadow: snippets.boxShadowValue }}
          >
            {t('boxShadow.preview.label')}
          </div>
        </div>

        <Tabs defaultValue="css" className="flex flex-col flex-1">
          <TabsList className="w-max">
            <TabsTrigger value="css" className="text-xs">
              {t('boxShadow.tabs.css')}
            </TabsTrigger>
            <TabsTrigger value="tailwind" className="text-xs">
              {t('boxShadow.tabs.tailwind')}
            </TabsTrigger>
            <TabsTrigger value="theme" className="text-xs">
              {t('boxShadow.tabs.theme')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="css" className="flex-1">
            <CodeArea code={snippets.css} language="css" className="border-none bg-transparent" />
          </TabsContent>

          <TabsContent value="tailwind" className="flex-1">
            <CodeArea code={snippets.tailwind} language="js" className="border-none bg-transparent" />
          </TabsContent>

          <TabsContent value="theme" className="flex-1">
            <CodeArea code={snippets.theme} language="js" className="border-none bg-transparent" />
          </TabsContent>
        </Tabs>

        <div className="border-t border-border pt-3 mt-1">
          <h3 className="text-xs font-semibold mb-1.5">{t('boxShadow.tips.title')}</h3>
          <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-1">
            <li>{t('boxShadow.tips.tip1')}</li>
            <li>{t('boxShadow.tips.tip2')}</li>
            <li>{t('boxShadow.tips.tip3')}</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

export default BoxShadowPage;
