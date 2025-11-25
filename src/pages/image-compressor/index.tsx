import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

type ResizeMode = 'keep' | 'custom';
type MessageType = 'info' | 'error' | 'success';

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return '-';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function ImageCompressorPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('尚未选择图片');

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('info');

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number | null>(null);
  const [originalHeight, setOriginalHeight] = useState<number | null>(null);
  const [originalType, setOriginalType] = useState<string | null>(null);
  const [originalPlaceholder, setOriginalPlaceholder] = useState('上传后在此处显示原图预览');

  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressedWidth, setCompressedWidth] = useState<number | null>(null);
  const [compressedHeight, setCompressedHeight] = useState<number | null>(null);
  const [compressedPlaceholder, setCompressedPlaceholder] = useState('调整参数并执行压缩后显示效果');

  const [quality, setQuality] = useState(80);
  const [formatValue, setFormatValue] = useState<'auto' | 'image/jpeg' | 'image/png'>('auto');
  const [resizeMode, setResizeMode] = useState<ResizeMode>('keep');
  const [scalePercent, setScalePercent] = useState(100);
  const [customWidth, setCustomWidth] = useState<number | ''>('');
  const [customHeight, setCustomHeight] = useState<number | ''>('');
  const [lockRatio, setLockRatio] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showMessage(text: string, type: MessageType = 'info') {
    setMessage(text);
    setMessageType(type);
  }

  function resetAll() {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);

    setOriginalFile(null);
    setOriginalUrl(null);
    setOriginalSize(null);
    setOriginalWidth(null);
    setOriginalHeight(null);
    setOriginalType(null);
    setOriginalPlaceholder('上传后在此处显示原图预览');

    setCompressedBlob(null);
    setCompressedUrl(null);
    setCompressedSize(null);
    setCompressedWidth(null);
    setCompressedHeight(null);
    setCompressedPlaceholder('调整参数并执行压缩后显示效果');

    setUploadStatus('尚未选择图片');

    setQuality(80);
    setFormatValue('auto');
    setResizeMode('keep');
    setScalePercent(100);
    setCustomWidth('');
    setCustomHeight('');
    setLockRatio(true);

    setIsProcessing(false);
    showMessage('');
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    handleFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleFile(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('请选择图片文件（JPG / PNG 等）', 'error');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      showMessage('图片过大，请选择 20MB 以内的文件', 'error');
      return;
    }

    resetAll();

    setOriginalFile(file);
    setOriginalSize(file.size);
    setOriginalType(file.type);
    setUploadStatus(`已选择：${file.name}（${formatBytes(file.size)}）`);
    showMessage('正在读取图片，请稍候...');

    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : '';
      if (!url) {
        setOriginalPlaceholder('原图加载失败，请重试或更换文件');
        showMessage('图片加载失败，请尝试更换文件。', 'error');
        return;
      }
      const img = new Image();
      img.onload = () => {
        setOriginalUrl(url);
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setOriginalPlaceholder('上传后在此处显示原图预览');
        showMessage('图片加载完成，可开始调整参数并压缩。', 'success');
      };
      img.onerror = () => {
        setOriginalPlaceholder('原图加载失败，请重试或更换文件');
        showMessage('图片加载失败，请尝试更换文件。', 'error');
      };
      img.src = url;
    };
    reader.onerror = () => {
      setOriginalPlaceholder('原图加载失败，请重试或更换文件');
      showMessage('文件读取失败，请重试。', 'error');
    };

    reader.readAsDataURL(file);
  }

  function computeTargetSize() {
    if (!originalWidth || !originalHeight) return null;

    let targetW = originalWidth;
    let targetH = originalHeight;

    if (resizeMode === 'keep') {
      const clampedScale = Math.max(1, Math.min(scalePercent, 100));
      const factor = clampedScale / 100;
      targetW = Math.max(1, Math.round(originalWidth * factor));
      targetH = Math.max(1, Math.round(originalHeight * factor));
    } else {
      const cw = typeof customWidth === 'number' ? customWidth : null;
      const ch = typeof customHeight === 'number' ? customHeight : null;
      if (lockRatio) {
        if (cw) {
          targetW = cw;
          targetH = Math.max(1, Math.round((originalHeight / originalWidth) * targetW));
        } else if (ch) {
          targetH = ch;
          targetW = Math.max(1, Math.round((originalWidth / originalHeight) * targetH));
        }
      } else {
        targetW = cw || originalWidth;
        targetH = ch || originalHeight;
      }
    }

    // 不允许放大尺寸，目标尺寸最大不超过原图
    targetW = Math.min(targetW, originalWidth);
    targetH = Math.min(targetH, originalHeight);

    return { width: targetW, height: targetH };
  }

  async function compress(showProgress: boolean) {
    if (!originalUrl || !originalFile || !originalWidth || !originalHeight) return;
    if (isProcessing && showProgress) return;

    const size = computeTargetSize();
    if (!size) return;

    const noResize = size.width === originalWidth && size.height === originalHeight;

    try {
      if (showProgress) {
        setIsProcessing(true);
        showMessage('正在根据参数压缩图片，请稍候...');
      }

      // 质量 100% 且不改尺寸且保持原格式：直接使用原图，不做重新编码
      if (quality === 100 && formatValue === 'auto' && noResize) {
        setCompressedBlob(originalFile);
        setCompressedUrl(originalUrl);
        setCompressedSize(originalFile.size);
        setCompressedWidth(originalWidth);
        setCompressedHeight(originalHeight);
        setCompressedPlaceholder('调整参数并执行压缩后显示效果');

        if (showProgress) {
          setIsProcessing(false);
          showMessage('质量为 100%，已直接使用原图，未进行额外压缩。', 'info');
        }
        return;
      }

      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('image-load'));
        img.src = originalUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no-context');

      canvas.width = size.width;
      canvas.height = size.height;
      ctx.drawImage(image, 0, 0, size.width, size.height);

      let mimeType: string = formatValue;
      if (mimeType === 'auto') {
        mimeType = originalFile.type || 'image/jpeg';
      }

      const encodedBlob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (!b) reject(new Error('blob-error'));
            else resolve(b);
          },
          mimeType,
          quality / 100,
        );
      });

      // 保证不会比原图更大：如果重编码后更大，则回退到原图
      let finalBlob: Blob = encodedBlob;
      let finalWidth = size.width;
      let finalHeight = size.height;
      let useOriginalForSize = false;

      if (encodedBlob.size > originalFile.size) {
        finalBlob = originalFile;
        finalWidth = originalWidth;
        finalHeight = originalHeight;
        useOriginalForSize = true;
      }

      const previewUrl = useOriginalForSize ? originalUrl : URL.createObjectURL(finalBlob);

      if (compressedUrl && !useOriginalForSize) {
        URL.revokeObjectURL(compressedUrl);
      }

      setCompressedBlob(finalBlob);
      setCompressedUrl(previewUrl);
      setCompressedSize(finalBlob.size);
      setCompressedWidth(finalWidth);
      setCompressedHeight(finalHeight);
      setCompressedPlaceholder('调整参数并执行压缩后显示效果');

      if (originalFile.size > 0) {
        const ratio = (finalBlob.size / originalFile.size) * 100;
        const delta = 100 - ratio;
        const text = `${delta >= 0 ? '减少' : '增大'} ${Math.abs(delta).toFixed(1)}%（${ratio.toFixed(1)}% 原始体积）`;

        if (useOriginalForSize) {
          setMessage(`由于压缩后体积反而更大，已自动使用原图，确保不超过原始大小。${text}`);
        } else {
          setMessage((prev) => prev || text);
        }
      }

      if (showProgress) {
        setIsProcessing(false);
        showMessage(
          useOriginalForSize ? '压缩后体积大于原图，已自动使用原图。' : '压缩完成，可下载压缩后的图片。',
          useOriginalForSize ? 'info' : 'success',
        );
      }
    } catch (error) {
      console.error(error);
      setCompressedPlaceholder('压缩预览生成失败，请调整参数后重试');
      if (showProgress) {
        setIsProcessing(false);
      }
      showMessage('压缩过程中出现错误，请尝试降低尺寸或更换图片。', 'error');
    }
  }

  useEffect(() => {
    if (!originalUrl || !originalFile) return;
    const timer = window.setTimeout(() => {
      compress(false);
    }, 260);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, formatValue, resizeMode, scalePercent, customWidth, customHeight, lockRatio, originalUrl, originalFile]);

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

    a.href = url;
    a.download = `${baseName}-compressed${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showMessage('已触发下载，如未自动下载请检查浏览器设置。', 'success');
  }

  const canCompress = Boolean(originalFile && originalUrl && originalWidth && originalHeight);
  const canDownload = Boolean(compressedBlob);

  const compressRatioText = (() => {
    if (!originalSize || !compressedSize || originalSize <= 0) return '-';
    const ratio = (compressedSize / originalSize) * 100;
    const delta = 100 - ratio;
    return `${delta >= 0 ? '减少' : '增大'} ${Math.abs(delta).toFixed(1)}%（${ratio.toFixed(1)}% 原始体积）`;
  })();

  const isCompressedSmaller = Boolean(originalSize && compressedSize && compressedSize <= originalSize);

  const hasFile = Boolean(originalFile);

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <section className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">上传图片</h2>
        <div
          className={`relative mt-3 border border-dashed rounded-lg bg-muted/60 transition-colors cursor-pointer overflow-hidden h-4/5 flex items-center justify-center px-4 py-6 sm:py-8 ${
            isDragOver ? 'border-primary/60 bg-muted/80 shadow-sm' : 'border-border'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="relative z-10 flex flex-col items-center text-center gap-1.5">
            <div className="text-3xl mb-1">📷</div>
            <p className="text-sm font-medium">拖拽图片到此处，或</p>
            <Button
              type="button"
              className="rounded-full px-3.5 py-1.5 h-auto text-xs"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              选择图片文件
            </Button>
            <p className="mt-1 text-[11px] text-muted-foreground">支持 JPG、PNG 等常见格式，单张不超过 20MB</p>
          </div>
          <input ref={fileInputRef} id="fileInput" type="file" accept="image/*" hidden onChange={handleFileChange} />
        </div>
        <p className={`mt-2 text-xs ${hasFile ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
          {uploadStatus}
        </p>
      </section>

      <section className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">设置压缩参数</h2>
        <div className="mt-3 grid gap-3">
          <div className="rounded-lg border bg-muted/60 px-3 py-3">
            <Label className="mb-1.5 flex items-center justify-between text-xs">
              <span>压缩质量</span>
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {quality}%
              </span>
            </Label>
            <Slider value={[quality]} min={10} max={100} step={1} onValueChange={([v]) => setQuality(v)} />
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              数值越低，体积越小，但画质会降低。建议在 60% - 90% 之间调整。
            </p>
          </div>

          <div className="rounded-lg border bg-muted/60 px-3 py-3">
            <Label htmlFor="formatSelect" className="mb-1.5 block text-xs">
              输出格式
            </Label>
            <Select value={formatValue} onValueChange={(val) => setFormatValue(val as typeof formatValue)}>
              <SelectTrigger id="formatSelect" className="h-8 text-xs">
                <SelectValue placeholder="保持原格式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto" className="text-xs">
                  保持原格式
                </SelectItem>
                <SelectItem value="image/jpeg" className="text-xs">
                  JPEG（适合照片，体积小）
                </SelectItem>
                <SelectItem value="image/png" className="text-xs">
                  PNG（适合透明图）
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-muted/60 px-3 py-3">
            <Label className="mb-1.5 block text-xs">尺寸调整</Label>

            <div className="mb-2 flex items-center justify之间 gap-3">
              <div className="flex items-center gap-2 text-xs">
                <RadioGroup
                  value={resizeMode}
                  onValueChange={(val) => setResizeMode(val as ResizeMode)}
                  className="flex flex-row gap-2"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="keep" id="resize-keep" />
                    <Label htmlFor="resize-keep" className="text-xs">
                      按比例缩放
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="custom" id="resize-custom" />
                    <Label htmlFor="resize-custom" className="text-xs">
                      自定义宽高
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {resizeMode === 'keep' && (
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  <Slider
                    value={[scalePercent]}
                    min={10}
                    max={100}
                    step={1}
                    onValueChange={([v]) => {
                      setScalePercent(v);
                      if (resizeMode !== 'keep') setResizeMode('keep');
                    }}
                    className="w-32"
                  />
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[11px] font-medium">
                    缩放至 {scalePercent}%
                  </span>
                </div>
              </div>
            )}

            {resizeMode === 'custom' && (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span>宽度</span>
                    <Input
                      type="number"
                      min={1}
                      placeholder="px"
                      value={customWidth}
                      onChange={(e) => {
                        const value = e.target.value;
                        setResizeMode('custom');
                        setCustomWidth(value ? Number(value) : '');
                      }}
                      className="w-20 h-7 rounded-full px-2 py-1 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span>高度</span>
                    <Input
                      type="number"
                      min={1}
                      placeholder="px"
                      value={customHeight}
                      onChange={(e) => {
                        const value = e.target.value;
                        setResizeMode('custom');
                        setCustomHeight(value ? Number(value) : '');
                      }}
                      className="w-20 h-7 rounded-full px-2 py-1 text-xs"
                    />
                  </div>
                </div>
                <Label className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Checkbox checked={lockRatio} onCheckedChange={(v) => setLockRatio(Boolean(v))} />
                  <span>锁定原始比例</span>
                </Label>
              </div>
            )}

            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              不确定时可仅调整质量并保持原始尺寸。
            </p>
          </div>
        </div>
      </section>

      <section className="lg:col-span-2 rounded-xl border bg-card text-card-foreground shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">预览对比</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-muted/40 p-3 sm:p-4">
            <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
              <span>原始图片</span>
              {originalSize ? (
                <span className="text-[11px] text-muted-foreground">{formatBytes(originalSize)}</span>
              ) : null}
            </h3>
            <div className="relative rounded-lg border bg-background min-h-[180px] flex items-center justify-center overflow-hidden">
              {originalUrl ? (
                <img src={originalUrl} alt="原始图片预览" className="max-h-72 object-contain" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground px-4 text-center">
                  {originalPlaceholder}
                </div>
              )}
            </div>
            <ul className="mt-2 text-[11px] text-muted-foreground space-y-1">
              <li className="flex justify-between gap-2">
                <span className="opacity-80">文件大小：</span>
                <span className="font-medium text-foreground">{formatBytes(originalSize)}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="opacity-80">图片尺寸：</span>
                <span className="font-medium text-foreground">
                  {originalWidth && originalHeight ? `${originalWidth} × ${originalHeight}` : '-'}
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="opacity-80">格式类型：</span>
                <span className="font-medium text-foreground">{originalType || '-'}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 sm:p-4">
            <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
              <span>压缩后图片</span>
              {compressedSize ? (
                <span className="text-[11px] text-muted-foreground">{formatBytes(compressedSize)}</span>
              ) : null}
            </h3>
            <div className="relative rounded-lg border bg-background min-h-[180px] flex items-center justify-center overflow-hidden">
              {compressedUrl ? (
                <img src={compressedUrl} alt="压缩后图片预览" className="max-h-72 object-contain" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground px-4 text-center">
                  {compressedPlaceholder}
                </div>
              )}
              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 backdrop-blur-sm bg-background/80">
                  <div className="w-7 h-7 rounded-full border-2 border-muted border-t-primary animate-spin" />
                  <p className="text-[11px]">正在压缩图片...</p>
                </div>
              )}
            </div>
            <ul className="mt-2 text-[11px] text-muted-foreground space-y-1">
              <li className="flex justify-between gap-2">
                <span className="opacity-80">压缩后大小：</span>
                <span className="font-medium text-foreground">{formatBytes(compressedSize)}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="opacity-80">图片尺寸：</span>
                <span className="font-medium text-foreground">
                  {compressedWidth && compressedHeight ? `${compressedWidth} × ${compressedHeight}` : '-'}
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="opacity-80">压缩比例：</span>
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
      </section>

      <section className="lg:col-span-2 rounded-xl border bg-card text-card-foreground shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">操作 & 使用说明</h2>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!canCompress || isProcessing} onClick={() => compress(true)}>
              开始压缩
            </Button>
            <Button type="button" disabled={!canDownload} onClick={handleDownload} variant="secondary">
              下载压缩图片
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                resetAll();
              }}
              variant="ghost"
            >
              重新上传
            </Button>
          </div>
          <p
            className={`text-[11px] min-h-[1.25rem] ${
              messageType === 'error'
                ? 'text-destructive'
                : messageType === 'success'
                  ? 'text-emerald-600'
                  : 'text-muted-foreground'
            }`}
            role="status"
            aria-live="polite"
          >
            {message}
          </p>

          <div className="mt-2 border-t border-border pt-3">
            <h3 className="text-xs font-semibold mb-2">使用说明与注意事项</h3>
            <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-1">
              <li>本工具在浏览器本地完成压缩处理，图片不会上传到服务器，安全可靠。</li>
              <li>质量过低会导致明显失真，建议逐步调节并通过右侧预览对比效果。</li>
              <li>PNG 格式适合保留透明背景，JPEG 更适合照片类图片以减小体积。</li>
              <li>超大尺寸图片压缩可能耗时稍长，请耐心等待进度提示。</li>
              <li>建议在桌面端浏览器获得最佳体验，移动端同样支持基础操作。</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ImageCompressorPage;
