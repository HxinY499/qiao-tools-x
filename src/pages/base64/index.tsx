import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CopyButton } from '@/components/copy-button';
import { FileDragUploader } from '@/components/file-drag-uploader';
import { Image as ImageComponent } from '@/components/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PasteImageDialog } from '@/pages/base64/paste-image-dialog';

function encodeTextToBase64(value: string): string {
  if (!value) return '';
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  let binary = '';
  bytes.forEach((byteValue) => {
    binary += String.fromCharCode(byteValue);
  });
  return window.btoa(binary);
}

function decodeBase64ToText(base64Value: string): string {
  if (!base64Value) return '';
  const binary = window.atob(base64Value);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

type TextMode = 'text-to-base64' | 'base64-to-text';

function Base64ToolPage() {
  const [textMode, setTextMode] = useState<TextMode>('text-to-base64');
  const [textInput, setTextInput] = useState('');
  const [textError, setTextError] = useState('');

  const [fileName, setFileName] = useState('尚未选择图片文件');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState('');
  const [stripDataUrlPrefix, setStripDataUrlPrefix] = useState(false);
  const [wrapDataUrl, setWrapDataUrl] = useState(false);
  const [dataUrlLineWidth, setDataUrlLineWidth] = useState(76);

  const encodedResult = useMemo(() => {
    if (!textInput) {
      setTextError('');
      return '';
    }

    if (textMode === 'text-to-base64') {
      setTextError('');
      return encodeTextToBase64(textInput);
    }

    let value = textInput.trim();
    const base64Marker = ';base64,';
    const markerIndex = value.indexOf(base64Marker);

    if (value.startsWith('data:') && markerIndex !== -1) {
      value = value.slice(markerIndex + base64Marker.length);
    }

    const compact = value.replace(/\s+/g, '');

    if (compact.length % 4 !== 0) {
      setTextError('Base64 串长度必须是 4 的倍数');
      return '';
    }

    if (!base64Pattern.test(compact)) {
      setTextError('当前内容看起来不是合法的 Base64 字符串');
      return '';
    }

    setTextError('');
    return decodeBase64ToText(compact);
  }, [textInput, textMode]);

  function handleTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setTextInput(event.target.value);
  }

  function processFile(file: File) {
    const fileSizeLimit = 8 * 1024 * 1024;
    if (file.size > fileSizeLimit) {
      toast.error('图片过大，请选择 8MB 以内的文件');
      return;
    }

    setFileName(`${file.name}（${(file.size / 1024).toFixed(1)} KB）`);
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        toast.error('读取图片失败，请重试或更换文件');
        setImagePreviewUrl(null);
        setDataUrl('');
        return;
      }
      setImagePreviewUrl(result);
      setDataUrl(result);
    };

    reader.onerror = () => {
      toast.error('读取图片失败，请重试或更换文件');
      setImagePreviewUrl(null);
      setDataUrl('');
    };

    reader.readAsDataURL(file);
  }

  function handleClearText() {
    setTextInput('');
    setTextError('');
  }

  function handleClearFile() {
    setImagePreviewUrl(null);
    setDataUrl('');
    setFileName('尚未选择图片文件');
  }

  function handleImageFromBase64(imageUrl: string, description: string) {
    setImagePreviewUrl(imageUrl);
    setDataUrl(imageUrl);
    setFileName(description);
  }

  const isTextToBase64 = textMode === 'text-to-base64';
  const canCopyTextResult = Boolean(encodedResult);

  const displayDataUrl = useMemo(() => {
    if (!dataUrl) return '';

    let value = dataUrl;

    if (stripDataUrlPrefix) {
      const commaIndex = value.indexOf(',');
      if (commaIndex !== -1) {
        value = value.slice(commaIndex + 1);
      }
    }

    if (wrapDataUrl) {
      const width = dataUrlLineWidth && dataUrlLineWidth > 0 ? dataUrlLineWidth : 76;
      const chunks: string[] = [];
      for (let index = 0; index < value.length; index += width) {
        chunks.push(value.slice(index, index + width));
      }
      value = chunks.join('\n');
    }

    return value;
  }, [dataUrl, stripDataUrlPrefix, wrapDataUrl, dataUrlLineWidth]);

  const canCopyDataUrl = Boolean(displayDataUrl);

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-4 lg:space-y-6">
      <Card className="shadow-sm p-4 lg:p-5">
        <Tabs defaultValue="image" className="w-full">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">Base64 编解码</h2>
            </div>
            <TabsList className="mt-2 sm:mt-0">
              <TabsTrigger value="image" className="text-xs">
                图片转 Data URL
              </TabsTrigger>
              <TabsTrigger value="text" className="text-xs">
                文本 ⇄ Base64
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="text" className="mt-4 outline-none">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs font-medium">输入区域</Label>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <button
                      type="button"
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border ${
                        isTextToBase64 ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'
                      }`}
                      onClick={() => setTextMode('text-to-base64')}
                    >
                      文本 → Base64
                    </button>
                    <button
                      type="button"
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border ${
                        !isTextToBase64 ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'
                      }`}
                      onClick={() => setTextMode('base64-to-text')}
                    >
                      Base64 → 文本
                    </button>
                  </div>
                </div>
                <Textarea
                  value={textInput}
                  onChange={handleTextChange}
                  placeholder={
                    isTextToBase64
                      ? '在此输入要编码的文本内容，支持多行和中文。'
                      : '在此粘贴要解码的 Base64 字符串，可包含换行。'
                  }
                  className="min-h-[160px] text-xs"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {isTextToBase64
                      ? '输入任意文本，右侧会实时生成 Base64。'
                      : '粘贴 Base64 字符串，右侧会尝试还原为原始文本。'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px]"
                      onClick={handleClearText}
                    >
                      清空
                    </Button>
                  </div>
                </div>
                {textError ? (
                  <p className="text-[11px] text-destructive mt-1">{textError}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    小提示：Base64 应只包含字母、数字、+、/ 和最多两个 = 结尾填充符。
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs font-medium">输出结果</Label>
                  <CopyButton
                    text={encodedResult}
                    mode="text"
                    copyText="复制结果"
                    successText="已复制"
                    variant="secondary"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    disabled={!canCopyTextResult}
                  />
                </div>
                <Textarea
                  value={encodedResult}
                  readOnly
                  placeholder={
                    isTextToBase64 ? '右侧会实时展示编码后的 Base64 字符串。' : '右侧会展示还原后的文本内容。'
                  }
                  className="min-h-[160px] text-xs bg-muted/50"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image" className="mt-4 outline-none">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs font-medium">选择或拖拽图片文件</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px]"
                    disabled={!imagePreviewUrl && !dataUrl}
                    onClick={handleClearFile}
                  >
                    清空当前图片
                  </Button>
                </div>
                <FileDragUploader
                  onFileSelect={processFile}
                  onError={(error) => toast.error(error)}
                  validation={{
                    accept: ['image/*'],
                    maxSize: 8 * 1024 * 1024,
                  }}
                  className="border-dashed bg-muted/60 px-4 py-6 sm:py-8"
                  icon="🖼️"
                  title="拖拽图片到此处，或点击选择文件"
                  hint="支持常见图片格式（PNG / JPG / JPEG / GIF 等），单张不超过 8MB。"
                  showButton={false}
                  accept="image/*"
                />
                <p className={`text-[11px] mt-1 text-muted-foreground`}>{fileName}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <PasteImageDialog onConfirm={handleImageFromBase64} />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Label className="text-xs font-medium">预览与 Data URL</Label>
                <ImageComponent
                  src={imagePreviewUrl}
                  alt="图片预览"
                  placeholder="预览"
                  canPreview
                  imgClassName="max-h-60 max-w-full object-contain"
                  className="p-3"
                />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs font-medium">Base64 Data URL</Label>
                    <CopyButton
                      text={displayDataUrl}
                      mode="text"
                      copyText="复制"
                      successText="已复制"
                      variant="secondary"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      disabled={!canCopyDataUrl}
                    />
                  </div>
                  <Textarea value={displayDataUrl} readOnly className="min-h-[140px] text-xs bg-muted/50" />
                  <div className="mt-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <Checkbox
                          checked={stripDataUrlPrefix}
                          onCheckedChange={(value) => setStripDataUrlPrefix(Boolean(value))}
                        />
                        <span>
                          移除 <code>data:...;base64,</code> 前缀
                        </span>
                      </label>
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <Checkbox checked={wrapDataUrl} onCheckedChange={(value) => setWrapDataUrl(Boolean(value))} />
                        <span>按固定长度换行</span>
                      </label>
                      {wrapDataUrl ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={16}
                            max={256}
                            value={dataUrlLineWidth}
                            onChange={(event) => {
                              const value = event.target.value;
                              const numberValue = value ? Number(value) : 0;
                              if (Number.isNaN(numberValue)) return;
                              setDataUrlLineWidth(numberValue);
                            }}
                            className="h-7 w-16 rounded-full px-2 py-1 text-[11px]"
                          />
                          <span className="text-[11px] text-muted-foreground">字符/行</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <Card className="shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">使用说明 & 提示</h2>
        <ul className="mt-3 list-disc pl-4 text-[11px] text-muted-foreground space-y-1.5">
          <li>所有编码与解码操作都在浏览器本地完成，不会上传到服务器，适合处理敏感文本或图片。</li>
          <li>文本模式适合生成 Authorization 头、简单配置片段等，编码后字符串会明显变长，请谨慎用于体积敏感场景。</li>
          <li>图片模式常用于在 CSS、HTML 或 JSON 中内联小图标、占位图等资源，大图建议仍然使用 URL 引用。</li>
          <li>若解码失败，请检查 Base64 是否被换行或中间插入了额外字符，可尝试先移除多余空白后再粘贴。</li>
          <li>
            Data URL 一般形如：<code>data:image/png;base64,......</code>，复制时可直接整段粘贴到你的样式或标签属性中。
          </li>
        </ul>
      </Card>
    </div>
  );
}

export default Base64ToolPage;
