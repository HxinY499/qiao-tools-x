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
  color: RGBColor;
  setColor: (color: Partial<RGBColor>) => void;
  setFromHex: (hex: string) => void;
  setFromHSL: (hsl: HSLColor) => void;
};

const initialColor: RGBColor = { r: 255, g: 161, b: 22, a: 1 };

export const useColorConverterStore = create<ColorConverterStore>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'qiao-tools-x-persist-color-converter',
    },
  ),
);

// 派生 selector：让 zustand 正确追踪 color 变化来派生 hex/hsl
export function selectHex(state: ColorConverterStore): string {
  const { r, g, b, a } = state.color;
  return rgbToHex(r, g, b, a);
}

export function selectHSL(state: ColorConverterStore): HSLColor {
  const { r, g, b, a } = state.color;
  return rgbToHsl(r, g, b, a);
}
