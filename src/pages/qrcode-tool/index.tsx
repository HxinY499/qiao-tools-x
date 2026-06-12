import {
  ChevronDown,
  ChevronUp,
  Contact,
  Download,
  ImagePlus,
  ImageUp,
  MapPin,
  MessageSquare,
  QrCode,
  RotateCcw,
  Sparkles,
  Trash2,
  Type,
  Upload,
  Wifi,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ColorPicker } from '@/components/color-picker';
import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import type { QRCodeStore } from './store';
import { useQRCodeStore } from './store';
import type {
  ContactData,
  LocationData,
  QRMode,
  QRStyleConfig,
  QRTab,
  SMSData,
  WifiData,
  WifiEncryption,
} from './types';
import { downloadQRCode, generateStyledQRCode, getQRContent } from './utils';

type QRStore = QRCodeStore;

export default function QRCodeToolPage() {
  const { t } = useTranslation('tools');
  // 细粒度订阅：每个字段只在自身变化时触发重渲染
  const tab = useQRCodeStore((s) => s.tab);
  const mode = useQRCodeStore((s) => s.mode);
  const text = useQRCodeStore((s) => s.text);
  const wifi = useQRCodeStore((s) => s.wifi);
  const contact = useQRCodeStore((s) => s.contact);
  const sms = useQRCodeStore((s) => s.sms);
  const location = useQRCodeStore((s) => s.location);
  const style = useQRCodeStore((s) => s.style);
  const qrDataUrl = useQRCodeStore((s) => s.qrDataUrl);
  const parseResult = useQRCodeStore((s) => s.parseResult);
  const parseError = useQRCodeStore((s) => s.parseError);

  // Actions（zustand 的 action 引用稳定，订阅不会触发额外重渲染）
  const setTab = useQRCodeStore((s) => s.setTab);
  const setMode = useQRCodeStore((s) => s.setMode);
  const setText = useQRCodeStore((s) => s.setText);
  const setWifi = useQRCodeStore((s) => s.setWifi);
  const setContact = useQRCodeStore((s) => s.setContact);
  const setSMS = useQRCodeStore((s) => s.setSMS);
  const setLocation = useQRCodeStore((s) => s.setLocation);
  const setStyle = useQRCodeStore((s) => s.setStyle);
  const setQRDataUrl = useQRCodeStore((s) => s.setQRDataUrl);
  const setParseResult = useQRCodeStore((s) => s.setParseResult);
  const setParseError = useQRCodeStore((s) => s.setParseError);
  const resetCurrentMode = useQRCodeStore((s) => s.resetCurrentMode);
  const resetStyle = useQRCodeStore((s) => s.resetStyle);

  // zustand action 引用天然稳定，无需 useMemo 包装
  const storeActions = {
    setTab,
    setMode,
    setText,
    setWifi,
    setContact,
    setSMS,
    setLocation,
    setStyle,
    setQRDataUrl,
    setParseResult,
    setParseError,
    resetCurrentMode,
    resetStyle,
  } as QRStore;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);

  // 生成二维码
  const generateQRCode = useCallback(async () => {
    const content = getQRContent(mode, text, wifi, contact, sms, location);
    if (!content) {
      setQRDataUrl('');
      return;
    }

    try {
      const dataUrl = await generateStyledQRCode(content, style);
      setQRDataUrl(dataUrl);
    } catch {
      setQRDataUrl('');
    }
  }, [mode, text, wifi, contact, sms, location, style, setQRDataUrl]);

  // 监听内容变化自动生成二维码
  useEffect(() => {
    if (tab === 'generate') {
      generateQRCode();
    }
  }, [tab, generateQRCode]);

  // 解析二维码图片
  const parseQRCode = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setParseError(t('qrcodeTool.parseErrorCanvasCtx'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          try {
            // 动态加载 jsqr（~45KB），只在用户真正解析时下载
            const { default: jsQR } = await import('jsqr');
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              setParseResult(code.data);
            } else {
              setParseError(t('qrcodeTool.parseErrorNotRecognized'));
            }
          } catch {
            setParseError(t('qrcodeTool.parseErrorModuleLoad'));
          }
        };
        img.onerror = () => {
          setParseError(t('qrcodeTool.parseErrorImgLoad'));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        setParseError(t('qrcodeTool.parseErrorFileRead'));
      };
      reader.readAsDataURL(file);
    },
    [setParseResult, setParseError],
  );

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseQRCode(file);
    }
    e.target.value = '';
  };

  // 处理 Logo 上传
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setStyle({ logoDataUrl: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      parseQRCode(file);
    }
  };

  // 填充示例数据
  const fillSample = () => {
    switch (mode) {
      case 'text':
        setText('https://example.com');
        break;
      case 'wifi':
        setWifi({ ssid: 'MyWiFi', password: '12345678', encryption: 'WPA', hidden: false });
        break;
      case 'contact':
        setContact({
          name: t('qrcodeTool.sampleContactName'),
          phone: '13800138000',
          email: 'zhangsan@example.com',
          company: t('qrcodeTool.sampleContactCompany'),
          title: t('qrcodeTool.sampleContactTitle'),
        });
        break;
      case 'sms':
        setSMS({ phone: '10086', message: t('qrcodeTool.sampleSmsMessage') });
        break;
      case 'location':
        setLocation({ latitude: '39.9042', longitude: '116.4074', label: t('qrcodeTool.sampleLocationLabel') });
        break;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      <Card>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as QRTab)} className="w-full pt-6">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="generate" className="gap-2">
                <QrCode className="w-4 h-4" />
                {t('qrcodeTool.tabGenerate')}
              </TabsTrigger>
              <TabsTrigger value="parse" className="gap-2">
                <ImageUp className="w-4 h-4" />
                {t('qrcodeTool.tabParse')}
              </TabsTrigger>
            </TabsList>

            {tab === 'generate' ? (
              <GenerateTab
                mode={mode}
                text={text}
                wifi={wifi}
                contact={contact}
                sms={sms}
                location={location}
                style={style}
                qrDataUrl={qrDataUrl}
                store={storeActions}
                fillSample={fillSample}
                styleOpen={styleOpen}
                setStyleOpen={setStyleOpen}
                logoInputRef={logoInputRef}
                handleLogoSelect={handleLogoSelect}
                t={t}
              />
            ) : (
              <ParseTab
                parseResult={parseResult}
                parseError={parseError}
                isDragging={isDragging}
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                onClearResult={() => {
                  setParseResult('');
                  setParseError('');
                }}
                t={t}
              />
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card className="shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase mb-3">{t('qrcodeTool.usageTitle')}</h2>
        <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
          <li>
            <span className="font-medium text-foreground">{t('qrcodeTool.modeText')}</span>：{t('qrcodeTool.usageText')}
          </li>
          <li>
            <span className="font-medium text-foreground">{t('qrcodeTool.modeWifi')}</span>
            ：{t('qrcodeTool.usageWifi')}
          </li>
          <li>
            <span className="font-medium text-foreground">{t('qrcodeTool.modeContact')}</span>：{t('qrcodeTool.usageContact')}
          </li>
          <li>
            <span className="font-medium text-foreground">{t('qrcodeTool.modeSms')}</span>：{t('qrcodeTool.usageSms')}
          </li>
          <li>
            <span className="font-medium text-foreground">{t('qrcodeTool.modeLocation')}</span>：{t('qrcodeTool.usageLocation')}
          </li>
          <li>
            <span className="font-medium text-foreground">{t('qrcodeTool.usageStyleTitle')}</span>
            ：{t('qrcodeTool.usageStyle')}
          </li>
        </ul>
      </Card>
    </div>
  );
}

