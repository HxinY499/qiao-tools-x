import { describe, expect, it } from 'vitest';

import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from './utils';

describe('rgbToHex', () => {
  it('应将 RGB 转为 6 位 Hex', () => {
    expect(rgbToHex(255, 0, 0, 1)).toBe('#FF0000');
    expect(rgbToHex(0, 255, 0, 1)).toBe('#00FF00');
    expect(rgbToHex(0, 0, 255, 1)).toBe('#0000FF');
    expect(rgbToHex(0, 0, 0, 1)).toBe('#000000');
    expect(rgbToHex(255, 255, 255, 1)).toBe('#FFFFFF');
  });

  it('alpha < 1 时应输出 8 位 Hex', () => {
    const result = rgbToHex(255, 0, 0, 0.5);
    expect(result).toMatch(/^#FF0000[0-9A-F]{2}$/);
  });

  it('应处理小数值（四舍五入）', () => {
    expect(rgbToHex(128, 128, 128, 1)).toBe('#808080');
  });
});

describe('hexToRgb', () => {
  it('应解析 6 位 Hex', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255, a: 1 });
  });

  it('应解析不带 # 的 Hex', () => {
    expect(hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('应解析 3 位简写 Hex', () => {
    expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it('应解析 8 位 Hex（含 alpha）', () => {
    const result = hexToRgb('#FF000080');
    expect(result).not.toBeNull();
    expect(result!.r).toBe(255);
    expect(result!.g).toBe(0);
    expect(result!.b).toBe(0);
    expect(result!.a).toBeCloseTo(128 / 255, 2);
  });

  it('长度不匹配应返回 null', () => {
    expect(hexToRgb('#12')).toBeNull();
    expect(hexToRgb('#12345')).toBeNull();
  });

  it('无效字符会产生 NaN（函数不做字符校验）', () => {
    const result = hexToRgb('#GG0000');
    // hexToRgb 按长度匹配，不校验字符有效性，会返回含 NaN 的对象
    expect(result).not.toBeNull();
    expect(Number.isNaN(result!.r)).toBe(true);
  });
});

describe('rgbToHsl', () => {
  it('纯红色 → HSL(0, 100, 50)', () => {
    const hsl = rgbToHsl(255, 0, 0, 1);
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
    expect(hsl.a).toBe(1);
  });

  it('纯绿色 → HSL(120, 100, 50)', () => {
    const hsl = rgbToHsl(0, 255, 0, 1);
    expect(hsl.h).toBe(120);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  it('纯蓝色 → HSL(240, 100, 50)', () => {
    const hsl = rgbToHsl(0, 0, 255, 1);
    expect(hsl.h).toBe(240);
    expect(hsl.s).toBe(100);
    expect(hsl.l).toBe(50);
  });

  it('白色 → HSL(0, 0, 100)', () => {
    const hsl = rgbToHsl(255, 255, 255, 1);
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(100);
  });

  it('黑色 → HSL(0, 0, 0)', () => {
    const hsl = rgbToHsl(0, 0, 0, 1);
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBe(0);
  });

  it('灰色饱和度为 0', () => {
    const hsl = rgbToHsl(128, 128, 128, 1);
    expect(hsl.s).toBe(0);
  });

  it('应保留 alpha', () => {
    const hsl = rgbToHsl(255, 0, 0, 0.5);
    expect(hsl.a).toBe(0.5);
  });
});

describe('hslToRgb', () => {
  it('HSL(0, 100, 50) → 纯红色', () => {
    const rgb = hslToRgb(0, 100, 50, 1);
    expect(rgb).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('HSL(120, 100, 50) → 纯绿色', () => {
    const rgb = hslToRgb(120, 100, 50, 1);
    expect(rgb).toEqual({ r: 0, g: 255, b: 0, a: 1 });
  });

  it('HSL(240, 100, 50) → 纯蓝色', () => {
    const rgb = hslToRgb(240, 100, 50, 1);
    expect(rgb).toEqual({ r: 0, g: 0, b: 255, a: 1 });
  });

  it('HSL(0, 0, 100) → 白色', () => {
    const rgb = hslToRgb(0, 0, 100, 1);
    expect(rgb).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it('HSL(0, 0, 0) → 黑色', () => {
    const rgb = hslToRgb(0, 0, 0, 1);
    expect(rgb).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });

  it('饱和度为 0 时应为灰色', () => {
    const rgb = hslToRgb(0, 0, 50, 1);
    expect(rgb.r).toBe(rgb.g);
    expect(rgb.g).toBe(rgb.b);
    expect(rgb.r).toBe(128);
  });

  it('应保留 alpha', () => {
    const rgb = hslToRgb(0, 100, 50, 0.3);
    expect(rgb.a).toBe(0.3);
  });
});

describe('RGB ↔ HSL 互逆', () => {
  const testCases = [
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 0, b: 255 },
    { r: 255, g: 255, b: 0 },
    { r: 128, g: 64, b: 32 },
    { r: 100, g: 200, b: 150 },
  ];

  testCases.forEach(({ r, g, b }) => {
    it(`RGB(${r},${g},${b}) → HSL → RGB 应还原`, () => {
      const hsl = rgbToHsl(r, g, b, 1);
      const back = hslToRgb(hsl.h, hsl.s, hsl.l, 1);
      // 允许 ±2 误差（HSL 中间取整 + hslToRgb 再取整，会有精度损失）
      expect(Math.abs(back.r - r)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.g - g)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.b - b)).toBeLessThanOrEqual(2);
    });
  });
});

describe('RGB ↔ Hex 互逆', () => {
  it('RGB → Hex → RGB 应还原', () => {
    const hex = rgbToHex(128, 64, 32, 1);
    const rgb = hexToRgb(hex);
    expect(rgb).toEqual({ r: 128, g: 64, b: 32, a: 1 });
  });
});
