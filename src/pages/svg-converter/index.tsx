import { Download, FileImage, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ColorPicker } from '@/components/color-picker';
import { FileDragUploader } from '@/components/file-drag-uploader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return '-';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

// 预设尺寸模板
type PresetType = 'original' | 'icon' | 'web' | 'social' | 'custom';

interface PresetConfig {
  label: string;
  description: string;
  size?: number;
}

const PRESETS: Record<PresetType, PresetConfig> = {
  original: {
    label: '原始尺寸',
    description: '保持 SVG 原始宽高',
  },
  icon: {
    label: '图标尺寸',
    description: '64×64 像素，适合应用图标',
    size: 64,
  },
  web: {
    label: '网页尺寸',
    description: '512×512 像素，适合网页展示',
    size: 512,
  },
  social: {
    label: '社交媒体',
    description: '1024×1024 像素，适合头像/封面',
    size: 1024,
  },
  custom: {
    label: '自定义',
    description: '手动设置宽高',
  },
};

// SVG 文件项接口
interface SvgFileItem {
  id: string;
  file: File;
  svgContent: string;
  originalWidth: number;
  originalHeight: number;
  convertedBlob: Blob | null;
  convertedUrl: string | null;
  isConverting: boolean;
  error: string | null;
  // 独立参数（如果启用了独立调整模式）
  customWidth?: string;
  customHeight?: string;
  customFormat?: 'image/png' | 'image/jpeg' | 'image/webp';
  customQuality?: number;
  customBackgroundColor?: string;
  customUseTransparent?: boolean;
}

