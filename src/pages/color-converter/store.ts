import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RGBColor = {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
};

export type HSLColor = {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
  a: number; // 0-1
};

type ColorConverterStore = {
  // 当前颜色（使用 RGB 作为内部存储）
  color: RGBColor;
  // 更新颜色
  setColor: (color: Partial<RGBColor>) => void;
  // 从 Hex 设置颜色
  setFromHex: (hex: string) => void;
  // 从 HSL 设置颜色
  setFromHSL: (hsl: HSLColor) => void;
  // 获取 Hex 格式
  getHex: () => string;
  // 获取 HSL 格式
  getHSL: () => HSLColor;
};

// 辅助函数：RGB 转 Hex
function rgbToHex(r: number, g: number, b: number, a: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16).padStart(2, '0');
    return hex.toUpperCase();
  };

  const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (a < 1) {
    return `${hexColor}${toHex(a * 255)}`;
  }
  return hexColor;
}

// 辅助函数：Hex 转 RGB
function hexToRgb(hex: string): RGBColor | null {
  // 移除 # 号
  hex = hex.replace(/^#/, '');

  // 处理 3 位或 4 位简写
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  // 解析颜色值
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  } else if (hex.length === 8) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = parseInt(hex.slice(6, 8), 16) / 255;
    return { r, g, b, a };
  }

  return null;
}

// 辅助函数：RGB 转 HSL
function rgbToHsl(r: number, g: number, b: number, a: number): HSLColor {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a,
  };
}

// 辅助函数：HSL 转 RGB
function hslToRgb(h: number, s: number, l: number, a: number): RGBColor {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a,
  };
}

const initialColor: RGBColor = { r: 255, g: 87, b: 51, a: 1 };

export const useColorConverterStore = create<ColorConverterStore>()(
  persist(
    (set, get) => ({
      color: initialColor,

      setColor: (newColor) => {
        set((state) => ({
          color: { ...state.color, ...newColor },
        }));
      },

      setFromHex: (hex) => {
        const rgb = hexToRgb(hex);
        if (rgb) {
          set({ color: rgb });
        }
      },

      setFromHSL: (hsl) => {
        const rgb = hslToRgb(hsl.h, hsl.s, hsl.l, hsl.a);
        set({ color: rgb });
      },

      getHex: () => {
        const { r, g, b, a } = get().color;
        return rgbToHex(r, g, b, a);
      },

      getHSL: () => {
        const { r, g, b, a } = get().color;
        return rgbToHsl(r, g, b, a);
      },
    }),
    {
      name: 'Color_converter_store',
    },
  ),
);
