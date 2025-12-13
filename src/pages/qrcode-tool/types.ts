/** 二维码模式 */
export type QRMode = 'text' | 'wifi' | 'contact' | 'sms' | 'location';

/** 功能标签页 */
export type QRTab = 'generate' | 'parse';

/** WiFi 加密类型 */
export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';

/** WiFi 模板数据 */
export interface WifiData {
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden: boolean;
}

/** 联系人模板数据 */
export interface ContactData {
  name: string;
  phone: string;
  email: string;
  company: string;
  title: string;
}

/** 短信模板数据 */
export interface SMSData {
  phone: string;
  message: string;
}

/** 位置模板数据 */
export interface LocationData {
  latitude: string;
  longitude: string;
  label: string;
}

/** 二维码样式配置 */
export interface QRStyleConfig {
  /** 前景色（码点颜色） */
  foreground: string;
  /** 背景色 */
  background: string;
  /** 容错级别 L/M/Q/H */
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  /** 二维码尺寸 */
  size: number;
  /** 边距 */
  margin: number;
  /** Logo 图片 DataURL */
  logoDataUrl: string;
  /** Logo 尺寸比例 (0.1-0.3) */
  logoSizeRatio: number;
}

/** 二维码工具状态 */
export interface QRCodeState {
  tab: QRTab;
  mode: QRMode;
  text: string;
  wifi: WifiData;
  contact: ContactData;
  sms: SMSData;
  location: LocationData;
  qrDataUrl: string;
  parseResult: string;
  parseError: string;
  /** 样式配置 */
  style: QRStyleConfig;
}