// 生成标签页组件
function GenerateTab({
  mode,
  text,
  wifi,
  contact,
  sms,
  location,
  style,
  qrDataUrl,
  store,
  fillSample,
  styleOpen,
  setStyleOpen,
  logoInputRef,
  handleLogoSelect,
  t,
}: {
  mode: QRMode;
  text: string;
  wifi: WifiData;
  contact: ContactData;
  sms: SMSData;
  location: LocationData;
  style: QRStyleConfig;
  qrDataUrl: string;
  store: QRStore;
  fillSample: () => void;
  styleOpen: boolean;
  setStyleOpen: (open: boolean) => void;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
  handleLogoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  t: (key: string) => string;
}) {
  const modeOptions = [
    { value: 'text' as QRMode, label: t('qrcodeTool.modeText'), icon: Type },
    { value: 'wifi' as QRMode, label: 'WiFi', icon: Wifi },
    { value: 'contact' as QRMode, label: t('qrcodeTool.modeContact'), icon: Contact },
    { value: 'sms' as QRMode, label: t('qrcodeTool.modeSms'), icon: MessageSquare },
    { value: 'location' as QRMode, label: t('qrcodeTool.modeLocation'), icon: MapPin },
  ];

  return (
    <div className="space-y-6">
      {/* 模式选择 */}
      <div className="flex flex-wrap gap-2">
        {modeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.value}
              variant={mode === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => store.setMode(option.value)}
              className="gap-1.5"
            >
              <Icon className="w-3.5 h-3.5" />
              {option.label}
            </Button>
          );
        })}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={fillSample}>
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          {t('qrcodeTool.btnSample')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => store.resetCurrentMode()}>
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          {t('qrcodeTool.btnClear')}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 输入区 */}
        <div className="space-y-4">
          {mode === 'text' && <TextInput text={text} setText={store.setText} t={t} />}
          {mode === 'wifi' && <WifiInput wifi={wifi} setWifi={store.setWifi} t={t} />}
          {mode === 'contact' && <ContactInput contact={contact} setContact={store.setContact} t={t} />}
          {mode === 'sms' && <SMSInput sms={sms} setSMS={store.setSMS} t={t} />}
          {mode === 'location' && <LocationInput location={location} setLocation={store.setLocation} t={t} />}

          {/* 样式设置折叠面板 */}
          <Collapsible open={styleOpen} onOpenChange={setStyleOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between px-3 h-9 text-muted-foreground">
                <span className="text-xs font-medium">{t('qrcodeTool.styleSettings')}</span>
                {styleOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <StylePanel
                style={style}
                setStyle={store.setStyle}
                resetStyle={store.resetStyle}
                logoInputRef={logoInputRef}
                handleLogoSelect={handleLogoSelect}
                t={t}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* 预览区 */}
        <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border border-border/50 min-h-[300px]">
          {qrDataUrl ? (
            <>
              <div className="p-4 rounded-lg shadow-sm" style={{ backgroundColor: style.background }}>
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 object-contain" />
              </div>
              <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => downloadQRCode(qrDataUrl)}>
                <Download className="w-3.5 h-3.5" />
                {t('qrcodeTool.btnDownload')}
              </Button>
            </>
          ) : (
            <div className="text-center text-muted-foreground">
              <QrCode className="w-16 h-16 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{t('qrcodeTool.previewPlaceholder')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 样式设置面板
function StylePanel({
  style,
  setStyle,
  resetStyle,
  logoInputRef,
  handleLogoSelect,
  t,
}: {
  style: QRStyleConfig;
  setStyle: (style: Partial<QRStyleConfig>) => void;
  resetStyle: () => void;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
  handleLogoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const errorLevelOptions = [
    { value: 'L', label: `L - 7% ${t('qrcodeTool.errorTolerance')}` },
    { value: 'M', label: `M - 15% ${t('qrcodeTool.errorTolerance')}` },
    { value: 'Q', label: `Q - 25% ${t('qrcodeTool.errorTolerance')}` },
    { value: 'H', label: `H - 30% ${t('qrcodeTool.errorTolerance')}` },
  ];

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-border/50">
      {/* 颜色设置 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">{t('qrcodeTool.labelForeground')}</Label>
          <ColorPicker value={style.foreground} onChange={(color) => setStyle({ foreground: color })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t('qrcodeTool.labelBackground')}</Label>
          <ColorPicker value={style.background} onChange={(color) => setStyle({ background: color })} />
        </div>
      </div>

      {/* 容错级别 */}
      <div className="space-y-2">
        <Label className="text-xs">
          {t('qrcodeTool.labelErrorLevel')} {style.logoDataUrl && <span className="text-muted-foreground">（{t('qrcodeTool.errorLevelAutoH')}）</span>}
        </Label>
        <Select
          value={style.errorCorrectionLevel}
          onValueChange={(v) => setStyle({ errorCorrectionLevel: v as QRStyleConfig['errorCorrectionLevel'] })}
          disabled={!!style.logoDataUrl}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {errorLevelOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 尺寸和边距 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">{t('qrcodeTool.labelSize', { value: style.size })}</Label>
          <Slider
            value={[style.size]}
            onValueChange={([v]) => setStyle({ size: v })}
            min={100}
            max={500}
            step={10}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t('qrcodeTool.labelMargin', { value: style.margin })}</Label>
          <Slider
            value={[style.margin]}
            onValueChange={([v]) => setStyle({ margin: v })}
            min={0}
            max={10}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Logo 上传 */}
      <div className="space-y-2">
        <Label className="text-xs">{t('qrcodeTool.labelLogo')}</Label>
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
        {style.logoDataUrl ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded border border-border overflow-hidden bg-white">
              <img src={style.logoDataUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs">{t('qrcodeTool.labelLogoSize', { value: Math.round(style.logoSizeRatio * 100) })}</Label>
              </div>
              <Slider
                value={[style.logoSizeRatio]}
                onValueChange={([v]) => setStyle({ logoSizeRatio: v })}
                min={0.1}
                max={0.3}
                step={0.02}
                className="w-full"
              />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setStyle({ logoDataUrl: '' })}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 text-xs gap-1.5"
            onClick={() => logoInputRef.current?.click()}
          >
            <ImagePlus className="w-3.5 h-3.5" />
            {t('qrcodeTool.btnUploadLogo')}
          </Button>
        )}
        <p className="text-xs text-muted-foreground">{t('qrcodeTool.logoHint')}</p>
      </div>

      {/* 重置按钮 */}
      <Button variant="ghost" size="sm" className="w-full h-8 text-xs gap-1.5" onClick={resetStyle}>
        <RotateCcw className="w-3 h-3" />
        {t('qrcodeTool.btnResetStyle')}
      </Button>
    </div>
  );
}

