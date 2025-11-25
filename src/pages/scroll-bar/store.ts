import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'double';

type ConfigType = {
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

const initConfig: ConfigType = {
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

function loadInitialConfig(): ConfigType {
  if (typeof window === 'undefined') return initConfig;
  try {
    const raw = window.localStorage.getItem('Scrollbar__config');
    if (!raw) return initConfig;
    const parsed = JSON.parse(raw) as Partial<ConfigType>;
    return {
      scrollbar: { ...initConfig.scrollbar, ...(parsed.scrollbar || {}) },
      track: { ...initConfig.track, ...(parsed.track || {}) },
      thumb: { ...initConfig.thumb, ...(parsed.thumb || {}) },
      corner: { ...initConfig.corner, ...(parsed.corner || {}) },
    };
  } catch {
    return initConfig;
  }
}

type ScrollbarStore = {
  config: ConfigType;
  setConfig: (updater: (prev: ConfigType) => ConfigType) => void;
};

export const useScrollbarStore = create<ScrollbarStore>()(
  persist(
    (set) => ({
      config: loadInitialConfig(),
      setConfig: (updater) =>
        set((state) => ({
          config: updater(state.config),
        })),
    }),
    {
      name: 'Scrollbar__config_store',
    },
  ),
);