function SvgConverterPage() {
  const [fileItems, setFileItems] = useState<SvgFileItem[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [useIndividualParams, setUseIndividualParams] = useState(false);

  const [targetWidth, setTargetWidth] = useState<string>('');
  const [targetHeight, setTargetHeight] = useState<string>('');
  const [currentPreset, setCurrentPreset] = useState<PresetType>('original');
  const [outputFormat, setOutputFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [useTransparent, setUseTransparent] = useState(true);

  useEffect(() => {
    return () => {
      fileItems.forEach((item) => {
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetAll() {
    fileItems.forEach((item) => {
      if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    });

    setFileItems([]);
    setSelectedFileId(null);
    setUseIndividualParams(false);
    setTargetWidth('');
    setTargetHeight('');
    setCurrentPreset('original');
    setOutputFormat('image/png');
    setBackgroundColor('#ffffff');
    setUseTransparent(true);
  }

  async function parseSvgFile(file: File): Promise<{ content: string; width: number; height: number } | null> {
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');

      if (!svgElement) return null;

      let width = parseFloat(svgElement.getAttribute('width') || '0');
      let height = parseFloat(svgElement.getAttribute('height') || '0');

      if (!width || !height) {
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
          const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);
          width = vbWidth || 300;
          height = vbHeight || 300;
        } else {
          width = 300;
          height = 300;
        }
      }

      return { content: text, width, height };
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async function handleFile(file: File) {
    if (!file.type.includes('svg')) {
      toast.error('请上传 SVG 格式的文件');
      return;
    }

    const parsed = await parseSvgFile(file);
    if (!parsed) {
      toast.error(`无效的 SVG 文件: ${file.name}`);
      return;
    }

    const newItem: SvgFileItem = {
      id: `${Date.now()}-${Math.random()}`,
      file,
      svgContent: parsed.content,
      originalWidth: parsed.width,
      originalHeight: parsed.height,
      convertedBlob: null,
      convertedUrl: null,
      isConverting: false,
      error: null,
    };

    setFileItems((prev) => [...prev, newItem]);

    if (fileItems.length === 0) {
      setTargetWidth(parsed.width.toString());
      setTargetHeight(parsed.height.toString());
      setSelectedFileId(newItem.id);
    }

    toast.success(`已添加: ${file.name}`);
  }

  async function handleMultipleFiles(files: File[]) {
    const svgFiles = files.filter((f) => f.type.includes('svg'));

    if (svgFiles.length === 0) {
      toast.error('未找到 SVG 文件');
      return;
    }

    if (svgFiles.length !== files.length) {
      toast.warning(`已过滤 ${files.length - svgFiles.length} 个非 SVG 文件`);
    }

    const newItems: SvgFileItem[] = [];

    for (const file of svgFiles) {
      const parsed = await parseSvgFile(file);
      if (parsed) {
        newItems.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          svgContent: parsed.content,
          originalWidth: parsed.width,
          originalHeight: parsed.height,
          convertedBlob: null,
          convertedUrl: null,
          isConverting: false,
          error: null,
        });
      }
    }

    if (newItems.length > 0) {
      setFileItems((prev) => [...prev, ...newItems]);

      if (fileItems.length === 0 && newItems.length > 0) {
        setTargetWidth(newItems[0].originalWidth.toString());
        setTargetHeight(newItems[0].originalHeight.toString());
        setSelectedFileId(newItems[0].id);
      }

      toast.success(`成功添加 ${newItems.length} 个文件`);
    }
  }

  function removeFile(id: string) {
    setFileItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.convertedUrl) {
        URL.revokeObjectURL(item.convertedUrl);
      }
      const newItems = prev.filter((i) => i.id !== id);

      if (selectedFileId === id && newItems.length > 0) {
        setSelectedFileId(newItems[0].id);
      } else if (newItems.length === 0) {
        setSelectedFileId(null);
      }

      return newItems;
    });
  }

  function updateSelectedFileParams(updates: Partial<SvgFileItem>) {
    if (!selectedFileId || !useIndividualParams) return;

    setFileItems((prev) => prev.map((item) => (item.id === selectedFileId ? { ...item, ...updates } : item)));
  }

  function getFileParams(item: SvgFileItem) {
    if (useIndividualParams) {
      const width =
        item.customWidth && item.customWidth.trim().length > 0 ? item.customWidth : item.originalWidth.toString();
      const height =
        item.customHeight && item.customHeight.trim().length > 0 ? item.customHeight : item.originalHeight.toString();

      return {
        width,
        height,
        format: item.customFormat ?? outputFormat,
        backgroundColor: item.customBackgroundColor ?? backgroundColor,
        useTransparent: item.customUseTransparent ?? useTransparent,
      };
    }

    return {
      width: targetWidth,
      height: targetHeight,
      format: outputFormat,
      backgroundColor,
      useTransparent,
    };
  }

  function applyPreset(preset: PresetType) {
    setCurrentPreset(preset);
    const config = PRESETS[preset];

    // 独立参数模式：预设尺寸只应用到当前选中文件
    if (useIndividualParams && selectedFileId) {
      setFileItems((prev) =>
        prev.map((item) => {
          if (item.id !== selectedFileId) return item;

          if (preset === 'original') {
            return {
              ...item,
              customWidth: item.originalWidth.toString(),
              customHeight: item.originalHeight.toString(),
            };
          }

          if (config.size) {
            const size = config.size.toString();
            return {
              ...item,
              customWidth: size,
              customHeight: size,
            };
          }

          return item;
        }),
      );
      return;
    }

    // 统一参数模式：预设尺寸应用到全局宽高
    if (preset === 'original' && fileItems.length > 0) {
      const firstItem = fileItems[0];
      setTargetWidth(firstItem.originalWidth.toString());
      setTargetHeight(firstItem.originalHeight.toString());
    } else if (config.size) {
      setTargetWidth(config.size.toString());
      setTargetHeight(config.size.toString());
    }
  }

  function handleWidthChange(value: string) {
    if (useIndividualParams && selectedFileId) {
      updateSelectedFileParams({ customWidth: value });
    } else {
      setTargetWidth(value);
    }
    setCurrentPreset('custom');
  }

  function handleHeightChange(value: string) {
    if (useIndividualParams && selectedFileId) {
      updateSelectedFileParams({ customHeight: value });
    } else {
      setTargetHeight(value);
    }
    setCurrentPreset('custom');
  }

  function handleFormatChange(format: 'image/png' | 'image/jpeg' | 'image/webp') {
    if (useIndividualParams && selectedFileId) {
      updateSelectedFileParams({ customFormat: format });
    } else {
      setOutputFormat(format);
    }
  }

  function handleBackgroundColorChange(color: string) {
    if (useIndividualParams && selectedFileId) {
      updateSelectedFileParams({ customBackgroundColor: color });
    } else {
      setBackgroundColor(color);
    }
  }

  function handleTransparentToggle() {
    if (useIndividualParams && selectedFileId) {
      const selectedFile = fileItems.find((f) => f.id === selectedFileId);
      const currentTransparent = selectedFile?.customUseTransparent ?? useTransparent;
      updateSelectedFileParams({ customUseTransparent: !currentTransparent });
    } else {
      setUseTransparent(!useTransparent);
    }
  }

  async function convertSingleItem(item: SvgFileItem): Promise<Blob | null> {
    const params = getFileParams(item);
    const finalWidth = parseInt(params.width) || item.originalWidth;
    const finalHeight = parseInt(params.height) || item.originalHeight;

    if (finalWidth <= 0 || finalHeight <= 0) {
      throw new Error('图片尺寸无效');
    }

    const img = new Image();
    const svgBlob = new Blob([item.svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('SVG 加载失败'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      URL.revokeObjectURL(url);
      throw new Error('Canvas 上下文创建失败');
    }

    if (!params.useTransparent || params.format === 'image/jpeg') {
      ctx.fillStyle = params.backgroundColor;
      ctx.fillRect(0, 0, finalWidth, finalHeight);
    }

    ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (!b) reject(new Error('Blob 生成失败'));
        else resolve(b);
      }, params.format);
    });

    URL.revokeObjectURL(url);
    return blob;
  }

  async function convertAllFiles() {
    if (fileItems.length === 0) return;

    setFileItems((prev) =>
      prev.map((item) => ({
        ...item,
        isConverting: true,
        error: null,
      })),
    );

    for (const item of fileItems) {
      try {
        const blob = await convertSingleItem(item);
        if (!blob) continue;
        const previewUrl = URL.createObjectURL(blob);

        setFileItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  convertedBlob: blob,
                  convertedUrl: previewUrl,
                  isConverting: false,
                  error: null,
                }
              : it,
          ),
        );
      } catch (error) {
        console.error(error);
        setFileItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  isConverting: false,
                  error: error instanceof Error ? error.message : '转换失败',
                }
              : it,
          ),
        );
      }
    }
  }

  // 使用序列化的参数作为依赖，避免无限循环
  const paramsKey = JSON.stringify({
    count: fileItems.length,
    unified: useIndividualParams ? null : { targetWidth, targetHeight, outputFormat, backgroundColor, useTransparent },
    individual: useIndividualParams
      ? fileItems.map((f) => ({
          id: f.id,
          customWidth: f.customWidth,
          customHeight: f.customHeight,
          customFormat: f.customFormat,
          customQuality: f.customQuality,
          customBackgroundColor: f.customBackgroundColor,
          customUseTransparent: f.customUseTransparent,
        }))
      : null,
  });

  useEffect(() => {
    if (fileItems.length === 0) return;

    const timer = window.setTimeout(() => {
      convertAllFiles();
    }, 300);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  function downloadFile(item: SvgFileItem) {
    if (!item.convertedBlob) return;

    const params = getFileParams(item);
    const url = URL.createObjectURL(item.convertedBlob);
    const a = document.createElement('a');
    const originalName = item.file.name || 'image';
    const dotIndex = originalName.lastIndexOf('.');
    const baseName = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;

    let ext = '.png';
    if (params.format === 'image/jpeg') ext = '.jpg';
    else if (params.format === 'image/webp') ext = '.webp';

    a.href = url;
    a.download = `${baseName}${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadAllFiles() {
    const convertedItems = fileItems.filter((item) => item.convertedBlob);
    if (convertedItems.length === 0) {
      toast.error('没有可下载的文件');
      return;
    }

    convertedItems.forEach((item, index) => {
      setTimeout(() => {
        downloadFile(item);
      }, index * 200);
    });

    toast.success(`开始下载 ${convertedItems.length} 个文件`);
  }

  const hasConvertedFiles = fileItems.some((item) => item.convertedBlob);
  const totalOriginalSize = fileItems.reduce((sum, item) => sum + item.file.size, 0);
  const totalConvertedSize = fileItems.reduce((sum, item) => sum + (item.convertedBlob?.size || 0), 0);

  const selectedFile = fileItems.find((f) => f.id === selectedFileId) || null;

  // 计算当前显示的参数（根据是否启用独立参数模式）
  const displayParams = (() => {
    if (!useIndividualParams || !selectedFile) {
      return {
        width: targetWidth,
        height: targetHeight,
        format: outputFormat,
        backgroundColor,
        useTransparent,
      };
    }

    return {
      width:
        selectedFile.customWidth && selectedFile.customWidth.trim().length > 0
          ? selectedFile.customWidth
          : selectedFile.originalWidth.toString(),
      height:
        selectedFile.customHeight && selectedFile.customHeight.trim().length > 0
          ? selectedFile.customHeight
          : selectedFile.originalHeight.toString(),
      format: selectedFile.customFormat ?? outputFormat,
      backgroundColor: selectedFile.customBackgroundColor ?? backgroundColor,
      useTransparent: selectedFile.customUseTransparent ?? useTransparent,
    };
  })();

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-4 lg:space-y-6">
      {/* 上传区域 */}
      <Card className="shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">上传 SVG</h2>
        <FileDragUploader
          onFileSelect={handleFile}
          onFilesSelect={handleMultipleFiles}
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
        <Card className="shadow-sm p-4 lg:p-5 flex-1">
          {fileItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  已添加 {fileItems.length} 个文件 {selectedFile && `（当前：${selectedFile.file.name}）`}
                </span>
                <Button type="button" variant="secondary" size="sm" className="h-6 px-2 text-[10px]" onClick={resetAll}>
                  清空列表
                </Button>
              </div>
              <div className="max-h-[200px] overflow-y-auto space-y-1.5 rounded-lg border bg-muted/30 p-2">
                {fileItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs border cursor-pointer transition-colors ${
                      selectedFileId === item.id ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedFileId(item.id)}
                  >
                    <FileImage className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate font-medium">{item.file.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatBytes(item.file.size)}</span>
                    {item.isConverting && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 animate-pulse shrink-0">
                        转换中...
                      </span>
                    )}
                    {item.error && (
                      <div className="text-[10px] !text-red-600 dark:!text-red-400 shrink-0" title={item.error}>
                        失败
                      </div>
                    )}
                    {item.convertedBlob && !item.isConverting && !item.error && (
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
                        removeFile(item.id);
                      }}
                      title="移除"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
        {/* 转换参数 */}
        <Card className="shadow-sm p-4 lg:p-5 flex-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">转换参数</h2>
            {fileItems.length > 1 && (
              <Button
                type="button"
                variant={useIndividualParams ? 'default' : 'secondary'}
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => {
                  const newMode = !useIndividualParams;
                  setUseIndividualParams(newMode);

                  if (newMode && fileItems.length > 0) {
                    const normalizedTargetWidth = targetWidth.trim();
                    const normalizedTargetHeight = targetHeight.trim();

                    setFileItems((prev) =>
                      prev.map((item) => ({
                        ...item,
                        customWidth: item.customWidth ?? (normalizedTargetWidth || item.originalWidth.toString()),
                        customHeight: item.customHeight ?? (normalizedTargetHeight || item.originalHeight.toString()),
                        customFormat: item.customFormat ?? outputFormat,
                        customBackgroundColor: item.customBackgroundColor ?? backgroundColor,
                        customUseTransparent: item.customUseTransparent ?? useTransparent,
                      })),
                    );
                  }
                }}
              >
                {useIndividualParams ? '✓ 独立参数' : '统一参数'}
              </Button>
            )}
          </div>
          {useIndividualParams && (
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
                onValueChange={(val) => val && applyPreset(val as PresetType)}
                className="grid grid-cols-2 gap-1.5"
              >
                <ToggleGroupItem
                  value="original"
                  className="text-xs h-auto py-1.5 px-2 flex flex-col items-start gap-0.5"
                >
                  <span className="font-medium">原始尺寸</span>
                  <span className="text-[10px] text-muted-foreground">保持原始</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="icon" className="text-xs h-auto py-1.5 px-2 flex flex-col items-start gap-0.5">
                  <span className="font-medium">图标</span>
                  <span className="text-[10px] text-muted-foreground">64×64</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="web" className="text-xs h-auto py-1.5 px-2 flex flex-col items-start gap-0.5">
                  <span className="font-medium">网页</span>
                  <span className="text-[10px] text-muted-foreground">512×512</span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="social"
                  className="text-xs h-auto py-1.5 px-2 flex flex-col items-start gap-0.5"
                >
                  <span className="font-medium">社交媒体</span>
                  <span className="text-[10px] text-muted-foreground">1024×1024</span>
                </ToggleGroupItem>
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
                    value={displayParams.width}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    className="h-8 text-xs"
                    disabled={fileItems.length === 0}
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
                    value={displayParams.height}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    className="h-8 text-xs"
                    disabled={fileItems.length === 0}
                  />
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                {selectedFile
                  ? `原始尺寸：${selectedFile.originalWidth} × ${selectedFile.originalHeight}`
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
                onValueChange={(val) => handleFormatChange(val as typeof outputFormat)}
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
                    onClick={handleTransparentToggle}
                  >
                    {displayParams.useTransparent ? '✓ 透明背景' : '透明背景'}
                  </Button>
                </Label>
                {!displayParams.useTransparent && (
                  <div className="mt-2">
                    <ColorPicker value={displayParams.backgroundColor} onChange={handleBackgroundColorChange} />
                  </div>
                )}
              </div>
            )}

            {displayParams.format === 'image/jpeg' && (
              <div className="rounded-lg border bg-muted/60 px-3 py-3">
                <Label className="mb-1.5 block text-xs">背景色（JPEG 不支持透明）</Label>
                <ColorPicker value={displayParams.backgroundColor} onChange={handleBackgroundColorChange} />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 预览对比 */}
      {selectedFile && (
        <Card className="shadow-sm p-4 lg:p-5">
          <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
            预览对比{' '}
            {fileItems.length > 1 &&
              `（${fileItems.findIndex((f) => f.id === selectedFileId) + 1}/${fileItems.length}）`}
          </h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {/* 原始 SVG */}
            <div className="rounded-lg border bg-muted/40 p-3 sm:p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
                <span>原始 SVG</span>
                <span className="text-[11px] text-muted-foreground">{formatBytes(selectedFile.file.size)}</span>
              </h3>
              <div className="rounded-lg border bg-background p-4 flex items-center justify-center min-h-[200px]">
                <div
                  dangerouslySetInnerHTML={{ __html: selectedFile.svgContent }}
                  className="max-w-full max-h-[300px]"
                />
              </div>
              <ul className="mt-2 text-[11px] text-muted-foreground space-y-1">
                <li className="flex justify-between gap-2">
                  <span className="opacity-80">文件大小：</span>
                  <span className="font-medium text-foreground">{formatBytes(selectedFile.file.size)}</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="opacity-80">原始尺寸：</span>
                  <span className="font-medium text-foreground">
                    {selectedFile.originalWidth} × {selectedFile.originalHeight}
                  </span>
                </li>
              </ul>
            </div>

            {/* 转换后图片 */}
            <div className="rounded-lg border bg-muted/40 p-3 sm:p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
                <span>转换后图片</span>
                {selectedFile.isConverting ? (
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 animate-pulse">正在转换...</span>
                ) : selectedFile.convertedBlob ? (
                  <span className="text-[11px] text-muted-foreground">
                    {formatBytes(selectedFile.convertedBlob.size)}
                  </span>
                ) : null}
              </h3>
              <div className="rounded-lg border bg-background p-4 flex items-center justify-center min-h-[200px]">
                {selectedFile.convertedUrl ? (
                  <img
                    src={selectedFile.convertedUrl}
                    alt="转换后预览"
                    className="max-w-full max-h-[300px] object-contain"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">正在转换...</span>
                )}
              </div>
              <ul className="mt-2 text-[11px] text-muted-foreground space-y-1">
                <li className="flex justify-between gap-2">
                  <span className="opacity-80">文件大小：</span>
                  <span className="font-medium text-foreground">{formatBytes(selectedFile.convertedBlob?.size)}</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="opacity-80">导出尺寸：</span>
                  <span className="font-medium text-foreground">
                    {displayParams.width && displayParams.height
                      ? `${displayParams.width} × ${displayParams.height}`
                      : '-'}
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
              批量下载（{fileItems.filter((i) => i.convertedBlob).length} 个文件）
            </Button>
            <Button type="button" disabled={fileItems.length === 0} onClick={() => convertAllFiles()} variant="outline">
              <RefreshCw className="w-3 h-3 mr-1" />
              重新转换
            </Button>
            <Button type="button" onClick={resetAll} variant="outline">
              清空并重新上传
            </Button>
          </div>

          {/* 统计信息 */}
          {fileItems.length > 0 && (
            <div className="rounded-lg border bg-muted/40 px-3 py-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">总文件数：</span>
                  <span className="font-medium">{fileItems.length} 个</span>
                </div>
                <div>
                  <span className="text-muted-foreground">原始总大小：</span>
                  <span className="font-medium">{formatBytes(totalOriginalSize)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">已转换：</span>
                  <span className="font-medium">{fileItems.filter((i) => i.convertedBlob).length} 个</span>
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
