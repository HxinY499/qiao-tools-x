import { useDebounceFn } from 'ahooks';
import { Download, FileImage, RefreshCw, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ColorPicker } from '@/components/color-picker';
import { FileDragUploader } from '@/components/file-drag-uploader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Empty, EmptyDescription } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { selectDisplayParams, useSvgConverterStore } from './store';
import { ConversionParams, OutputFormat, PresetType, SvgItem } from './types';
import { formatBytes, PRESETS } from './utils';

function SvgConverterPage() {
  const { t } = useTranslation('tools');
  const {
    items,
    selectedId,
    isIndividualMode,
    currentPreset,
    addFiles,
    removeItem,
    clearAll,
    selectItem,
    setGlobalParams,
    setItemParams,
    toggleMode,
    applyPreset,
    convertAll,
  } = useSvgConverterStore();

  // 派生 selector：store 变化时自动更新，避免与 useState 同步
  const displayParams = useSvgConverterStore(selectDisplayParams);

  const selectedItem = items.find((i) => i.id === selectedId) || null;

  // 本地覆盖值：用户正在输入时使用，否则回落到 store 的派生值
  // 这样无需 useEffect 同步，避免"镜像 state"反模式
  const [localWidth, setLocalWidth] = useState<number | null>(null);
  const [localHeight, setLocalHeight] = useState<number | null>(null);

  const displayWidth = localWidth ?? displayParams.width;
  const displayHeight = localHeight ?? displayParams.height;

  // 聚合 stats 统计（items 变化时一次遍历搞定）
  const stats = useMemo(() => {
    let totalOriginalSize = 0;
    let totalConvertedSize = 0;
    let successCount = 0;
    for (const item of items) {
      totalOriginalSize += item.file.size;
      if (item.result?.status === 'success') {
        successCount += 1;
        totalConvertedSize += item.result.blob?.size ?? 0;
      }
    }
    return {
      totalOriginalSize,
      totalConvertedSize,
      successCount,
      hasConvertedFiles: successCount > 0,
    };
  }, [items]);

  // 防抖更新参数到 store（触发转换），提交后清空本地覆盖让 Input 回归 store 派生值
  const { run: debouncedUpdateParams } = useDebounceFn(
    (updates: Partial<ConversionParams>) => {
      if (isIndividualMode && selectedId) {
        setItemParams(selectedId, updates);
      } else {
        setGlobalParams(updates);
      }
      setLocalWidth(null);
      setLocalHeight(null);
    },
    { wait: 500 },
  );

  // 立即更新参数到 store（不需要防抖的场景，如颜色选择器、格式选择）
  const updateParams = (updates: Partial<ConversionParams>) => {
    if (isIndividualMode && selectedId) {
      setItemParams(selectedId, updates);
    } else {
      setGlobalParams(updates);
    }
  };

  function downloadFile(item: SvgItem) {
    if (!item.result || item.result.status !== 'success') return;

    const url = item.result.url;

    if (!url) return;
    const a = document.createElement('a');
    const originalName = item.file.name || 'image';
    const dotIndex = originalName.lastIndexOf('.');
    const baseName = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;

    let ext = '.png';
    if (item.result.blob?.type === 'image/jpeg') ext = '.jpg';
    else if (item.result.blob?.type === 'image/webp') ext = '.webp';

    a.href = url;
    a.download = `${baseName}${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function downloadAllFiles() {
    const convertedFiles = items.filter((item) => item.result?.status === 'success');
    if (convertedFiles.length === 0) {
      toast.error(t('svgConverter.toast.noFilesToDownload'));
      return;
    }

    convertedFiles.forEach((file, index) => {
      setTimeout(() => {
        downloadFile(file);
      }, index * 200);
    });

    toast.success(t('svgConverter.toast.startDownload', { count: convertedFiles.length }));
  }

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-4 lg:space-y-6">
      {/* 上传区域 */}
      <Card className="shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
          {t('svgConverter.sections.upload')}
        </h2>
        <FileDragUploader
          onFileSelect={(file) => addFiles([file])}
          onFilesSelect={addFiles}
          onError={(error) => toast.error(error)}
          className="mt-3 bg-muted/60 min-h-[120px]"
          icon={<FileImage />}
          title={t('svgConverter.uploader.title')}
          buttonText={t('svgConverter.uploader.button')}
          hint={t('svgConverter.uploader.hint')}
          accept=".svg,image/svg+xml"
          multiple
        />
      </Card>

      <div className="flex gap-4">
        {/* 文件列表 */}
        <Card className="shadow-sm p-4 lg:p-5 flex-1">
          {items.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {t('svgConverter.fileList.addedCount', { count: items.length })}
                  {selectedItem && ` ${t('svgConverter.fileList.current', { name: selectedItem.file.name })}`}
                </span>
                <Button type="button" variant="secondary" size="sm" className="h-6 px-2 text-[10px]" onClick={clearAll}>
                  {t('svgConverter.fileList.clearAll')}
                </Button>
              </div>
              <div className="max-h-[200px] overflow-y-auto space-y-1.5 rounded-lg border bg-muted/30 p-2">
                {items.map((item) => {
                  const isConverting = item.result?.status === 'loading';
                  const isSuccess = item.result?.status === 'success';
                  const isError = item.result?.status === 'error';
                  const isSelected = selectedId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs border cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-muted/50'
                      }`}
                      onClick={() => selectItem(item.id)}
                    >
                      <FileImage className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate font-medium">{item.file.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatBytes(item.file.size)}</span>

                      {isConverting && (
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 animate-pulse shrink-0">
                          {t('svgConverter.fileList.converting')}
                        </span>
                      )}

                      {isError && (
                        <span
                          className="text-[10px] text-red-600 dark:text-red-400 shrink-0"
                          title={item.result?.error}
                        >
                          {t('svgConverter.fileList.failed')}
                        </span>
                      )}

                      {isSuccess && !isConverting && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(item);
                          }}
                          title={t('svgConverter.fileList.download')}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 shrink-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        title={t('svgConverter.fileList.remove')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <Empty>
              <EmptyDescription>{t('svgConverter.fileList.empty')}</EmptyDescription>
            </Empty>
          )}
        </Card>

        {/* 转换参数 */}
        <Card className="shadow-sm p-4 lg:p-5 flex-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
              {t('svgConverter.sections.params')}
            </h2>
            {items.length > 1 && (
              <Button
                type="button"
                variant={isIndividualMode ? 'default' : 'secondary'}
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={toggleMode}
              >
                {isIndividualMode
                  ? t('svgConverter.params.individualModeActive')
                  : t('svgConverter.params.unifiedMode')}
              </Button>
            )}
          </div>

          {isIndividualMode && (
            <p className="mb-3 text-[11px] text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md px-2 py-1.5">
              💡 {t('svgConverter.params.individualModeHint')}
            </p>
          )}

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {/* 预设尺寸 */}
            <div className="rounded-lg border bg-muted/60 px-2.5 py-2.5">
              <Label className="mb-1 block text-xs">{t('svgConverter.params.presetSize')}</Label>
              <ToggleGroup
                type="single"
                value={currentPreset}
                onValueChange={(val) => {
                  if (val) applyPreset(val as PresetType);
                }}
                className="grid grid-cols-2 gap-1.5"
              >
                {Object.entries(PRESETS)
                  .filter(([key]) => key !== 'custom')
                  .map(([key, config]) => (
                    <ToggleGroupItem
                      key={key}
                      value={key}
                      className="text-xs h-auto py-1.5 px-2 flex flex-col items-start gap-0.5"
                    >
                      <span className="font-medium">
                        {t(`svgConverter.presets.${key}.label`, { defaultValue: config.label })}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {config.size
                          ? `${config.size}×${config.size}`
                          : t('svgConverter.presets.keepOriginal')}
                      </span>
                    </ToggleGroupItem>
                  ))}
              </ToggleGroup>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {t(`svgConverter.presets.${currentPreset}.description`, { defaultValue: PRESETS[currentPreset].description })}
              </p>
            </div>

            {/* 自定义尺寸 */}
            <div className="rounded-lg border bg-muted/60 px-3 py-3">
              <Label className="mb-1.5 block text-xs">{t('svgConverter.params.customSize')}</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="targetWidth" className="text-[10px] text-muted-foreground mb-1 block">
                    {t('svgConverter.params.width')}
                  </Label>
                  <Input
                    id="targetWidth"
                    type="number"
                    min="1"
                    max="10000"
                    value={displayWidth}
                    onChange={(e) => {
                      const newWidth = Number(e.target.value);
                      setLocalWidth(newWidth);
                      debouncedUpdateParams({ width: newWidth });
                    }}
                    className="h-8 text-xs"
                    disabled={items.length === 0}
                  />
                </div>
                <div>
                  <Label htmlFor="targetHeight" className="text-[10px] text-muted-foreground mb-1 block">
                    {t('svgConverter.params.height')}
                  </Label>
                  <Input
                    id="targetHeight"
                    type="number"
                    min="1"
                    max="10000"
                    value={displayHeight}
                    onChange={(e) => {
                      const newHeight = Number(e.target.value);
                      setLocalHeight(newHeight);
                      debouncedUpdateParams({ height: newHeight });
                    }}
                    className="h-8 text-xs"
                    disabled={items.length === 0}
                  />
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                {selectedItem
                  ? t('svgConverter.params.originalSize', {
                      w: selectedItem.originalWidth,
                      h: selectedItem.originalHeight,
                    })
                  : t('svgConverter.params.uploadFirst')}
              </p>
            </div>

            {/* 输出格式 */}
            <div className="rounded-lg border bg-muted/60 px-3 py-3">
              <Label htmlFor="formatSelect" className="mb-1.5 block text-xs">
                {t('svgConverter.params.outputFormat')}
              </Label>
              <Select
                value={displayParams.format}
                onValueChange={(val) => updateParams({ format: val as OutputFormat })}
              >
                <SelectTrigger id="formatSelect" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image/png" className="text-xs">
                    {t('svgConverter.formats.png')}
                  </SelectItem>
                  <SelectItem value="image/jpeg" className="text-xs">
                    {t('svgConverter.formats.jpeg')}
                  </SelectItem>
                  <SelectItem value="image/webp" className="text-xs">
                    {t('svgConverter.formats.webp')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 背景色设置 */}
            {displayParams.format !== 'image/jpeg' && (
              <div className="rounded-lg border bg-muted/60 px-3 py-3">
                <Label className="mb-1.5 flex items-center justify-between text-xs">
                  <span>{t('svgConverter.params.bgSettings')}</span>
                  <Button
                    type="button"
                    variant={displayParams.useTransparent ? 'default' : 'secondary'}
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => updateParams({ useTransparent: !displayParams.useTransparent })}
                  >
                    {displayParams.useTransparent
                      ? t('svgConverter.params.transparentActive')
                      : t('svgConverter.params.transparent')}
                  </Button>
                </Label>
                {!displayParams.useTransparent && (
                  <div className="mt-2">
                    <ColorPicker
                      value={displayParams.backgroundColor}
                      onChange={(color) => updateParams({ backgroundColor: color })}
                    />
                  </div>
                )}
              </div>
            )}

            {displayParams.format === 'image/jpeg' && (
              <div className="rounded-lg border bg-muted/60 px-3 py-3">
                <Label className="mb-1.5 block text-xs">{t('svgConverter.params.bgColorJpeg')}</Label>
                <ColorPicker
                  value={displayParams.backgroundColor}
                  onChange={(color) => updateParams({ backgroundColor: color })}
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 预览对比 */}
      {selectedItem && (
        <Card className="shadow-sm p-4 lg:p-5">
          <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
            {t('svgConverter.sections.preview')}
            {items.length > 1 &&
              ` (${items.findIndex((f) => f.id === selectedId) + 1}/${items.length})`}
          </h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {/* 原始 SVG */}
              <div className="rounded-lg border bg-muted/40 p-3 sm:p-4">
                <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
                  <span>{t('svgConverter.preview.original')}</span>
                  <span className="text-[11px] text-muted-foreground">{formatBytes(selectedItem.file.size)}</span>
                </h3>
                <div className="rounded-lg border bg-background p-4 flex items-center justify-center min-h-[200px]">
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedItem.content }}
                    className="max-w-full max-h-[300px] svg-preview"
                  />
                </div>
                <ul className="mt-2 text-[11px] text-muted-foreground space-y-1">
                  <li className="flex justify-between gap-2">
                    <span className="opacity-80">{t('svgConverter.preview.fileSize')}</span>
                    <span className="font-medium text-foreground">{formatBytes(selectedItem.file.size)}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="opacity-80">{t('svgConverter.preview.originalSize')}</span>
                    <span className="font-medium text-foreground">
                      {selectedItem.originalWidth} × {selectedItem.originalHeight}
                    </span>
                  </li>
                </ul>
              </div>

            {/* 转换后图片 */}
            <div className="rounded-lg border bg-muted/40 p-3 sm:p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
                <span>{t('svgConverter.preview.converted')}</span>
                {selectedItem.result?.status === 'loading' ? (
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 animate-pulse">
                    {t('svgConverter.preview.converting')}
                  </span>
                ) : selectedItem.result?.status === 'success' ? (
                  <span className="text-[11px] text-muted-foreground">
                    {formatBytes(selectedItem.result?.blob?.size)}
                  </span>
                ) : selectedItem.result?.status === 'error' ? (
                  <span className="text-[11px] text-red-600 dark:text-red-400">
                    {t('svgConverter.preview.convertFailed')}
                  </span>
                ) : null}
              </h3>
              <div className="rounded-lg border bg-background p-4 flex items-center justify-center h-[268px]">
                {selectedItem.result?.status === 'success' ? (
                  <img
                    src={selectedItem.result.url}
                    alt={t('svgConverter.preview.convertedAlt')}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : selectedItem.result?.status === 'loading' ? (
                  <span className="text-sm text-muted-foreground">{t('svgConverter.preview.converting')}</span>
                ) : selectedItem.result?.status === 'error' ? (
                  <div className="text-center">
                    <span className="text-sm text-red-600 dark:text-red-400 block mb-1">
                      {t('svgConverter.preview.convertFailed')}
                    </span>
                    <span className="text-xs text-muted-foreground">{selectedItem.result.error}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{t('svgConverter.preview.waiting')}</span>
                )}
              </div>
              <ul className="mt-2 text-[11px] text-muted-foreground space-y-1">
                <li className="flex justify-between gap-2">
                  <span className="opacity-80">{t('svgConverter.preview.fileSize')}</span>
                  <span className="font-medium text-foreground">
                    {selectedItem.result?.status === 'success' && selectedItem.result.blob
                      ? formatBytes(selectedItem.result.blob.size)
                      : '-'}
                  </span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="opacity-80">{t('svgConverter.preview.exportSize')}</span>
                  <span className="font-medium text-foreground">
                    {displayParams.width} × {displayParams.height}
                  </span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="opacity-80">{t('svgConverter.preview.outputFormat')}</span>
                  <span className="font-medium text-foreground">
                    {displayParams.format === 'image/png'
                      ? 'PNG'
                      : displayParams.format === 'image/jpeg'
                        ? 'JPEG'
                        : 'WebP'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* 操作 & 使用说明 */}
      <Card className="shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
          {t('svgConverter.sections.actions')}
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!stats.hasConvertedFiles} onClick={downloadAllFiles} variant="default">
              {t('svgConverter.actions.downloadAll', { count: stats.successCount })}
            </Button>
            <Button type="button" disabled={items.length === 0} onClick={() => convertAll()} variant="outline">
              <RefreshCw className="w-3 h-3 mr-1" />
              {t('svgConverter.actions.reconvert')}
            </Button>
            <Button type="button" onClick={clearAll} variant="outline">
              {t('svgConverter.actions.clearAndReupload')}
            </Button>
          </div>

          {/* 统计信息 */}
          {items.length > 0 && (
            <div className="rounded-lg border bg-muted/40 px-3 py-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">{t('svgConverter.stats.totalFiles')}</span>
                  <span className="font-medium">{t('svgConverter.stats.fileCount', { count: items.length })}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('svgConverter.stats.originalSize')}</span>
                  <span className="font-medium">{formatBytes(stats.totalOriginalSize)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('svgConverter.stats.converted')}</span>
                  <span className="font-medium">{t('svgConverter.stats.fileCount', { count: stats.successCount })}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('svgConverter.stats.convertedSize')}</span>
                  <span className="font-medium">{formatBytes(stats.totalConvertedSize)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 border-t border-border pt-3">
            <h3 className="text-xs font-semibold mb-2">{t('svgConverter.guide.title')}</h3>
            <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-1">
              <li>{t('svgConverter.guide.tip1')}</li>
              <li>{t('svgConverter.guide.tip2')}</li>
              <li>{t('svgConverter.guide.tip3')}</li>
              <li>{t('svgConverter.guide.tip4')}</li>
              <li>{t('svgConverter.guide.tip5')}</li>
              <li>{t('svgConverter.guide.tip6')}</li>
              <li>{t('svgConverter.guide.tip7')}</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default SvgConverterPage;
