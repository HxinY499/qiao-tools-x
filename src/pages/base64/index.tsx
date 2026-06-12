import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('tools');
  const [textMode, setTextMode] = useState<TextMode>('text-to-base64');
  const [textInput, setTextInput] = useState('');

  const [fileName, setFileName] = useState(() => t('base64.noFileSelected'));
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState('');
  const [stripDataUrlPrefix, setStripDataUrlPrefix] = useState(false);
  const [wrapDataUrl, setWrapDataUrl] = useState(false);
  const [dataUrlLineWidth, setDataUrlLineWidth] = useState(76);

  const { result: encodedResult, error: textError } = useMemo<{ result: string; error: string }>(() => {
    if (!textInput) return { result: '', error: '' };

    if (textMode === 'text-to-base64') {
      return { result: encodeTextToBase64(textInput), error: '' };
    }

    let value = textInput.trim();
    const base64Marker = ';base64,';
    const markerIndex = value.indexOf(base64Marker);

    if (value.startsWith('data:') && markerIndex !== -1) {
      value = value.slice(markerIndex + base64Marker.length);
    }

    const compact = value.replace(/\s+/g, '');

    if (compact.length % 4 !== 0) {
      return { result: '', error: t('base64.errorLengthMultiple') };
    }

    if (!base64Pattern.test(compact)) {
      return { result: '', error: t('base64.errorInvalidBase64') };
    }

    try {
      return { result: decodeBase64ToText(compact), error: '' };
    } catch {
      return { result: '', error: t('base64.errorDecodeFailed') };
    }
  }, [textInput, textMode, t]);

  function handleTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setTextInput(event.target.value);
  }

  function processFile(file: File) {
    const fileSizeLimit = 8 * 1024 * 1024;
    if (file.size > fileSizeLimit) {
      toast.error(t('base64.toastFileTooLarge'));
      return;
    }

    setFileName(`${file.name}（${(file.size / 1024).toFixed(1)} KB）`);
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        toast.error(t('base64.toastReadFailed'));
        setImagePreviewUrl(null);
        setDataUrl('');
        return;
      }
      setImagePreviewUrl(result);
      setDataUrl(result);
    };

    reader.onerror = () => {
      toast.error(t('base64.toastReadFailed'));
      setImagePreviewUrl(null);
      setDataUrl('');
    };

    reader.readAsDataURL(file);
  }

  function handleClearText() {
    setTextInput('');
  }

  function handleClearFile() {
    setImagePreviewUrl(null);
    setDataUrl('');
    setFileName(t('base64.noFileSelected'));
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
              <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">{t('base64.sectionTitle')}</h2>
            </div>
            <TabsList className="mt-2 sm:mt-0">
              <TabsTrigger value="image" className="text-xs">
                {t('base64.tabImage')}
              </TabsTrigger>
              <TabsTrigger value="text" className="text-xs">
                {t('base64.tabText')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="text" className="mt-4 outline-none">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs font-medium">{t('base64.labelInput')}</Label>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <button
                      type="button"
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border ${
                        isTextToBase64 ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'
                      }`}
                      onClick={() => setTextMode('text-to-base64')}
                    >
                      {t('base64.modeTextToBase64')}
                    </button>
                    <button
                      type="button"
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border ${
                        !isTextToBase64 ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'
                      }`}
                      onClick={() => setTextMode('base64-to-text')}
                    >
                      {t('base64.modeBase64ToText')}
                    </button>
                  </div>
                </div>
                <Textarea
                  value={textInput}
                  onChange={handleTextChange}
                  placeholder={
                    isTextToBase64
                      ? t('base64.placeholderEncodeInput')
                      : t('base64.placeholderDecodeInput')
                  }
                  className="min-h-[160px] text-xs"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {isTextToBase64
                      ? t('base64.hintEncode')
                      : t('base64.hintDecode')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px]"
                      onClick={handleClearText}
                    >
                      {t('base64.btnClear')}
                    </Button>
                  </div>
                </div>
                {textError ? (
                  <p className="text-[11px] text-destructive mt-1">{textError}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {t('base64.tipBase64Chars')}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs font-medium">{t('base64.labelOutput')}</Label>
                  <CopyButton
                    text={encodedResult}
                    mode="text"
                    copyText={t('base64.btnCopyResult')}
                    successText={t('base64.btnCopied')}
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
                    isTextToBase64 ? t('base64.placeholderEncodeOutput') : t('base64.placeholderDecodeOutput')
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
                  <Label className="text-xs font-medium">{t('base64.labelSelectImage')}</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px]"
                    disabled={!imagePreviewUrl && !dataUrl}
                    onClick={handleClearFile}
                  >
                    {t('base64.btnClearImage')}
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
                  title={t('base64.uploaderTitle')}
                  hint={t('base64.uploaderHint')}
                  showButton={false}
                  accept="image/*"
                />
                <p className={`text-[11px] mt-1 text-muted-foreground`}>{fileName}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <PasteImageDialog onConfirm={handleImageFromBase64} />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Label className="text-xs font-medium">{t('base64.labelPreview')}</Label>
                <ImageComponent
                  src={imagePreviewUrl}
                  alt={t('base64.imageAlt')}
                  placeholder={t('base64.imagePlaceholder')}
                  canPreview
                  imgClassName="max-h-60 max-w-full object-contain"
                  className="p-3"
                />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs font-medium">{t('base64.labelDataUrl')}</Label>
                    <CopyButton
                      text={displayDataUrl}
                      mode="text"
                      copyText={t('base64.btnCopy')}
                      successText={t('base64.btnCopied')}
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
                          {t('base64.checkboxStripPrefix')} <code>data:...;base64,</code> {t('base64.checkboxStripSuffix')}
                        </span>
                      </label>
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <Checkbox checked={wrapDataUrl} onCheckedChange={(value) => setWrapDataUrl(Boolean(value))} />
                        <span>{t('base64.checkboxWrap')}</span>
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
                          <span className="text-[11px] text-muted-foreground">{t('base64.charsPerLine')}</span>
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
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">{t('base64.usageTitle')}</h2>
        <ul className="mt-3 list-disc pl-4 text-[11px] text-muted-foreground space-y-1.5">
          <li>{t('base64.usageTip1')}</li>
          <li>{t('base64.usageTip2')}</li>
          <li>{t('base64.usageTip3')}</li>
          <li>{t('base64.usageTip4')}</li>
          <li>
            {t('base64.usageTip5Pre')}<code>data:image/png;base64,......</code>{t('base64.usageTip5Post')}
          </li>
        </ul>
      </Card>
    </div>
  );
}

export default Base64ToolPage;
