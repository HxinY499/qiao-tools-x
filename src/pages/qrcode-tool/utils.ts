import QRCode from 'qrcode';

import type { ContactData, LocationData, QRMode, QRStyleConfig, SMSData, WifiData } from './types';

/**
 * 生成 WiFi 二维码内容
 * 格式: WIFI:T:WPA;S:网络名;P:密码;H:是否隐藏;;
 */
export function formatWifiString(data: WifiData): string {
  const { ssid, password, encryption, hidden } = data;
  if (!ssid) return '';

  // 转义特殊字符
  const escapedSsid = escapeWifiString(ssid);
  const escapedPassword = escapeWifiString(password);

  let result = `WIFI:T:${encryption};S:${escapedSsid};`;
  if (encryption !== 'nopass' && password) {
    result += `P:${escapedPassword};`;
  }
  if (hidden) {
    result += 'H:true;';
  }
  result += ';';
  return result;
}

/**
 * WiFi 字符串转义
 */
function escapeWifiString(str: string): string {
  return str.replace(/[\\;,:\"]/g, (char) => `\\${char}`);
}

/**
 * 生成 vCard 格式联系人内容
 */
export function formatContactString(data: ContactData): string {
  const { name, phone, email, company, title } = data;
  if (!name && !phone) return '';

  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];

  if (name) {
    lines.push(`FN:${name}`);
    lines.push(`N:${name};;;`);
  }
  if (phone) {
    lines.push(`TEL:${phone}`);
  }
  if (email) {
    lines.push(`EMAIL:${email}`);
  }
  if (company) {
    lines.push(`ORG:${company}`);
  }
  if (title) {
    lines.push(`TITLE:${title}`);
  }

  lines.push('END:VCARD');
  return lines.join('\n');
}

/**
 * 生成短信二维码内容
 * 格式: SMSTO:电话号码:短信内容
 */
export function formatSMSString(data: SMSData): string {
  const { phone, message } = data;
  if (!phone) return '';
  return `SMSTO:${phone}:${message || ''}`;
}

/**
 * 生成地理位置二维码内容
 * 格式: geo:纬度,经度?q=标签
 */
export function formatLocationString(data: LocationData): string {
  const { latitude, longitude, label } = data;
  if (!latitude || !longitude) return '';

  let result = `geo:${latitude},${longitude}`;
  if (label) {
    result += `?q=${encodeURIComponent(label)}`;
  }
  return result;
}

/**
 * 根据模式获取二维码内容
 */
export function getQRContent(
  mode: QRMode,
  text: string,
  wifi: WifiData,
  contact: ContactData,
  sms: SMSData,
  location: LocationData,
): string {
  switch (mode) {
    case 'text':
      return text;
    case 'wifi':
      return formatWifiString(wifi);
    case 'contact':
      return formatContactString(contact);
    case 'sms':
      return formatSMSString(sms);
    case 'location':
      return formatLocationString(location);
    default:
      return text;
  }
}

/**
 * 验证经纬度格式
 */
export function isValidCoordinate(lat: string, lng: string): boolean {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  return !isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
}

/**
 * 下载二维码图片
 */
export function downloadQRCode(dataUrl: string, filename = 'qrcode.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 生成带样式和 Logo 的二维码
 */
export async function generateStyledQRCode(content: string, style: QRStyleConfig): Promise<string> {
  if (!content) return '';

  // 如果有 Logo，需要使用更高的容错级别
  const errorCorrectionLevel = style.logoDataUrl ? 'H' : style.errorCorrectionLevel;

  // 生成基础二维码
  const qrDataUrl = await QRCode.toDataURL(content, {
    width: style.size,
    margin: style.margin,
    color: {
      dark: style.foreground,
      light: style.background,
    },
    errorCorrectionLevel,
  });

  // 如果没有 Logo，直接返回
  if (!style.logoDataUrl) {
    return qrDataUrl;
  }

  // 有 Logo，需要在二维码中心绘制 Logo
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('无法创建画布'));
      return;
    }

    const qrImage = new Image();
    qrImage.onload = () => {
      canvas.width = qrImage.width;
      canvas.height = qrImage.height;

      // 绘制二维码
      ctx.drawImage(qrImage, 0, 0);

      // 加载并绘制 Logo
      const logoImage = new Image();
      logoImage.onload = () => {
        const logoSize = Math.floor(canvas.width * style.logoSizeRatio);
        const logoX = (canvas.width - logoSize) / 2;
        const logoY = (canvas.height - logoSize) / 2;

        // 绘制白色背景圆角矩形
        const padding = 4;
        const radius = 8;
        ctx.fillStyle = style.background;
        roundRect(ctx, logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2, radius);
        ctx.fill();

        // 绘制 Logo
        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);

        resolve(canvas.toDataURL('image/png'));
      };
      logoImage.onerror = () => {
        // Logo 加载失败，返回无 Logo 的二维码
        resolve(qrDataUrl);
      };
      logoImage.src = style.logoDataUrl;
    };
    qrImage.onerror = () => {
      reject(new Error('二维码图片加载失败'));
    };
    qrImage.src = qrDataUrl;
  });
}

/**
 * 绘制圆角矩形路径
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
