import jsQR from 'jsqr';
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

const MODE_OPTIONS: { value: QRMode; label: string; icon: typeof Type }[] = [
  { value: 'text', label: '自由文本', icon: Type },
  { value: 'wifi', label: 'WiFi', icon: Wifi },
  { value: 'contact', label: '联系人', icon: Contact },
  { value: 'sms', label: '短信', icon: MessageSquare },
  { value: 'location', label: '位置', icon: MapPin },
];

const ERROR_LEVEL_OPTIONS = [
  { value: 'L', label: 'L - 7% 容错' },
  { value: 'M', label: 'M - 15% 容错' },
  { value: 'Q', label: 'Q - 25% 容错' },
  { value: 'H', label: 'H - 30% 容错' },
];

type QRStore = QRCodeStore;

export default function QRCodeToolPage() {
  const store = useQRCodeStore();
  const { tab, mode, text, wifi, contact, sms, location, style, qrDataUrl, parseResult, parseError } = store;
  const { setQRDataUrl, setParseResult, setParseError, setStyle } = store;
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
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setParseError('无法创建画布上下文');
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            setParseResult(code.data);
          } else {
            setParseError('未能识别二维码，请确保图片清晰且包含有效的二维码');
          }
        };
        img.onerror = () => {
          setParseError('图片加载失败');
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        setParseError('文件读取失败');
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
        store.setText('https://example.com');
        break;
      case 'wifi':
        store.setWifi({ ssid: 'MyWiFi', password: '12345678', encryption: 'WPA', hidden: false });
        break;
      case 'contact':
        store.setContact({
          name: '张三',
          phone: '13800138000',
          email: 'zhangsan@example.com',
          company: '示例公司',
          title: '产品经理',
        });
        break;
      case 'sms':
        store.setSMS({ phone: '10086', message: '查询话费余额' });
        break;
      case 'location':
        store.setLocation({ latitude: '39.9042', longitude: '116.4074', label: '北京天安门' });
        break;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      <Card>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => store.setTab(v as QRTab)} className="w-full pt-6">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="generate" className="gap-2">
                <QrCode className="w-4 h-4" />
                生成二维码
              </TabsTrigger>
              <TabsTrigger value="parse" className="gap-2">
                <ImageUp className="w-4 h-4" />
                解析二维码
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
                store={store}
                fillSample={fillSample}
                styleOpen={styleOpen}
                setStyleOpen={setStyleOpen}
                logoInputRef={logoInputRef}
                handleLogoSelect={handleLogoSelect}
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
              />
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card className="shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase mb-3">使用说明</h2>
        <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
          <li>
            <span className="font-medium text-foreground">自由文本</span>：输入任意文本或网址，生成对应的二维码。
          </li>
          <li>
            <span className="font-medium text-foreground">WiFi</span>
            ：填写网络名称、密码和加密类型，扫码即可快速连接 WiFi。
          </li>
          <li>
            <span className="font-medium text-foreground">联系人</span>：生成 vCard 格式二维码，扫码可直接添加联系人。
          </li>
          <li>
            <span className="font-medium text-foreground">短信</span>：填写收件人和内容，扫码可快速发送短信。
          </li>
          <li>
            <span className="font-medium text-foreground">位置</span>：输入经纬度坐标，扫码可在地图应用中打开位置。
          </li>
          <li>
            <span className="font-medium text-foreground">样式设置</span>
            ：可自定义二维码颜色、尺寸、边距，还可上传品牌 Logo 放置在二维码中心。
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
}) {
  return (
    <div className="space-y-6">
      {/* 模式选择 */}
      <div className="flex flex-wrap gap-2">
        {MODE_OPTIONS.map((option) => {
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
          示例
        </Button>
        <Button variant="outline" size="sm" onClick={() => store.resetCurrentMode()}>
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          清空
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 输入区 */}
        <div className="space-y-4">
          {mode === 'text' && <TextInput text={text} setText={store.setText} />}
          {mode === 'wifi' && <WifiInput wifi={wifi} setWifi={store.setWifi} />}
          {mode === 'contact' && <ContactInput contact={contact} setContact={store.setContact} />}
          {mode === 'sms' && <SMSInput sms={sms} setSMS={store.setSMS} />}
          {mode === 'location' && <LocationInput location={location} setLocation={store.setLocation} />}

          {/* 样式设置折叠面板 */}
          <Collapsible open={styleOpen} onOpenChange={setStyleOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between px-3 h-9 text-muted-foreground">
                <span className="text-xs font-medium">样式设置</span>
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
                下载二维码
              </Button>
            </>
          ) : (
            <div className="text-center text-muted-foreground">
              <QrCode className="w-16 h-16 mx-auto mb-3 opacity-20" />
              <p className="text-sm">请输入内容生成二维码</p>
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
}: {
  style: QRStyleConfig;
  setStyle: (style: Partial<QRStyleConfig>) => void;
  resetStyle: () => void;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
  handleLogoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-border/50">
      {/* 颜色设置 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">前景色（码点）</Label>
          <ColorPicker value={style.foreground} onChange={(color) => setStyle({ foreground: color })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">背景色</Label>
          <ColorPicker value={style.background} onChange={(color) => setStyle({ background: color })} />
        </div>
      </div>

      {/* 容错级别 */}
      <div className="space-y-2">
        <Label className="text-xs">
          容错级别 {style.logoDataUrl && <span className="text-muted-foreground">（有 Logo 时自动使用 H 级）</span>}
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
            {ERROR_LEVEL_OPTIONS.map((opt) => (
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
          <Label className="text-xs">尺寸: {style.size}px</Label>
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
          <Label className="text-xs">边距: {style.margin}</Label>
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
        <Label className="text-xs">品牌 Logo</Label>
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
        {style.logoDataUrl ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded border border-border overflow-hidden bg-white">
              <img src={style.logoDataUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Logo 大小: {Math.round(style.logoSizeRatio * 100)}%</Label>
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
            上传 Logo 图片
          </Button>
        )}
        <p className="text-xs text-muted-foreground">Logo 会放置在二维码中心，建议使用正方形透明背景图片</p>
      </div>

      {/* 重置按钮 */}
      <Button variant="ghost" size="sm" className="w-full h-8 text-xs gap-1.5" onClick={resetStyle}>
        <RotateCcw className="w-3 h-3" />
        重置样式
      </Button>
    </div>
  );
}

// 文本输入组件
function TextInput({ text, setText }: { text: string; setText: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>文本内容</Label>
      <Textarea
        placeholder="输入文本、网址或任意内容..."
        className="min-h-[200px] font-mono text-sm resize-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}

// WiFi 输入组件
function WifiInput({ wifi, setWifi }: { wifi: WifiData; setWifi: (v: Partial<WifiData>) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>网络名称 (SSID)</Label>
        <Input placeholder="输入 WiFi 名称" value={wifi.ssid} onChange={(e) => setWifi({ ssid: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>加密类型</Label>
        <Select value={wifi.encryption} onValueChange={(v) => setWifi({ encryption: v as WifiEncryption })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WPA">WPA/WPA2</SelectItem>
            <SelectItem value="WEP">WEP</SelectItem>
            <SelectItem value="nopass">无密码</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {wifi.encryption !== 'nopass' && (
        <div className="space-y-2">
          <Label>密码</Label>
          <Input
            type="password"
            placeholder="输入 WiFi 密码"
            value={wifi.password}
            onChange={(e) => setWifi({ password: e.target.value })}
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        <Switch checked={wifi.hidden} onCheckedChange={(v) => setWifi({ hidden: v })} />
        <Label className="font-normal">隐藏网络</Label>
      </div>
    </div>
  );
}

// 联系人输入组件
function ContactInput({
  contact,
  setContact,
}: {
  contact: ContactData;
  setContact: (v: Partial<ContactData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>姓名</Label>
        <Input placeholder="输入姓名" value={contact.name} onChange={(e) => setContact({ name: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>电话</Label>
        <Input
          placeholder="输入电话号码"
          value={contact.phone}
          onChange={(e) => setContact({ phone: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>邮箱</Label>
        <Input
          type="email"
          placeholder="输入邮箱地址"
          value={contact.email}
          onChange={(e) => setContact({ email: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>公司</Label>
        <Input
          placeholder="输入公司名称"
          value={contact.company}
          onChange={(e) => setContact({ company: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>职位</Label>
        <Input placeholder="输入职位" value={contact.title} onChange={(e) => setContact({ title: e.target.value })} />
      </div>
    </div>
  );
}

// 短信输入组件
function SMSInput({ sms, setSMS }: { sms: SMSData; setSMS: (v: Partial<SMSData>) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>收件人号码</Label>
        <Input placeholder="输入手机号码" value={sms.phone} onChange={(e) => setSMS({ phone: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>短信内容</Label>
        <Textarea
          placeholder="输入短信内容（可选）"
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
}: {
  location: LocationData;
  setLocation: (v: Partial<LocationData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>纬度</Label>
          <Input
            placeholder="如 39.9042"
            value={location.latitude}
            onChange={(e) => setLocation({ latitude: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>经度</Label>
          <Input
            placeholder="如 116.4074"
            value={location.longitude}
            onChange={(e) => setLocation({ longitude: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>位置标签（可选）</Label>
        <Input
          placeholder="如 北京天安门"
          value={location.label}
          onChange={(e) => setLocation({ label: e.target.value })}
        />
      </div>
      <p className="text-xs text-muted-foreground">提示：可以通过地图应用获取经纬度坐标</p>
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
        <p className="text-sm text-muted-foreground mb-2">点击或拖拽图片到此处上传</p>
        <p className="text-xs text-muted-foreground/70">支持 JPG、PNG、GIF 等常见图片格式</p>
      </div>

      {/* 解析结果 */}
      {(parseResult || parseError) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{parseError ? '解析失败' : '解析结果'}</Label>
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
            清除结果
          </Button>
        </div>
      )}
    </div>
  );
}
