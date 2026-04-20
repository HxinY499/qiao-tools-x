import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'double';

export type ConfigType = {
  scrollbar: { width: number };
  track: {
    'border-radius': number;
    'border-width': number;
    'background-color': string;
    'border-color': string;
    'border-style': BorderStyle;
  };
  thumb: {
    'border-radius': number;
    'border-width': number;
    'background-color': string;
    'border-color': string;
    'border-style': BorderStyle;
  };
  corner: { 'background-color': string };
};

export const initConfig: ConfigType = {
  scrollbar: { width: 15 },
  track: {
    'border-radius': 10,
    'border-width': 0,
    'border-style': 'solid',
    'background-color': '#CFCFCF',
    'border-color': '#000000',
  },
  thumb: {
    'border-radius': 10,
    'border-width': 0,
    'border-style': 'solid',
    'background-color': '#FFA116',
    'border-color': '#000000',
  },
  corner: { 'background-color': 'transparent' },
};

type ScrollbarStore = {
  config: ConfigType;
  hasHorizontal: boolean;
  showWhenHover: boolean;
  setConfig: (updater: (prev: ConfigType) => ConfigType) => void;
  setHasHorizontal: (v: boolean) => void;
  setShowWhenHover: (v: boolean) => void;
};

export const useScrollbarStore = create<ScrollbarStore>()(
  persist(
    (set) => ({
      config: initConfig,
      hasHorizontal: false,
      showWhenHover: false,
      setConfig: (updater) =>
        set((state) => ({
          config: updater(state.config),
        })),
      setHasHorizontal: (hasHorizontal) => set({ hasHorizontal }),
      setShowWhenHover: (showWhenHover) => set({ showWhenHover }),
    }),
    {
      name: 'qiao-tools-x-persist-scroll-bar',
    },
  ),
);
