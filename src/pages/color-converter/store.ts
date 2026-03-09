import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from './utils';

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

const initialColor: RGBColor = { r: 255, g: 161, b: 22, a: 1 };

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
      name: 'qiao-tools-x-persist-color-converter',
    },
  ),
);
