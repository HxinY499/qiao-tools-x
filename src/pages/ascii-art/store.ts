import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_FONT, type FontName } from './types';

interface AsciiArtState {
  text: string;
  font: FontName;
  setText: (text: string) => void;
  setFont: (font: FontName) => void;
  reset: () => void;
}

export const useAsciiArtStore = create<AsciiArtState>()(
  persist(
    (set) => ({
      text: 'Hello',
      font: DEFAULT_FONT,
      setText: (text) => set({ text }),
      setFont: (font) => set({ font }),
      reset: () => set({ text: 'Hello', font: DEFAULT_FONT }),
    }),
    {
      name: 'qiao-tools-x-persist-ascii-art',
    },
  ),
);
