import imageCompression from 'browser-image-compression';
import { HelpCircle, Image as ImageIcon, Lock, Unlock } from 'lucide-react';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { FileDragUploader } from '@/components/file-drag-uploader';
import { Image as ImageComponent } from '@/components/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return '-';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

// 检测图片是否有透明通道（仅用于 PNG 智能提示）
async function checkImageHasAlpha(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(false);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 检查是否有任何像素的 alpha 通道不是 255（完全不透明）
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) {
          resolve(true);
          return;
        }
      }
      resolve(false);
    };
    img.onerror = () => resolve(false);
    img.src = imageUrl;
  });
}

// 压缩预设配置
type PresetType = 'custom' | 'social' | 'web' | 'extreme';

interface PresetConfig {
  quality: number;
  format: 'auto' | 'image/jpeg' | 'image/png' | 'image/webp';
  maxWidth?: number;
}

const PRESETS: Record<PresetType, PresetConfig> = {
  custom: {
    quality: 80,
    format: 'auto',
  },
  social: {
    quality: 75,
    format: 'image/jpeg',
    maxWidth: 1280,
  },
  web: {
    quality: 75,
    format: 'image/webp',
    maxWidth: 1080,
  },
  extreme: {
    quality: 65,
    format: 'image/webp',
    maxWidth: 800,
  },
};

// ─── useReducer 替代 17 个 useState ───────────────────────────

interface CompressorState {
  originalFile: File | null;
  originalUrl: string | null;
  originalSize: number | null;
  originalWidth: number | null;
  originalHeight: number | null;
  originalType: string | null;
  originalPlaceholder: string;
  hasAlpha: boolean | null;

  compressedBlob: Blob | null;
  compressedUrl: string | null;
  compressedSize: number | null;
  compressedWidth: number | null;
  compressedHeight: number | null;
  compressedPlaceholder: string;

  formatValue: 'auto' | 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number;
  targetWidth: string;
  targetHeight: string;
  keepAspectRatio: boolean;
  scalePercentage: number;
  currentPreset: PresetType;
  isCompressing: boolean;
  skipCompression: boolean;
}

const INITIAL_STATE: CompressorState = {
  originalFile: null,
  originalUrl: null,
  originalSize: null,
  originalWidth: null,
  originalHeight: null,
  originalType: null,
  originalPlaceholder: 'preview.originalPlaceholder',
  hasAlpha: null,

  compressedBlob: null,
  compressedUrl: null,
  compressedSize: null,
  compressedWidth: null,
  compressedHeight: null,
  compressedPlaceholder: 'preview.resultPlaceholder',

  formatValue: 'auto',
  quality: 80,
  targetWidth: '',
  targetHeight: '',
  keepAspectRatio: true,
  scalePercentage: 100,
  currentPreset: 'custom',
  isCompressing: false,
  skipCompression: false,
};

type CompressorAction =
  | { type: 'RESET' }
  | { type: 'UPDATE'; payload: Partial<CompressorState> };

