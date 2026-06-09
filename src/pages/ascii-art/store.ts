import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  type BorderValue,
  DEFAULT_BORDER,
  DEFAULT_FONT,
  DEFAULT_KERNING,
  type FontName,
  type KerningValue,
} from './types';

interface AsciiArtState {
  text: string;
  font: FontName;
  kerning: KerningValue;
  border: BorderValue;
  setText: (text: string) => void;
  setFont: (font: FontName) => void;
  setKerning: (kerning: KerningValue) => void;
  setBorder: (border: BorderValue) => void;
  reset: () => void;
}

export const useAsciiArtStore = create<AsciiArtState>()(
  persist(
    (set) => ({
      text: 'Hello',
      font: DEFAULT_FONT,
      kerning: DEFAULT_KERNING,
      border: DEFAULT_BORDER,
      setText: (text) => set({ text }),
      setFont: (font) => set({ font }),
      setKerning: (kerning) => set({ kerning }),
      setBorder: (border) => set({ border }),
      reset: () =>
        set({
          text: 'Hello',
          font: DEFAULT_FONT,
          kerning: DEFAULT_KERNING,
          border: DEFAULT_BORDER,
        }),
    }),
    {
      name: 'qiao-tools-x-persist-ascii-art',
    },
  ),
);
