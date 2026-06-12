import { RotateCcw, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

import { useJsonFormatterStore } from './store';

export function JsonSettings() {
  const { t } = useTranslation('tools');
  const {
    simpleMode,
    rootFontSize,
    indent,
    collapse,
    showArrayIndices,
    showStringQuotes,
    sortKeys,
    showCollectionCount,
    arrayIndexFromOne,
    showIconTooltips,
    stringTruncate,
    collapseAnimationTime,
    viewOnly,
    enableClipboard,

    setSimpleMode,
    setRootFontSize,
    setIndent,
    setCollapse,
    setShowArrayIndices,
    setShowStringQuotes,
    setSortKeys,
    setShowCollectionCount,
    setArrayIndexFromOne,
    setShowIconTooltips,
    setStringTruncate,
    setCollapseAnimationTime,
    setViewOnly,
    setEnableClipboard,

    resetSettings,
  } = useJsonFormatterStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted" title={t('jsonFormatter.settingsTitle')}>
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 flex items-center justify-between border-b">
          <h4 className="font-medium leading-none">{t('jsonFormatter.settingsTitle')}</h4>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetSettings} title={t('jsonFormatter.resetAllSettings')}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        <ScrollArea className="h-[400px] p-4">
          <div className="grid gap-6">
            {/* 模式切换 */}
            <div className="flex items-center justify-between">
              <div className="grid gap-0.5">
                <Label htmlFor="simple-mode" className="text-sm font-medium">
                  {t('jsonFormatter.simpleMode')}
                </Label>
                <p className="text-xs text-muted-foreground">{t('jsonFormatter.simpleModeDesc')}</p>
              </div>
              <Switch id="simple-mode" checked={simpleMode} onCheckedChange={setSimpleMode} />
            </div>

            <Separator />

            {/* 简易模式下禁用其他设置 */}
            <div className={simpleMode ? 'opacity-50 pointer-events-none grayscale' : ''}>
              {/* 基础外观 */}
              <div className="grid gap-4">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('jsonFormatter.basicAppearance')}</h5>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="font-size" className="text-xs">
                        {t('jsonFormatter.fontSize', { size: rootFontSize })}
                      </Label>
                    </div>
                    <Slider
                      id="font-size"
                      min={10}
                      max={24}
                      step={1}
                      value={[rootFontSize]}
                      onValueChange={(v) => setRootFontSize(v[0])}
                      className="[&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="indent" className="text-xs">
                        {t('jsonFormatter.indentWidth', { count: indent })}
                      </Label>
                    </div>
                    <Slider
                      id="indent"
                      min={1}
                      max={8}
                      step={1}
                      value={[indent]}
                      onValueChange={(v) => setIndent(v[0])}
                      className="[&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* 显示控制 */}
              <div className="grid gap-4">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('jsonFormatter.displayControl')}</h5>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="collapse" className="flex-1 cursor-pointer text-sm">
                      {t('jsonFormatter.collapseAll')}
                    </Label>
                    <Switch id="collapse" checked={collapse} onCheckedChange={setCollapse} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-indices" className="flex-1 cursor-pointer text-sm">
                      {t('jsonFormatter.showArrayIndices')}
                    </Label>
                    <Switch id="show-indices" checked={showArrayIndices} onCheckedChange={setShowArrayIndices} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-quotes" className="flex-1 cursor-pointer text-sm">
                      {t('jsonFormatter.showStringQuotes')}
                    </Label>
                    <Switch id="show-quotes" checked={showStringQuotes} onCheckedChange={setShowStringQuotes} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-count" className="flex-1 cursor-pointer text-sm">
                      {t('jsonFormatter.showCollectionCount')}
                    </Label>
                    <Switch id="show-count" checked={showCollectionCount} onCheckedChange={setShowCollectionCount} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="index-from-one" className="flex-1 cursor-pointer text-sm">
                      {t('jsonFormatter.arrayIndexFromOne')}
                    </Label>
                    <Switch id="index-from-one" checked={arrayIndexFromOne} onCheckedChange={setArrayIndexFromOne} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-tooltips" className="flex-1 cursor-pointer text-sm">
                      {t('jsonFormatter.showIconTooltips')}
                    </Label>
                    <Switch id="show-tooltips" checked={showIconTooltips} onCheckedChange={setShowIconTooltips} />
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* 高级功能 */}
              <div className="grid gap-4">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('jsonFormatter.advancedFeatures')}</h5>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="view-only" className="flex-1 cursor-pointer text-sm">
                      {t('jsonFormatter.viewOnly')}
                    </Label>
                    <Switch id="view-only" checked={viewOnly} onCheckedChange={setViewOnly} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-clipboard" className="flex-1 cursor-pointer text-sm">
                      {t('jsonFormatter.enableClipboard')}
                    </Label>
                    <Switch id="enable-clipboard" checked={enableClipboard} onCheckedChange={setEnableClipboard} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="sort-keys" className="flex-1 cursor-pointer text-sm">
                      {t('jsonFormatter.sortKeys')}
                    </Label>
                    <Switch id="sort-keys" checked={sortKeys} onCheckedChange={setSortKeys} />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="string-truncate" className="text-xs">
                        {t('jsonFormatter.stringTruncate', { length: stringTruncate })}
                      </Label>
                    </div>
                    <Slider
                      id="string-truncate"
                      min={10}
                      max={500}
                      step={10}
                      value={[stringTruncate]}
                      onValueChange={(v) => setStringTruncate(v[0])}
                      className="[&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="animation-time" className="text-xs">
                        {t('jsonFormatter.animationSpeed', { time: collapseAnimationTime })}
                      </Label>
                    </div>
                    <Slider
                      id="animation-time"
                      min={0}
                      max={1000}
                      step={50}
                      value={[collapseAnimationTime]}
                      onValueChange={(v) => setCollapseAnimationTime(v[0])}
                      className="[&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