function compressorReducer(state: CompressorState, action: CompressorAction): CompressorState {
  switch (action.type) {
    case 'RESET':
      return INITIAL_STATE;
    case 'UPDATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

function ImageCompressorPage() {
  const { t } = useTranslation('tools');
  const [state, dispatch] = useReducer(compressorReducer, INITIAL_STATE);
  const {
    originalFile, originalUrl, originalSize, originalWidth, originalHeight,
    originalType, originalPlaceholder, hasAlpha,
    compressedBlob, compressedUrl, compressedSize, compressedWidth, compressedHeight,
    compressedPlaceholder, formatValue, quality, targetWidth, targetHeight,
    keepAspectRatio, scalePercentage, currentPreset, isCompressing, skipCompression,
  } = state;

  // 用于稳定化 compress 中对最新 state 的访问
  const stateRef = useRef(state);
  stateRef.current = state;
  const update = useCallback((payload: Partial<CompressorState>) => {
    dispatch({ type: 'UPDATE', payload });
  }, []);

  useEffect(() => {
    return () => {
      if (stateRef.current.originalUrl) URL.revokeObjectURL(stateRef.current.originalUrl);
      if (stateRef.current.compressedUrl) URL.revokeObjectURL(stateRef.current.compressedUrl);
    };
  }, []);

  function resetAll() {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    dispatch({ type: 'RESET' });
  }

  function handleFile(file: File) {
    resetAll();

    update({
      originalFile: file,
      originalSize: file.size,
      originalType: file.type,
    });

    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : '';
      if (!url) {
        update({ originalPlaceholder: t('imageCompressor.preview.originalFailed') });
        toast.error(t('imageCompressor.preview.imageFailed'));
        return;
      }
      const img = new Image();
      img.onload = async () => {
        update({
          originalUrl: url,
          originalWidth: img.width,
          originalHeight: img.height,
          originalPlaceholder: t('imageCompressor.preview.originalPlaceholder'),
          targetWidth: img.width.toString(),
          targetHeight: img.height.toString(),
        });

        toast.success(t('imageCompressor.preview.uploadSuccess'));

        // PNG 智能提示逻辑
        if (file.type === 'image/png') {
          const alphaDetected = await checkImageHasAlpha(url);
          update({ hasAlpha: alphaDetected });
        } else {
          update({ hasAlpha: null });
        }
      };
      img.onerror = () => {
        update({ originalPlaceholder: t('imageCompressor.preview.originalFailed') });
        toast.error(t('imageCompressor.preview.imageFailed'));
      };
      img.src = url;
    };
    reader.onerror = () => {
      update({ originalPlaceholder: t('imageCompressor.preview.originalFailed') });
      toast.error(t('imageCompressor.preview.readFailed'));
    };

    reader.readAsDataURL(file);
  }

  // 处理宽度变化
  function handleWidthChange(value: string) {
    const numValue = parseInt(value) || 0;
    const changes: Partial<CompressorState> = { targetWidth: value, currentPreset: 'custom' };

    if (keepAspectRatio && originalWidth && originalHeight && numValue > 0) {
      const ratio = originalHeight / originalWidth;
      changes.targetHeight = Math.round(numValue * ratio).toString();
      changes.scalePercentage = Math.round((numValue / originalWidth) * 100);
    }

    update(changes);
  }

  // 处理高度变化
  function handleHeightChange(value: string) {
    const numValue = parseInt(value) || 0;
    const changes: Partial<CompressorState> = { targetHeight: value, currentPreset: 'custom' };

    if (keepAspectRatio && originalWidth && originalHeight && numValue > 0) {
      const ratio = originalWidth / originalHeight;
      changes.targetWidth = Math.round(numValue * ratio).toString();
      changes.scalePercentage = Math.round((numValue / originalHeight) * 100);
    }

    update(changes);
  }

  // 处理百分比缩放
  function handleScaleChange(percentage: number) {
    const changes: Partial<CompressorState> = { scalePercentage: percentage, currentPreset: 'custom' };

    if (originalWidth && originalHeight) {
      changes.targetWidth = Math.round((originalWidth * percentage) / 100).toString();
      changes.targetHeight = Math.round((originalHeight * percentage) / 100).toString();
    }

    update(changes);
  }

  // 切换宽高比锁定 —— 通过 dispatch 直接取反，避免闭包读到旧值
  function toggleAspectRatio() {
    dispatch({ type: 'UPDATE', payload: { keepAspectRatio: !stateRef.current.keepAspectRatio } });
  }

  // 应用预设
  function applyPreset(preset: PresetType) {
    const config = PRESETS[preset];
    const changes: Partial<CompressorState> = {
      currentPreset: preset,
      quality: config.quality,
      formatValue: config.format,
    };

    if (config.maxWidth && originalWidth && originalHeight) {
      if (originalWidth > config.maxWidth) {
        const ratio = originalHeight / originalWidth;
        const newWidth = config.maxWidth;
        const newHeight = Math.round(newWidth * ratio);
        changes.targetWidth = newWidth.toString();
        changes.targetHeight = newHeight.toString();
        changes.scalePercentage = Math.round((newWidth / originalWidth) * 100);
      } else {
        changes.targetWidth = originalWidth.toString();
        changes.targetHeight = originalHeight.toString();
        changes.scalePercentage = 100;
      }
    }

    update(changes);
  }

  // 稳定化的 compress 函数，通过 stateRef 获取最新状态
  const compress = useCallback(async () => {
    const s = stateRef.current;
    if (!s.originalFile || !s.originalWidth || !s.originalHeight) return;

    const finalWidth = parseInt(s.targetWidth) || s.originalWidth;
    const finalHeight = parseInt(s.targetHeight) || s.originalHeight;

    if (finalWidth <= 0 || finalHeight <= 0) {
      toast.error(t('imageCompressor.preview.invalidSize'));
      return;
    }

    try {
      dispatch({ type: 'UPDATE', payload: { isCompressing: true, compressedPlaceholder: t('imageCompressor.preview.compressing') } });

      // 如果启用了"不压缩"且尺寸未变：直接使用原图
      if (s.skipCompression && finalWidth === s.originalWidth && finalHeight === s.originalHeight) {
        dispatch({
          type: 'UPDATE',
          payload: {
            compressedBlob: s.originalFile,
            compressedUrl: s.originalUrl,
            compressedSize: s.originalFile.size,
            compressedWidth: s.originalWidth,
            compressedHeight: s.originalHeight,
            compressedPlaceholder: t('imageCompressor.preview.resultPlaceholder'),
            isCompressing: false,
          },
        });
        return;
      }

      // 确定输出格式
      let fileType: string = s.formatValue;
      if (fileType === 'auto') {
        fileType = s.originalFile.type || 'image/jpeg';
      }

      const options = {
        maxWidthOrHeight: Math.max(finalWidth, finalHeight),
        initialQuality: s.quality / 100,
        fileType,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(s.originalFile, options);

      const compressedImage = await imageCompression.getDataUrlFromFile(compressedFile);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('image-load'));
        image.src = compressedImage;
      });

      let finalBlob: Blob = compressedFile;
      let finalCompressedWidth = img.width;
      let finalCompressedHeight = img.height;

      if (finalWidth !== finalCompressedWidth || finalHeight !== finalCompressedHeight) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no-context');

        canvas.width = finalWidth;
        canvas.height = finalHeight;
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

        finalBlob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (!b) reject(new Error('blob-error'));
              else resolve(b);
            },
            fileType,
            s.quality / 100,
          );
        });

        finalCompressedWidth = finalWidth;
        finalCompressedHeight = finalHeight;
      }

      const previewUrl = URL.createObjectURL(finalBlob);

      // 释放旧的 URL
      const currentCompressedUrl = stateRef.current.compressedUrl;
      if (currentCompressedUrl && currentCompressedUrl !== stateRef.current.originalUrl) {
        URL.revokeObjectURL(currentCompressedUrl);
      }

      dispatch({
        type: 'UPDATE',
        payload: {
          compressedBlob: finalBlob,
          compressedUrl: previewUrl,
          compressedSize: finalBlob.size,
          compressedWidth: finalCompressedWidth,
          compressedHeight: finalCompressedHeight,
          compressedPlaceholder: t('imageCompressor.preview.resultPlaceholder'),
          isCompressing: false,
        },
      });
    } catch (error) {
      console.error(error);
      dispatch({
        type: 'UPDATE',
        payload: {
          compressedPlaceholder: t('imageCompressor.preview.failed'),
          isCompressing: false,
        },
      });
      toast.error(t('imageCompressor.preview.error'));
    }
  }, [t]);

  // 当压缩参数变化时触发压缩
  useEffect(() => {
    if (!originalUrl || !originalFile) return;
    const timer = window.setTimeout(() => {
      compress();
    }, 260);
    return () => window.clearTimeout(timer);
  }, [quality, formatValue, targetWidth, targetHeight, skipCompression, originalUrl, originalFile, compress]);

  function handleDownload() {
    if (!compressedBlob || !originalFile) return;

    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement('a');
    const originalName = originalFile.name || 'image';
    const dotIndex = originalName.lastIndexOf('.');
    const baseName = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;

    let ext = '.jpg';
    const mime = compressedBlob.type;
    if (mime === 'image/png') ext = '.png';
    else if (mime === 'image/webp') ext = '.webp';
    else if (mime === 'image/jpeg') ext = '.jpg';

    a.href = url;
    a.download = `${baseName}-compressed${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const canDownload = Boolean(compressedBlob);

  const compressRatioText = useMemo(() => {
    if (!originalSize || !compressedSize || originalSize <= 0) return '-';
    const ratio = (compressedSize / originalSize) * 100;
    const delta = 100 - ratio;
    return `${delta >= 0 ? t('imageCompressor.settings.reduce') : t('imageCompressor.settings.increase')} ${Math.abs(delta).toFixed(1)}%（${ratio.toFixed(1)}% ${t('imageCompressor.settings.originalVolume')}）`;
  }, [originalSize, compressedSize, t]);

  const isCompressedSmaller = Boolean(originalSize && compressedSize && compressedSize <= originalSize);

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <Card className="shadow-sm p-4 lg:p-5 flex flex-col">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase shrink-0">{t('imageCompressor.upload.upload')}</h2>
        <FileDragUploader
          onFileSelect={handleFile}
          onError={(error) => toast.error(error)}
          className="mt-3 bg-muted/60 overflow-hidden flex-1 min-h-0"
          icon={<ImageIcon />}
          title={t('imageCompressor.upload.drag')}
          buttonText={t('imageCompressor.upload.select')}
          hint=""
          accept="image/*"
        />
      </Card>

      <Card className="shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">{t('imageCompressor.settings.title')}</h2>
        <div className="mt-3 grid gap-3">
          {/* 预设模板选择 */}
          <div className="rounded-lg border bg-muted/60 px-2.5 py-2.5">
            <Label className="mb-1 block text-xs">{t('imageCompressor.settings.preset')}</Label>
            <ToggleGroup
              type="single"
              value={currentPreset}
              onValueChange={(val) => val && applyPreset(val as PresetType)}
              className="grid grid-cols-2 gap-1.5"
            >
              <ToggleGroupItem value="custom" className="text-xs h-auto py-1.5 px-2 flex flex-col items-start gap-0.5">
                <span className="font-medium">{t('imageCompressor.presets.custom')}</span>
                <span className="text-[10px] text-muted-foreground">{t('imageCompressor.settings.manual')}</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="social" className="text-xs h-auto py-1.5 px-2 flex flex-col items-start gap-0.5">
                <span className="font-medium">{t('imageCompressor.presets.social')}</span>
                <span className="text-[10px] text-muted-foreground">75%</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="web" className="text-xs h-auto py-1.5 px-2 flex flex-col items-start gap-0.5">
                <span className="font-medium">{t('imageCompressor.presets.web')}</span>
                <span className="text-[10px] text-muted-foreground">75%</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="extreme" className="text-xs h-auto py-1.5 px-2 flex flex-col items-start gap-0.5">
                <span className="font-medium">{t('imageCompressor.presets.extreme')}</span>
                <span className="text-[10px] text-muted-foreground">65%</span>
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {t(`imageCompressor.presets.${currentPreset}Desc`, { defaultValue: t(`imageCompressor.presets.manual`) })}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/60 px-3 py-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <Label className="text-xs">{t('imageCompressor.settings.quality')}</Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant={skipCompression ? 'default' : 'secondary'}
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => {
                      update({ skipCompression: !skipCompression, currentPreset: 'custom' });
                    }}
                  >
                    {skipCompression ? (
                      `✓ ${t('imageCompressor.settings.noCompress')}`
                    ) : (
                      <>
                        <span>{t('imageCompressor.settings.noCompress')}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <HelpCircle />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px] text-xs">
                              <p>{t('imageCompressor.settings.noCompressTip')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}
                  </Button>
                </div>
                {!skipCompression && (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {quality}%
                  </span>
                )}
              </div>
            </div>
            {!skipCompression && (
              <>
                <Slider value={[quality]} min={10} max={100} step={1} onValueChange={([v]) => update({ quality: v })} />
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  {t('imageCompressor.settings.qualityTip')}
                </p>
              </>
            )}
            {skipCompression && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                {t('imageCompressor.settings.noCompressOn')}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/60 px-3 py-3">
            <Label htmlFor="formatSelect" className="mb-1.5 block text-xs">
              {t('imageCompressor.settings.format')}
            </Label>
            <Select value={formatValue} onValueChange={(val) => update({ formatValue: val as typeof formatValue })}>
              <SelectTrigger id="formatSelect" className="h-8 text-xs">
                <SelectValue placeholder={t('imageCompressor.settings.keepFormat')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto" className="text-xs">
                  {t('imageCompressor.settings.keepFormat')}
                </SelectItem>
                <SelectItem value="image/jpeg" className="text-xs">
                  {t('imageCompressor.settings.formatJpg')}
                </SelectItem>
                <SelectItem value="image/png" className="text-xs">
                  {t('imageCompressor.settings.formatPng')}
                </SelectItem>
                <SelectItem value="image/webp" className="text-xs">
                  {t('imageCompressor.settings.formatWebp')}
                </SelectItem>
              </SelectContent>
            </Select>
            {originalType === 'image/png' && hasAlpha !== null && (
              <div className="mt-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2">
                <p className="text-[11px] leading-relaxed text-blue-700 dark:text-blue-300">
                  {hasAlpha ? (
                    <>
                      💡 {t('imageCompressor.settings.transparentPng')}
                    </>
                  ) : (
                    <>
                      💡 {t('imageCompressor.settings.noTransparent')}
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* 尺寸调整 */}
          <div className="rounded-lg border bg-muted/60 px-3 py-3">
            <Label className="mb-1.5 flex items-center justify-between text-xs">
              <span>{t('imageCompressor.settings.resize')}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-1 hover:bg-transparent"
                onClick={toggleAspectRatio}
              >
                {keepAspectRatio ? (
                  <Lock className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </Button>
            </Label>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <Label htmlFor="targetWidth" className="text-[10px] text-muted-foreground mb-1 block">
                  {t('imageCompressor.settings.width')}
                </Label>
                <Input
                  id="targetWidth"
                  type="number"
                  min="1"
                  max="10000"
                  value={targetWidth}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="h-8 text-xs"
                  disabled={!originalFile}
                />
              </div>
              <div>
                <Label htmlFor="targetHeight" className="text-[10px] text-muted-foreground mb-1 block">
                  {t('imageCompressor.settings.height')}
                </Label>
                <Input
                  id="targetHeight"
                  type="number"
                  min="1"
                  max="10000"
                  value={targetHeight}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  className="h-8 text-xs"
                  disabled={!originalFile}
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{t('imageCompressor.settings.percent')}</span>
                <span className="font-medium text-primary">{scalePercentage}%</span>
              </Label>
              <Slider
                value={[scalePercentage]}
                min={10}
                max={200}
                step={5}
                onValueChange={([v]) => handleScaleChange(v)}
                disabled={!originalFile}
              />
            </div>

            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {t('imageCompressor.settings.originalSize')}
              {originalWidth && originalHeight ? `${originalWidth} × ${originalHeight}` : '—'}
            </p>
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-2 shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">{t('imageCompressor.compare.title')}</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-muted/40 p-3 sm:p-4">
            <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
              <span>{t('imageCompressor.compare.original')}</span>
              {originalSize ? (
                <span className="text-[11px] text-muted-foreground">{formatBytes(originalSize)}</span>
              ) : null}
            </h3>
            <ImageComponent src={originalUrl} alt={t('imageCompressor.compare.original')} placeholder={t(originalPlaceholder)} canPreview />
            <ul className="mt-2 text-[11px] text-muted-foreground space-y-1">
              <li className="flex justify-between gap-2">
                <span className="opacity-80">{t('imageCompressor.compare.fileSize')}</span>
                <span className="font-medium text-foreground">{formatBytes(originalSize)}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="opacity-80">{t('imageCompressor.compare.imageSize')}</span>
                <span className="font-medium text-foreground">
                  {originalWidth && originalHeight ? `${originalWidth} × ${originalHeight}` : '-'}
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="opacity-80">{t('imageCompressor.compare.formatType')}</span>
                <span className="font-medium text-foreground">{originalType || '-'}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 sm:p-4">
            <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
              <span>{t('imageCompressor.compare.compressed')}</span>
              {isCompressing ? (
                <span className="text-[11px] text-blue-600 dark:text-blue-400 animate-pulse">{t('imageCompressor.compare.compressing')}</span>
              ) : compressedSize ? (
                <span className="text-[11px] text-muted-foreground">{formatBytes(compressedSize)}</span>
              ) : null}
            </h3>
            <ImageComponent src={compressedUrl} alt={t('imageCompressor.compare.compressed')} placeholder={t(compressedPlaceholder)} canPreview />

            <ul className="mt-2 text-[11px] text-muted-foreground space-y-1">
              <li className="flex justify-between gap-2">
                <span className="opacity-80">{t('imageCompressor.compare.compressedSize')}</span>
                <span className="font-medium text-foreground">{formatBytes(compressedSize)}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="opacity-80">{t('imageCompressor.compare.imageSize')}</span>
                <span className="font-medium text-foreground">
                  {compressedWidth && compressedHeight ? `${compressedWidth} × ${compressedHeight}` : '-'}
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="opacity-80">{t('imageCompressor.compare.compressionRatio')}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    compressRatioText === '-'
                      ? 'bg-muted text-muted-foreground'
                      : isCompressedSmaller
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {compressRatioText === '-' ? '—' : compressRatioText}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-2 shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">{t('imageCompressor.actions.helpTitle')}</h2>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!canDownload} onClick={handleDownload} variant="default">
              {t('imageCompressor.actions.download')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                resetAll();
              }}
              variant="outline"
            >
              {t('imageCompressor.actions.reupload')}
            </Button>
          </div>

          <div className="mt-2 border-t border-border pt-3">
            <h3 className="text-xs font-semibold mb-2">{t('imageCompressor.actions.helpTitle')}</h3>
            <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-1">
              <li>{t('imageCompressor.actions.help1')}</li>
              <li>{t('imageCompressor.actions.help2')}</li>
              <li>{t('imageCompressor.actions.help3')}</li>
              <li>{t('imageCompressor.actions.help4')}</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ImageCompressorPage;
