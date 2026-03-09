import { describe, expect, it } from 'vitest';

import {
  formatContactString,
  formatLocationString,
  formatSMSString,
  formatWifiString,
  getQRContent,
  isValidCoordinate,
} from './utils';

describe('formatWifiString', () => {
  it('应生成标准 WiFi 字符串', () => {
    const result = formatWifiString({ ssid: 'MyWiFi', password: '12345678', encryption: 'WPA', hidden: false });
    expect(result).toBe('WIFI:T:WPA;S:MyWiFi;P:12345678;;');
  });

  it('无密码的开放网络应不包含 P 字段', () => {
    const result = formatWifiString({ ssid: 'Open', password: '', encryption: 'nopass', hidden: false });
    expect(result).toBe('WIFI:T:nopass;S:Open;;');
    expect(result).not.toContain('P:');
  });

  it('隐藏网络应包含 H:true', () => {
    const result = formatWifiString({ ssid: 'Hidden', password: 'pass', encryption: 'WPA', hidden: true });
    expect(result).toContain('H:true');
  });

  it('空 SSID 应返回空字符串', () => {
    expect(formatWifiString({ ssid: '', password: '', encryption: 'WPA', hidden: false })).toBe('');
  });

  it('应转义特殊字符', () => {
    const result = formatWifiString({ ssid: 'My;WiFi', password: 'pass:word', encryption: 'WPA', hidden: false });
    expect(result).toContain('My\\;WiFi');
    expect(result).toContain('pass\\:word');
  });
});

describe('formatContactString', () => {
  it('应生成 vCard 格式', () => {
    const result = formatContactString({ name: 'John', phone: '123', email: '', company: '', title: '' });
    expect(result).toContain('BEGIN:VCARD');
    expect(result).toContain('END:VCARD');
    expect(result).toContain('FN:John');
    expect(result).toContain('TEL:123');
  });

  it('应包含所有提供的字段', () => {
    const result = formatContactString({
      name: 'Alice',
      phone: '456',
      email: 'a@b.com',
      company: 'Corp',
      title: 'CEO',
    });
    expect(result).toContain('EMAIL:a@b.com');
    expect(result).toContain('ORG:Corp');
    expect(result).toContain('TITLE:CEO');
  });

  it('无名无电话应返回空字符串', () => {
    expect(formatContactString({ name: '', phone: '', email: '', company: '', title: '' })).toBe('');
  });
});

describe('formatSMSString', () => {
  it('应生成 SMSTO 格式', () => {
    expect(formatSMSString({ phone: '123', message: 'hi' })).toBe('SMSTO:123:hi');
  });

  it('无消息内容应仍有冒号', () => {
    expect(formatSMSString({ phone: '123', message: '' })).toBe('SMSTO:123:');
  });

  it('无电话号码应返回空字符串', () => {
    expect(formatSMSString({ phone: '', message: 'hi' })).toBe('');
  });
});

describe('formatLocationString', () => {
  it('应生成 geo URI', () => {
    expect(formatLocationString({ latitude: '39.9', longitude: '116.4', label: '' })).toBe('geo:39.9,116.4');
  });

  it('有标签时应包含 q 参数', () => {
    const result = formatLocationString({ latitude: '39.9', longitude: '116.4', label: '北京' });
    expect(result).toContain('q=');
    expect(result).toContain(encodeURIComponent('北京'));
  });

  it('缺少经纬度应返回空字符串', () => {
    expect(formatLocationString({ latitude: '', longitude: '116.4', label: '' })).toBe('');
    expect(formatLocationString({ latitude: '39.9', longitude: '', label: '' })).toBe('');
  });
});

describe('isValidCoordinate', () => {
  it('合法经纬度应返回 true', () => {
    expect(isValidCoordinate('39.9', '116.4')).toBe(true);
    expect(isValidCoordinate('-90', '-180')).toBe(true);
    expect(isValidCoordinate('90', '180')).toBe(true);
    expect(isValidCoordinate('0', '0')).toBe(true);
  });

  it('超出范围应返回 false', () => {
    expect(isValidCoordinate('91', '0')).toBe(false);
    expect(isValidCoordinate('0', '181')).toBe(false);
    expect(isValidCoordinate('-91', '0')).toBe(false);
  });

  it('非数字应返回 false', () => {
    expect(isValidCoordinate('abc', '0')).toBe(false);
    expect(isValidCoordinate('0', 'xyz')).toBe(false);
  });
});

describe('getQRContent', () => {
  const wifi = { ssid: 'Test', password: 'pass', encryption: 'WPA' as const, hidden: false };
  const contact = { name: 'John', phone: '123', email: '', company: '', title: '' };
  const sms = { phone: '123', message: 'hi' };
  const location = { latitude: '39.9', longitude: '116.4', label: '' };

  it('text 模式应返回文本', () => {
    expect(getQRContent('text', 'hello', wifi, contact, sms, location)).toBe('hello');
  });

  it('wifi 模式应返回 wifi 字符串', () => {
    expect(getQRContent('wifi', '', wifi, contact, sms, location)).toContain('WIFI:');
  });

  it('contact 模式应返回 vCard', () => {
    expect(getQRContent('contact', '', wifi, contact, sms, location)).toContain('BEGIN:VCARD');
  });

  it('sms 模式应返回 SMSTO', () => {
    expect(getQRContent('sms', '', wifi, contact, sms, location)).toContain('SMSTO:');
  });

  it('location 模式应返回 geo URI', () => {
    expect(getQRContent('location', '', wifi, contact, sms, location)).toContain('geo:');
  });
});
