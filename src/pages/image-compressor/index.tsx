import { Image as ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { FileDragUploader } from '@/components/file-drag-uploader';
import { Image as ImageComponent } from '@/components/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return '-';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

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

function ImageCompressorPage() {
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

  const [formatValue, setFormatValue] = useState<'auto' | 'image/jpeg' | 'image/png' | 'image/webp'>('auto');

  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState(80);

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    setQuality(80);
    setFormatValue('auto');

    setIsProcessing(false);
  }

  function handleFile(file: File) {
    if (file.size > 20 * 1024 * 1024) {
      toast.error('图片过大，请选择 20MB 以内的文件');
      return;
    }

    resetAll();

    setOriginalFile(file);
    setOriginalSize(file.size);
    setOriginalType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : '';
      if (!url) {
        setOriginalPlaceholder('原图加载失败，请重试或更换文件');
        toast.error('图片加载失败，请尝试更换文件。');
        return;
      }
      const img = new Image();
      img.onload = async () => {
        setOriginalUrl(url);
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setOriginalPlaceholder('上传后在此处显示原图预览');

        // PNG 智能提示逻辑
        if (file.type === 'image/png') {
          const hasAlpha = await checkImageHasAlpha(url);
          if (hasAlpha) {
            toast.warning('你上传的是 PNG 图片，并且检测到透明背景，建议保持 PNG 格式或选择 WebP 以减小体积', {
              duration: 5000,
            });
          } else {
            toast.info('你上传的是 PNG 图片，但未检测到透明背景，建议切换为 JPEG 或 WebP 格式以大幅减小体积', {
              duration: 5000,
            });
          }
        }
      };
      img.onerror = () => {
        setOriginalPlaceholder('原图加载失败，请重试或更换文件');
        toast.error('图片加载失败，请尝试更换文件。');
      };
      img.src = url;
    };
    reader.onerror = () => {
      setOriginalPlaceholder('原图加载失败，请重试或更换文件');
      toast.error('文件读取失败，请重试。');
    };

    reader.readAsDataURL(file);
  }

  async function compress(showProgress: boolean) {
    if (!originalUrl || !originalFile || !originalWidth || !originalHeight) return;
    if (isProcessing && showProgress) return;

    const targetWidth = originalWidth;
    const targetHeight = originalHeight;

    try {
      if (showProgress) {
        setIsProcessing(true);
      }

      // 质量 100% 且保持原格式：直接使用原图，不做重新编码
      if (quality === 100 && formatValue === 'auto') {
        setCompressedBlob(originalFile);
        setCompressedUrl(originalUrl);
        setCompressedSize(originalFile.size);
        setCompressedWidth(originalWidth);
        setCompressedHeight(originalHeight);
        setCompressedPlaceholder('调整参数并执行压缩后显示效果');

        if (showProgress) {
          setIsProcessing(false);
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

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

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
      let finalWidth = targetWidth;
      let finalHeight = targetHeight;
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

      if (showProgress) {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error(error);
      setCompressedPlaceholder('压缩预览生成失败，请调整参数后重试');
      if (showProgress) {
        setIsProcessing(false);
      }
      toast.error('压缩过程中出现错误，请尝试降低尺寸或更换图片。');
    }
  }

  useEffect(() => {
    if (!originalUrl || !originalFile) return;
    const timer = window.setTimeout(() => {
      compress(false);
    }, 260);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, formatValue, originalUrl, originalFile]);

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

  const canCompress = Boolean(originalFile && originalUrl && originalWidth && originalHeight);
  const canDownload = Boolean(compressedBlob);

  const compressRatioText = (() => {
    if (!originalSize || !compressedSize || originalSize <= 0) return '-';
    const ratio = (compressedSize / originalSize) * 100;
    const delta = 100 - ratio;
    return `${delta >= 0 ? '减少' : '增大'} ${Math.abs(delta).toFixed(1)}%（${ratio.toFixed(1)}% 原始体积）`;
  })();

  const isCompressedSmaller = Boolean(originalSize && compressedSize && compressedSize <= originalSize);

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <Card className="shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">上传图片</h2>
        <FileDragUploader
          onFileSelect={handleFile}
          onError={(error) => toast.error(error)}
          validation={{
            accept: ['image/*'],
            maxSize: 20 * 1024 * 1024,
          }}
          className="mt-3 bg-muted/60 overflow-hidden h-4/5"
          icon={<ImageIcon />}
          title="拖拽图片到此处，或"
          buttonText="选择图片文件"
          hint="支持 JPG、PNG 等常见格式，单张不超过 20MB"
          accept="image/*"
        />
      </Card>

      <Card className="shadow-sm p-4 lg:p-5">
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
            <Slider
              value={[quality]}
              min={10}
              max={100}
              step={1}
              onValueChange={([v]) => setQuality(v)}
              disabled={formatValue === 'image/png' || (formatValue === 'auto' && originalType === 'image/png')}
            />
            {formatValue === 'image/png' || (formatValue === 'auto' && originalType === 'image/png') ? (
              <p className="mt-1.5 text-[11px] leading-relaxed text-red-600 dark:text-red-400 font-medium">
                ⚠️ PNG 格式为无损压缩，不支持质量调节。请切换为 JPEG 或 WebP 格式。
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                数值越低，体积越小，但画质会降低。建议在 60% - 90% 之间调整。
              </p>
            )}
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
                  PNG（无损压缩，不支持质量调节）
                </SelectItem>
                <SelectItem value="image/webp" className="text-xs">
                  WebP（体积最小，支持透明）
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-2 shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">预览对比</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-muted/40 p-3 sm:p-4">
            <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
              <span>原始图片</span>
              {originalSize ? (
                <span className="text-[11px] text-muted-foreground">{formatBytes(originalSize)}</span>
              ) : null}
            </h3>
            <ImageComponent src={originalUrl} alt="原始图片预览" placeholder={originalPlaceholder} />
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
            <ImageComponent src={compressedUrl} alt="压缩后图片预览" placeholder={compressedPlaceholder} canPreview />
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
      </Card>

      <Card className="lg:col-span-2 shadow-sm p-4 lg:p-5">
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
                // We just need to reset the state, the uploader component handles its own input reset
                resetAll();
              }}
              variant="ghost"
            >
              重新上传
            </Button>
          </div>

          <div className="mt-2 border-t border-border pt-3">
            <h3 className="text-xs font-semibold mb-2">使用说明与注意事项</h3>
            <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-1">
              <li>本工具在浏览器本地完成压缩处理，图片不会上传到服务器，安全可靠。</li>
              <li>质量过低会导致明显失真，建议逐步调节并通过右侧预览对比效果。</li>
              <li>PNG 格式适合保留透明背景但不支持质量调节，JPEG 更适合照片类图片，WebP 兼顾两者优势。</li>
              <li>超大尺寸图片压缩可能耗时稍长，请耐心等待进度提示。</li>
              <li>建议在桌面端浏览器获得最佳体验，移动端同样支持基础操作。</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ImageCompressorPage;