// 文本输入组件
function TextInput({ text, setText, t }: { text: string; setText: (v: string) => void; t: (key: string) => string }) {
  return (
    <div className="space-y-2">
      <Label>{t('qrcodeTool.labelTextContent')}</Label>
      <Textarea
        placeholder={t('qrcodeTool.placeholderText')}
        className="min-h-[200px] font-mono text-sm resize-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}

// WiFi 输入组件
function WifiInput({ wifi, setWifi, t }: { wifi: WifiData; setWifi: (v: Partial<WifiData>) => void; t: (key: string) => string }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('qrcodeTool.labelSsid')}</Label>
        <Input placeholder={t('qrcodeTool.placeholderSsid')} value={wifi.ssid} onChange={(e) => setWifi({ ssid: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>{t('qrcodeTool.labelEncryption')}</Label>
        <Select value={wifi.encryption} onValueChange={(v) => setWifi({ encryption: v as WifiEncryption })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WPA">WPA/WPA2</SelectItem>
            <SelectItem value="WEP">WEP</SelectItem>
            <SelectItem value="nopass">{t('qrcodeTool.encryptionNone')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {wifi.encryption !== 'nopass' && (
        <div className="space-y-2">
          <Label>{t('qrcodeTool.labelPassword')}</Label>
          <Input
            type="password"
            placeholder={t('qrcodeTool.placeholderPassword')}
            value={wifi.password}
            onChange={(e) => setWifi({ password: e.target.value })}
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        <Switch checked={wifi.hidden} onCheckedChange={(v) => setWifi({ hidden: v })} />
        <Label className="font-normal">{t('qrcodeTool.labelHiddenNetwork')}</Label>
      </div>
    </div>
  );
}

// 联系人输入组件
function ContactInput({
  contact,
  setContact,
  t,
}: {
  contact: ContactData;
  setContact: (v: Partial<ContactData>) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('qrcodeTool.labelName')}</Label>
        <Input placeholder={t('qrcodeTool.placeholderName')} value={contact.name} onChange={(e) => setContact({ name: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>{t('qrcodeTool.labelPhone')}</Label>
        <Input
          placeholder={t('qrcodeTool.placeholderPhone')}
          value={contact.phone}
          onChange={(e) => setContact({ phone: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('qrcodeTool.labelEmail')}</Label>
        <Input
          type="email"
          placeholder={t('qrcodeTool.placeholderEmail')}
          value={contact.email}
          onChange={(e) => setContact({ email: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('qrcodeTool.labelCompany')}</Label>
        <Input
          placeholder={t('qrcodeTool.placeholderCompany')}
          value={contact.company}
          onChange={(e) => setContact({ company: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('qrcodeTool.labelTitle')}</Label>
        <Input placeholder={t('qrcodeTool.placeholderTitle')} value={contact.title} onChange={(e) => setContact({ title: e.target.value })} />
      </div>
    </div>
  );
}

// 短信输入组件
function SMSInput({ sms, setSMS, t }: { sms: SMSData; setSMS: (v: Partial<SMSData>) => void; t: (key: string) => string }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('qrcodeTool.labelSmsRecipient')}</Label>
        <Input placeholder={t('qrcodeTool.placeholderSmsPhone')} value={sms.phone} onChange={(e) => setSMS({ phone: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>{t('qrcodeTool.labelSmsContent')}</Label>
        <Textarea
          placeholder={t('qrcodeTool.placeholderSmsMessage')}
          className="min-h-[120px] resize-none"
          value={sms.message}
          onChange={(e) => setSMS({ message: e.target.value })}
        />
      </div>
    </div>
  );
}

// 位置输入组件
function LocationInput({
  location,
  setLocation,
  t,
}: {
  location: LocationData;
  setLocation: (v: Partial<LocationData>) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('qrcodeTool.labelLatitude')}</Label>
          <Input
            placeholder={t('qrcodeTool.placeholderLatitude')}
            value={location.latitude}
            onChange={(e) => setLocation({ latitude: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('qrcodeTool.labelLongitude')}</Label>
          <Input
            placeholder={t('qrcodeTool.placeholderLongitude')}
            value={location.longitude}
            onChange={(e) => setLocation({ longitude: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t('qrcodeTool.labelLocationLabel')}</Label>
        <Input
          placeholder={t('qrcodeTool.placeholderLocationLabel')}
          value={location.label}
          onChange={(e) => setLocation({ label: e.target.value })}
        />
      </div>
      <p className="text-xs text-muted-foreground">{t('qrcodeTool.locationHint')}</p>
    </div>
  );
}

// 解析标签页组件
function ParseTab({
  parseResult,
  parseError,
  isDragging,
  fileInputRef,
  handleFileSelect,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  onClearResult,
  t,
}: {
  parseResult: string;
  parseError: string;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  onClearResult: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-6">
      {/* 上传区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground mb-2">{t('qrcodeTool.parseUploadHint')}</p>
        <p className="text-xs text-muted-foreground/70">{t('qrcodeTool.parseUploadFormats')}</p>
      </div>

      {/* 解析结果 */}
      {(parseResult || parseError) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{parseError ? t('qrcodeTool.parseFailedLabel') : t('qrcodeTool.parseResultLabel')}</Label>
            {parseResult && <CopyButton text={parseResult} className="h-6 w-6" iconClassName="w-3 h-3" />}
          </div>
          {parseError ? (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {parseError}
            </div>
          ) : (
            <div className="p-4 bg-muted/50 border rounded-lg">
              <pre className="text-sm font-mono whitespace-pre-wrap break-all">{parseResult}</pre>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={onClearResult}>
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            {t('qrcodeTool.btnClearResult')}
          </Button>
        </div>
      )}
    </div>
  );
}
