import { useDebounceFn } from 'ahooks';
import { Download, FileImage, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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

import { useSvgConverterStore } from './store';
import { ConversionParams, OutputFormat, PresetType, SvgItem } from './types';
import { formatBytes, PRESETS } from './utils';

function SvgConverterPage() {
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
    getDisplayParams,
  } = useSvgConverterStore();

  const selectedItem = items.find((i) => i.id === selectedId) || null;
  const displayParams = getDisplayParams();

  // 本地状态：用于 Input 立即响应用户输入
  const [localWidth, setLocalWidth] = useState(displayParams.width);
  const [localHeight, setLocalHeight] = useState(displayParams.height);

  // 当 displayParams 变化时（切换文件、模式、预设），同步到本地状态
  useEffect(() => {
    setLocalWidth(displayParams.width);
    setLocalHeight(displayParams.height);
  }, [displayParams.width, displayParams.height, selectedId, isIndividualMode, currentPreset]);

  const totalOriginalSize = items.reduce((sum, item) => sum + item.file.size, 0);
  const totalConvertedSize = items.reduce((sum, item) => sum + (item.result?.blob?.size || 0), 0);
  const hasConvertedFiles = items.some((item) => item.result?.status === 'success');

  // 防抖更新参数到 store（触发转换）
  const { run: debouncedUpdateParams } = useDebounceFn(
    (updates: Partial<ConversionParams>) => {
      if (isIndividualMode && selectedId) {
        setItemParams(selectedId, updates);
      } else {
        setGlobalParams(updates);
      }
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
      toast.error('没有可下载的文件');
      return;
    }

    convertedFiles.forEach((file, index) => {
      setTimeout(() => {
        downloadFile(file);
      }, index * 200);
    });

    toast.success(`开始下载 ${convertedFiles.length} 个文件`);
  }

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-4 lg:space-y-6">
      {/* 上传区域 */}
      <Card className="shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">上传 SVG</h2>
        <FileDragUploader
          onFileSelect={(file) => addFiles([file])}
          onFilesSelect={addFiles}
          onError={(error) => toast.error(error)}
          className="mt-3 bg-muted/60 min-h-[120px]"
          icon={<FileImage />}
          title="拖拽 SVG 文件到此处，或"
          buttonText="选择 SVG 文件"
          hint="支持批量上传多个 SVG 文件"
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
                  已添加 {items.length} 个文件 {selectedItem && `（当前：${selectedItem.file.name}）`}
                </span>
                <Button type="button" variant="secondary" size="sm" className="h-6 px-2 text-[10px]" onClick={clearAll}>
                  清空列表
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
                          转换中...
                        </span>
                      )}

                      {isError && (
                        <span
                          className="text-[10px] text-red-600 dark:text-red-400 shrink-0"
                          title={item.result?.error}
                        >
                          失败
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
                          title="下载"
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
                        title="移除"
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
              <EmptyDescription>列表为空</EmptyDescription>
            </Empty>
          )}
        </Card>

        {/* 转换参数 */}
        <Card className="shadow-sm p-4 lg:p-5 flex-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">转换参数</h2>
            {items.length > 1 && (
              <Button
                type="button"
                variant={isIndividualMode ? 'default' : 'secondary'}
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={toggleMode}
              >
                {isIndividualMode ? '✓ 独立参数' : '统一参数'}
              </Button>
            )}
          </div>

          {isIndividualMode && (
            <p className="mb-3 text-[11px] text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md px-2 py-1.5">
              💡 独立参数模式：点击文件列表切换编辑对象，参数将分别应用到每个文件
            </p>
          )}

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {/* 预设尺寸 */}
            <div className="rounded-lg border bg-muted/60 px-2.5 py-2.5">
              <Label className="mb-1 block text-xs">预设尺寸</Label>
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
                      <span className="font-medium">{config.label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {config.size ? `${config.size}×${config.size}` : '保持原始'}
                      </span>
                    </ToggleGroupItem>
                  ))}
              </ToggleGroup>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {PRESETS[currentPreset].description}
              </p>
            </div>

            {/* 自定义尺寸 */}
            <div className="rounded-lg border bg-muted/60 px-3 py-3">
              <Label className="mb-1.5 block text-xs">自定义尺寸</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="targetWidth" className="text-[10px] text-muted-foreground mb-1 block">
                    宽度 (px)
                  </Label>
                  <Input
                    id="targetWidth"
                    type="number"
                    min="1"
                    max="10000"
                    value={localWidth}
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
                    高度 (px)
                  </Label>
                  <Input
                    id="targetHeight"
                    type="number"
                    min="1"
                    max="10000"
                    value={localHeight}
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
                  ? `原始尺寸：${selectedItem.originalWidth} × ${selectedItem.originalHeight}`
                  : '请上传文件'}
              </p>
            </div>

            {/* 输出格式 */}
            <div className="rounded-lg border bg-muted/60 px-3 py-3">
              <Label htmlFor="formatSelect" className="mb-1.5 block text-xs">
                输出格式
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
                    PNG（支持透明背景）
                  </SelectItem>
                  <SelectItem value="image/jpeg" className="text-xs">
                    JPEG（适合照片，体积小）
                  </SelectItem>
                  <SelectItem value="image/webp" className="text-xs">
                    WebP（体积最小，支持透明）
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 背景色设置 */}
            {displayParams.format !== 'image/jpeg' && (
              <div className="rounded-lg border bg-muted/60 px-3 py-3">
                <Label className="mb-1.5 flex items-center justify-between text-xs">
                  <span>背景设置</span>
                  <Button
                    type="button"
                    variant={displayParams.useTransparent ? 'default' : 'secondary'}
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => updateParams({ useTransparent: !displayParams.useTransparent })}
                  >
                    {displayParams.useTransparent ? '✓ 透明背景' : '透明背景'}
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
                <Label className="mb-1.5 block text-xs">背景色（JPEG 不支持透明）</Label>
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
            预览对比 {items.length > 1 && `（${items.findIndex((f) => f.id === selectedId) + 1}/${items.length}）`}
          </h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {/* 原始 SVG */}
            <div className="rounded-lg border bg-muted/40 p-3 sm:p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
                <span>原始 SVG</span>
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
                  <span className="opacity-80">文件大小：</span>
                  <span className="font-medium text-foreground">{formatBytes(selectedItem.file.size)}</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="opacity-80">原始尺寸：</span>
                  <span className="font-medium text-foreground">
                    {selectedItem.originalWidth} × {selectedItem.originalHeight}
                  </span>
                </li>
              </ul>
            </div>

            {/* 转换后图片 */}
            <div className="rounded-lg border bg-muted/40 p-3 sm:p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
                <span>转换后图片</span>
                {selectedItem.result?.status === 'loading' ? (
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 animate-pulse">正在转换...</span>
                ) : selectedItem.result?.status === 'success' ? (
                  <span className="text-[11px] text-muted-foreground">
                    {formatBytes(selectedItem.result?.blob?.size)}
                  </span>
                ) : selectedItem.result?.status === 'error' ? (
                  <span className="text-[11px] text-red-600 dark:text-red-400">转换失败</span>
                ) : null}
              </h3>
              <div className="rounded-lg border bg-background p-4 flex items-center justify-center h-[268px]">
                {selectedItem.result?.status === 'success' ? (
                  <img
                    src={selectedItem.result.url}
                    alt="转换后预览"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : selectedItem.result?.status === 'loading' ? (
                  <span className="text-sm text-muted-foreground">正在转换...</span>
                ) : selectedItem.result?.status === 'error' ? (
                  <div className="text-center">
                    <span className="text-sm text-red-600 dark:text-red-400 block mb-1">转换失败</span>
                    <span className="text-xs text-muted-foreground">{selectedItem.result.error}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">等待转换...</span>
                )}
              </div>
              <ul className="mt-2 text-[11px] text-muted-foreground space-y-1">
                <li className="flex justify-between gap-2">
                  <span className="opacity-80">文件大小：</span>
                  <span className="font-medium text-foreground">
                    {selectedItem.result?.status === 'success' && selectedItem.result.blob
                      ? formatBytes(selectedItem.result.blob.size)
                      : '-'}
                  </span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="opacity-80">导出尺寸：</span>
                  <span className="font-medium text-foreground">
                    {displayParams.width} × {displayParams.height}
                  </span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="opacity-80">输出格式：</span>
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
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">操作 & 使用说明</h2>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!hasConvertedFiles} onClick={downloadAllFiles} variant="default">
              批量下载（{items.filter((i) => i.result?.status === 'success').length} 个文件）
            </Button>
            <Button type="button" disabled={items.length === 0} onClick={() => convertAll()} variant="outline">
              <RefreshCw className="w-3 h-3 mr-1" />
              重新转换
            </Button>
            <Button type="button" onClick={clearAll} variant="outline">
              清空并重新上传
            </Button>
          </div>

          {/* 统计信息 */}
          {items.length > 0 && (
            <div className="rounded-lg border bg-muted/40 px-3 py-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">总文件数：</span>
                  <span className="font-medium">{items.length} 个</span>
                </div>
                <div>
                  <span className="text-muted-foreground">原始总大小：</span>
                  <span className="font-medium">{formatBytes(totalOriginalSize)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">已转换：</span>
                  <span className="font-medium">{items.filter((i) => i.result?.status === 'success').length} 个</span>
                </div>
                <div>
                  <span className="text-muted-foreground">转换后总大小：</span>
                  <span className="font-medium">{formatBytes(totalConvertedSize)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 border-t border-border pt-3">
            <h3 className="text-xs font-semibold mb-2">使用说明与注意事项</h3>
            <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-1">
              <li>支持批量上传多个 SVG 文件，默认统一参数应用到所有文件。</li>
              <li>点击"独立参数"按钮可为每个文件单独设置转换参数。</li>
              <li>点击文件列表中的文件可切换预览对象。</li>
              <li>PNG 格式支持透明背景，适合带透明效果的图标和图形。</li>
              <li>JPEG 格式体积最小但不支持透明，适合照片类图片。</li>
              <li>WebP 格式兼顾小体积与透明背景，浏览器兼容性较好。</li>
              <li>复杂 SVG（外部字体、滤镜、动画）可能导出效果不佳，建议简化后再转换。</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default SvgConverterPage;
