import { useDebounceEffect } from 'ahooks';
import { Image as ImageIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import ColorPicker from '@/components/color-picker';
import { FileDragUploader } from '@/components/file-drag-uploader';
import { Image as ImageComponent } from '@/components/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const WATERMARK_POSITIONS = [
  { value: 'top-left', label: '左上' },
  { value: 'top-center', label: '上中' },
  { value: 'top-right', label: '右上' },
  { value: 'middle-left', label: '左中' },
  { value: 'center', label: '居中' },
  { value: 'middle-right', label: '右中' },
  { value: 'bottom-left', label: '左下' },
  { value: 'bottom-center', label: '下中' },
  { value: 'bottom-right', label: '右下' },
] as const;

type WatermarkPosition = (typeof WATERMARK_POSITIONS)[number]['value'];

type WatermarkMode = 'text' | 'image';

type FontFamilyOption =
  | 'system'
  | 'serif'
  | 'mono'
  | 'rounded'
  | 'display'
  | 'handwriting'
  | 'comic'
  | 'narrow'
  | 'condensed';

type ExportFormat = 'original' | 'png' | 'jpeg';

function getFontFamilyValue(option: FontFamilyOption): string {
  if (option === 'serif') return 'ui-serif, Georgia, "Times New Roman", serif';
  if (option === 'mono')
    return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
  if (option === 'rounded')
    return '"SF Pro Rounded", ui-rounded, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  if (option === 'display')
    return '"Impact", "Oswald", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  if (option === 'handwriting') return '"Bradley Hand", "Segoe Script", "Comic Sans MS", cursive';
  if (option === 'comic') return '"Comic Sans MS", "Marker Felt", cursive';
  if (option === 'narrow')
    return '"Arial Narrow", "Liberation Sans Narrow", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  if (option === 'condensed')
    return '"Roboto Condensed", "Helvetica Condensed", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function ImageWatermarkPage() {
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [baseImageFile, setBaseImageFile] = useState<File | null>(null);
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null);
  const [baseImageWidth, setBaseImageWidth] = useState<number | null>(null);
  const [baseImageHeight, setBaseImageHeight] = useState<number | null>(null);
  const [baseUploadStatus, setBaseUploadStatus] = useState('尚未选择图片');

  const [mode, setMode] = useState<WatermarkMode>('text');

  const [textWatermark, setTextWatermark] = useState('© qiao-tools-x');
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState<FontFamilyOption>('system');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('bold');
  const [textColor, setTextColor] = useState<string>('#ffffff');

  const [watermarkImageUrl, setWatermarkImageUrl] = useState<string | null>(null);
  const [watermarkScale, setWatermarkScale] = useState<number>(30);

  const [position, setPosition] = useState<WatermarkPosition>('bottom-right');
  const [opacity, setOpacity] = useState<number>(50);
  const [margin, setMargin] = useState<number>(24);
  const [rotation, setRotation] = useState<number>(0);
  const [layoutMode, setLayoutMode] = useState<'single' | 'tiled'>('single');
  const [tileGap, setTileGap] = useState<number>(160);

  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('original');

  const hasBaseImage = useMemo(
    () => Boolean(baseImageUrl && baseImageWidth && baseImageHeight),
    [baseImageUrl, baseImageWidth, baseImageHeight],
  );

  useEffect(() => {
    return () => {
      if (baseImageUrl) URL.revokeObjectURL(baseImageUrl);
      if (watermarkImageUrl) URL.revokeObjectURL(watermarkImageUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const opacityValue = opacity / 100;
  const rotationRadians = (rotation * Math.PI) / 180;

  function handleBaseImageFile(file: File) {
    if (baseImageUrl) URL.revokeObjectURL(baseImageUrl);

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setBaseImageFile(file);
      setBaseImageUrl(url);
      setBaseImageWidth(image.width);
      setBaseImageHeight(image.height);
      setBaseUploadStatus(`已选择：${file.name}`);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error('底图加载失败，请重试或更换图片。');
    };
    image.src = url;
  }

  function handleWatermarkImageFile(file: File) {
    if (watermarkImageUrl) URL.revokeObjectURL(watermarkImageUrl);

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setWatermarkImageUrl(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error('水印图片加载失败，请重试或更换图片。');
    };
    image.src = url;
  }

  function computePosition(
    canvasWidth: number,
    canvasHeight: number,
    watermarkWidth: number,
    watermarkHeight: number,
    watermarkPosition: WatermarkPosition,
    offset: number,
  ) {
    let x = offset;
    let y = offset;

    const centerX = (canvasWidth - watermarkWidth) / 2;
    const centerY = (canvasHeight - watermarkHeight) / 2;

    switch (watermarkPosition) {
      case 'top-left':
        x = offset;
        y = offset;
        break;
      case 'top-center':
        x = centerX;
        y = offset;
        break;
      case 'top-right':
        x = canvasWidth - watermarkWidth - offset;
        y = offset;
        break;
      case 'middle-left':
        x = offset;
        y = centerY;
        break;
      case 'center':
        x = centerX;
        y = centerY;
        break;
      case 'middle-right':
        x = canvasWidth - watermarkWidth - offset;
        y = centerY;
        break;
      case 'bottom-left':
        x = offset;
        y = canvasHeight - watermarkHeight - offset;
        break;
      case 'bottom-center':
        x = centerX;
        y = canvasHeight - watermarkHeight - offset;
        break;
      case 'bottom-right':
      default:
        x = canvasWidth - watermarkWidth - offset;
        y = canvasHeight - watermarkHeight - offset;
        break;
    }

    return { x, y };
  }

  useDebounceEffect(
    () => {
      if (!hasBaseImage || !baseCanvasRef.current || !baseImageUrl) return;

      const canvas = baseCanvasRef.current;
      const context = canvas.getContext('2d');
      if (!context || !baseImageWidth || !baseImageHeight) return;

      const baseImage = new Image();
      baseImage.onload = () => {
        canvas.width = baseImageWidth;
        canvas.height = baseImageHeight;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.globalAlpha = 1;
        context.drawImage(baseImage, 0, 0, baseImageWidth, baseImageHeight);

        const isTiledLayout = layoutMode === 'tiled';

        if (mode === 'text') {
          if (!textWatermark.trim()) {
            setResultDataUrl(canvas.toDataURL('image/png'));
            return;
          }

          const fontFamilyValue = getFontFamilyValue(fontFamily);
          context.globalAlpha = opacityValue;
          context.font = `${fontWeight === 'bold' ? 'bold ' : ''}${fontSize}px ${fontFamilyValue}`;
          context.fillStyle = textColor || '#ffffff';
          context.textBaseline = 'top';

          const lines = textWatermark.split('\n');
          const lineHeight = fontSize * 1.4;

          let watermarkWidth = 0;
          const trimmedLines = lines.map((line) => line.replace(/\r/g, ''));
          trimmedLines.forEach((line) => {
            const metrics = context.measureText(line || ' ');
            if (metrics.width > watermarkWidth) {
              watermarkWidth = metrics.width;
            }
          });

          const watermarkHeight = lineHeight * trimmedLines.length;

          if (isTiledLayout) {
            const stepX = watermarkWidth + tileGap;
            const stepY = watermarkHeight + tileGap;
            const startX = -watermarkWidth;
            const startY = -watermarkHeight;

            for (let y = startY; y < canvas.height + watermarkHeight; y += stepY) {
              for (let x = startX; x < canvas.width + watermarkWidth; x += stepX) {
                const centerX = x + watermarkWidth / 2;
                const centerY = y + watermarkHeight / 2;

                context.save();
                context.translate(centerX, centerY);
                if (rotationRadians !== 0) {
                  context.rotate(rotationRadians);
                }

                trimmedLines.forEach((line, index) => {
                  const lineX = -watermarkWidth / 2;
                  const lineY = -watermarkHeight / 2 + index * lineHeight;
                  context.fillText(line, lineX, lineY);
                });

                context.restore();
              }
            }

            context.globalAlpha = 1;
            setResultDataUrl(canvas.toDataURL('image/png'));
            return;
          }

          const { x, y } = computePosition(
            canvas.width,
            canvas.height,
            watermarkWidth,
            watermarkHeight,
            position,
            margin,
          );

          const centerX = x + watermarkWidth / 2;
          const centerY = y + watermarkHeight / 2;

          context.save();
          context.translate(centerX, centerY);
          if (rotationRadians !== 0) {
            context.rotate(rotationRadians);
          }

          trimmedLines.forEach((line, index) => {
            const lineX = -watermarkWidth / 2;
            const lineY = -watermarkHeight / 2 + index * lineHeight;
            context.fillText(line, lineX, lineY);
          });

          context.restore();
          context.globalAlpha = 1;

          setResultDataUrl(canvas.toDataURL('image/png'));
        } else if (mode === 'image' && watermarkImageUrl) {
          const watermarkImage = new Image();
          watermarkImage.onload = () => {
            const scaleRatio = Math.max(5, Math.min(100, watermarkScale)) / 100;
            const targetWidth = canvas.width * scaleRatio;
            const ratio = watermarkImage.height / watermarkImage.width || 1;
            const targetHeight = targetWidth * ratio;

            if (isTiledLayout) {
              const stepX = targetWidth + tileGap;
              const stepY = targetHeight + tileGap;
              const startX = -targetWidth;
              const startY = -targetHeight;

              context.globalAlpha = opacityValue;

              for (let y = startY; y < canvas.height + targetHeight; y += stepY) {
                for (let x = startX; x < canvas.width + targetWidth; x += stepX) {
                  const centerX = x + targetWidth / 2;
                  const centerY = y + targetHeight / 2;

                  context.save();
                  context.translate(centerX, centerY);
                  if (rotationRadians !== 0) {
                    context.rotate(rotationRadians);
                  }

                  context.drawImage(watermarkImage, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);

                  context.restore();
                }
              }

              context.globalAlpha = 1;
              setResultDataUrl(canvas.toDataURL('image/png'));
              return;
            }

            const { x, y } = computePosition(canvas.width, canvas.height, targetWidth, targetHeight, position, margin);

            const centerX = x + targetWidth / 2;
            const centerY = y + targetHeight / 2;

            context.save();
            context.translate(centerX, centerY);
            if (rotationRadians !== 0) {
              context.rotate(rotationRadians);
            }

            context.globalAlpha = opacityValue;
            context.drawImage(watermarkImage, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
            context.globalAlpha = 1;

            context.restore();

            setResultDataUrl(canvas.toDataURL('image/png'));
          };
          watermarkImage.onerror = () => {
            toast.error('水印图片加载失败，请重试或更换图片。');
          };
          watermarkImage.src = watermarkImageUrl;
        } else {
          setResultDataUrl(canvas.toDataURL('image/png'));
        }
      };
      baseImage.onerror = () => {
        toast.error('底图加载失败，请重试或更换图片。');
      };
      baseImage.src = baseImageUrl;
    },
    [
      hasBaseImage,
      baseImageUrl,
      baseImageWidth,
      baseImageHeight,
      mode,
      textWatermark,
      fontSize,
      fontFamily,
      fontWeight,
      textColor,
      position,
      opacityValue,
      margin,
      watermarkImageUrl,
      watermarkScale,
      rotation,
      layoutMode,
      tileGap,
    ],
    {
      wait: 220,
    },
  );

  function handleDownload() {
    if (!hasBaseImage || !baseCanvasRef.current || !baseImageFile) return;

    const originalName = baseImageFile.name || 'image';
    const dotIndex = originalName.lastIndexOf('.');
    const baseName = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;

    const originalType = baseImageFile.type;

    let mimeType: string = 'image/png';
    let extension = 'png';

    if (exportFormat === 'png') {
      mimeType = 'image/png';
      extension = 'png';
    } else if (exportFormat === 'jpeg') {
      mimeType = 'image/jpeg';
      extension = 'jpg';
    } else {
      if (originalType === 'image/png') {
        mimeType = 'image/png';
        extension = 'png';
      } else if (originalType === 'image/jpeg' || originalType === 'image/jpg') {
        mimeType = 'image/jpeg';
        extension = 'jpg';
      } else if (originalType === 'image/webp') {
        mimeType = 'image/webp';
        extension = 'webp';
      } else {
        mimeType = 'image/png';
        extension = 'png';
      }
    }

    const dataUrl = baseCanvasRef.current.toDataURL(mimeType, mimeType === 'image/jpeg' ? 0.9 : undefined);

    downloadDataUrl(dataUrl, `${baseName}-watermarked.${extension}`);
  }

  const canDownload = Boolean(resultDataUrl && hasBaseImage);

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="shadow-sm p-4 lg:p-5">
          <CardHeader className="space-y-2 p-0">
            <CardTitle className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
              底图与预览
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-3 p-0">
            <div className="space-y-2">
              <Label className="text-xs">上传图片</Label>
              <FileDragUploader
                onFileSelect={handleBaseImageFile}
                onError={(error) => toast.error(error)}
                className="mt-3 bg-muted/60 overflow-hidden h-4/5"
                icon={<ImageIcon />}
                title="拖拽图片到此处，或"
                buttonText="选择图片文件"
                hint=""
                accept="image/*"
              />
              <p className={`mt-2 text-xs ${baseImageFile ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                {baseUploadStatus}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">水印效果预览</Label>
              <canvas ref={baseCanvasRef} className="hidden" />
              <ImageComponent
                src={hasBaseImage && resultDataUrl ? resultDataUrl : null}
                alt="水印效果预览"
                placeholder="水印效果预览"
                canPreview
                imgClassName="max-h-[420px] max-w-full w-full object-contain"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">预览为真实导出效果</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-2">
                <Label className="text-[11px] text-muted-foreground">导出格式</Label>
                <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original" className="text-xs">
                      保持原格式
                    </SelectItem>
                    <SelectItem value="png" className="text-xs">
                      PNG（无损）
                    </SelectItem>
                    <SelectItem value="jpeg" className="text-xs">
                      JPEG（体积更小）
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" size="sm" disabled={!canDownload} onClick={handleDownload}>
                下载带水印图片
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm p-4 lg:p-5">
          <CardHeader className="p-0">
            <CardTitle className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
              水印配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-3 p-0">
            <Tabs value={mode} onValueChange={(value) => setMode(value as WatermarkMode)}>
              <TabsList className="grid grid-cols-2 text-xs">
                <TabsTrigger value="text">文字水印</TabsTrigger>
                <TabsTrigger value="image">图片水印</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4 pt-3">
                <div className="space-y-2">
                  <Label className="text-xs">水印文字内容</Label>
                  <Textarea
                    value={textWatermark}
                    onChange={(event) => setTextWatermark(event.target.value)}
                    className="min-h-[70px] text-xs"
                    placeholder="例如：© 2025 Your Name / your-website.com"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">字体大小</Label>
                    <Slider
                      value={[fontSize]}
                      min={12}
                      max={72}
                      step={1}
                      onValueChange={([value]) => setFontSize(value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">字体样式</Label>
                    <Select value={fontFamily} onValueChange={(value) => setFontFamily(value as FontFamilyOption)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system" className="text-xs">
                          系统字体
                        </SelectItem>
                        <SelectItem value="serif" className="text-xs">
                          衬线字体（Serif）
                        </SelectItem>
                        <SelectItem value="mono" className="text-xs">
                          等宽字体（Monospace）
                        </SelectItem>
                        <SelectItem value="rounded" className="text-xs">
                          圆角标题（Rounded）
                        </SelectItem>
                        <SelectItem value="display" className="text-xs">
                          展示标题（Display）
                        </SelectItem>
                        <SelectItem value="handwriting" className="text-xs">
                          手写风格（Handwriting）
                        </SelectItem>
                        <SelectItem value="comic" className="text-xs">
                          漫画风格（Comic）
                        </SelectItem>
                        <SelectItem value="narrow" className="text-xs">
                          窄体字体（Narrow）
                        </SelectItem>
                        <SelectItem value="condensed" className="text-xs">
                          紧凑字体（Condensed）
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <RadioGroup
                      value={fontWeight}
                      onValueChange={(value) => setFontWeight(value as 'normal' | 'bold')}
                      className="flex items-center gap-3 pt-1"
                    >
                      <Label className="text-[11px] text-muted-foreground">字重：</Label>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="font-weight-normal" value="normal" />
                        <Label htmlFor="font-weight-normal" className="text-[11px]">
                          常规
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="font-weight-bold" value="bold" />
                        <Label htmlFor="font-weight-bold" className="text-[11px]">
                          加粗
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">文字颜色</Label>
                  <ColorPicker value={textColor} onChange={(value) => setTextColor(value)} className="w-full" />
                </div>
              </TabsContent>

              <TabsContent value="image" className="space-y-4 pt-3">
                <div className="space-y-2">
                  <Label className="text-xs">上传水印图片</Label>
                  <FileDragUploader
                    onFileSelect={handleWatermarkImageFile}
                    onError={(error) => toast.error(error)}
                    validation={{
                      accept: ['image/*'],
                    }}
                    className="bg-muted/60 overflow-hidden px-4 py-4"
                    icon={false}
                    title="拖拽水印图片到此处，或"
                    buttonText="选择水印图片"
                    hint="推荐使用带透明背景的 PNG 图标或 Logo，体积不宜过大。"
                    accept="image/*"
                  />
                  {watermarkImageUrl && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1.5">
                      <img src={watermarkImageUrl} alt="水印图片预览" className="h-8 w-auto object-contain rounded" />
                      <span className="text-[11px] text-muted-foreground">当前水印预览</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">水印占底图宽度比例</Label>
                  <Slider
                    value={[watermarkScale]}
                    min={5}
                    max={60}
                    step={1}
                    onValueChange={([value]) => setWatermarkScale(value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    当前约占底图宽度的 {watermarkScale}% ，会按比例等比缩放。
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-3 border-t pt-3">
              <div className="space-y-2">
                <Label className="text-xs">水印布局</Label>
                <RadioGroup
                  value={layoutMode}
                  onValueChange={(value) => setLayoutMode(value as 'single' | 'tiled')}
                  className="flex flex-wrap items-center gap-3"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="layout-single" value="single" />
                    <Label htmlFor="layout-single" className="text-[11px]">
                      单个水印
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="layout-tiled" value="tiled" />
                    <Label htmlFor="layout-tiled" className="text-[11px]">
                      平铺铺满
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {layoutMode === 'single' ? (
                <div className="space-y-2">
                  <Label className="text-xs">水印位置</Label>
                  <div className="flex items-center justify-center gap-3">
                    <div className="grid grid-cols-3 grid-rows-3 gap-1 w-24 h-24 sm:w-28 sm:h-28 border border-border rounded-md bg-muted/40 p-1">
                      {/* top-left */}
                      <button
                        type="button"
                        className={`flex items-center justify-center rounded-[6px] border text-[10px] sm:text-[11px] transition-colors ${
                          position === 'top-left'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                        onClick={() => setPosition('top-left')}
                      ></button>
                      {/* top-center */}
                      <button
                        type="button"
                        className={`flex items-center justify-center rounded-[6px] border text-[10px] sm:text-[11px] transition-colors ${
                          position === 'top-center'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                        onClick={() => setPosition('top-center')}
                      ></button>
                      {/* top-right */}
                      <button
                        type="button"
                        className={`flex items-center justify-center rounded-[6px] border text-[10px] sm:text-[11px] transition-colors ${
                          position === 'top-right'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                        onClick={() => setPosition('top-right')}
                      ></button>

                      {/* middle-left */}
                      <button
                        type="button"
                        className={`flex items-center justify-center rounded-[6px] border text-[10px] sm:text-[11px] transition-colors ${
                          position === 'middle-left'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                        onClick={() => setPosition('middle-left')}
                      ></button>
                      {/* center */}
                      <button
                        type="button"
                        className={`flex items-center justify-center rounded-[6px] border text-[10px] sm:text-[11px] transition-colors ${
                          position === 'center'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                        onClick={() => setPosition('center')}
                      ></button>
                      {/* middle-right */}
                      <button
                        type="button"
                        className={`flex items-center justify-center rounded-[6px] border text-[10px] sm:text-[11px] transition-colors ${
                          position === 'middle-right'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                        onClick={() => setPosition('middle-right')}
                      ></button>

                      {/* bottom-left */}
                      <button
                        type="button"
                        className={`flex items-center justify-center rounded-[6px] border text-[10px] sm:text-[11px] transition-colors ${
                          position === 'bottom-left'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                        onClick={() => setPosition('bottom-left')}
                      ></button>
                      {/* bottom-center */}
                      <button
                        type="button"
                        className={`flex items-center justify-center rounded-[6px] border text-[10px] sm:text-[11px] transition-colors ${
                          position === 'bottom-center'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                        onClick={() => setPosition('bottom-center')}
                      ></button>
                      {/* bottom-right */}
                      <button
                        type="button"
                        className={`flex items-center justify-center rounded-[6px] border text-[10px] sm:text-[11px] transition-colors ${
                          position === 'bottom-right'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                        onClick={() => setPosition('bottom-right')}
                      ></button>
                    </div>
                  </div>
                </div>
              ) : null}

              {layoutMode === 'tiled' ? (
                <div className="space-y-2">
                  <Label className="text-xs">平铺间距</Label>
                  <Slider value={[tileGap]} min={0} max={320} step={8} onValueChange={([value]) => setTileGap(value)} />
                  <p className="text-[11px] text-muted-foreground">
                    控制相邻水印之间的水平与垂直间距，数值越大间隔越疏。
                  </p>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">水印透明度</Label>
                  <Slider
                    value={[opacity]}
                    min={10}
                    max={100}
                    step={1}
                    onValueChange={([value]) => setOpacity(value)}
                  />
                </div>
                {layoutMode === 'single' ? (
                  <div className="space-y-2">
                    <Label className="text-xs">边距（与边缘的距离）</Label>
                    <Slider value={[margin]} min={0} max={200} step={4} onValueChange={([value]) => setMargin(value)} />
                  </div>
                ) : null}
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">水印旋转角度</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => setRotation(0)}
                    >
                      回正
                    </Button>
                  </div>
                  <Slider
                    value={[rotation]}
                    min={-45}
                    max={45}
                    step={1}
                    onValueChange={([value]) => setRotation(value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ImageWatermarkPage;
