import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { TextEscaperData } from './types';
import { escapeHtml, escapeJs, EscapeType, escapeUnicode, unescapeHtml, unescapeJs, unescapeUnicode } from './utils';

interface TextEscaperState {
  data: TextEscaperData;
  setInput: (input: string) => void;
  setTab: (tab: EscapeType) => void;
  setMode: (mode: 'encode' | 'decode') => void;
  reset: () => void;
  // 计算输出（根据当前状态）
  calculateOutput: (input: string, tab: EscapeType, mode: 'encode' | 'decode') => string;
}

const DEFAULT_DATA: TextEscaperData = {
  input: '',
  output: '',
  activeTab: 'html',
  mode: 'encode',
};

export const useTextEscaperStore = create<TextEscaperState>()(
  persist(
    (set, get) => ({
      data: DEFAULT_DATA,
      calculateOutput: (input, tab, mode) => {
        if (!input) return '';
        try {
          switch (tab) {
            case 'html':
              return mode === 'encode' ? escapeHtml(input) : unescapeHtml(input);
            case 'unicode':
              return mode === 'encode' ? escapeUnicode(input) : unescapeUnicode(input);
            case 'js':
              return mode === 'encode' ? escapeJs(input) : unescapeJs(input);
            default:
              return '';
          }
        } catch (e) {
          console.error(e);
          return 'Error processing text';
        }
      },
      setInput: (input) => {
        const { data, calculateOutput } = get();
        const { activeTab, mode } = data;
        const output = calculateOutput(input, activeTab, mode);
        set((state) => ({ data: { ...state.data, input, output } }));
      },
      setTab: (tab) => {
        const { data, calculateOutput } = get();
        const { input, mode } = data;
        const output = calculateOutput(input, tab, mode);
        set((state) => ({ data: { ...state.data, activeTab: tab, output } }));
      },
      setMode: (mode) => {
        const { input, activeTab } = get().data;
        const output = get().calculateOutput(input, activeTab, mode);
        set((state) => ({ data: { ...state.data, mode, output } }));
      },
      reset: () => set({ data: DEFAULT_DATA }),
    }),
    {
      name: 'qiao-tools-x-persist-text-escaper',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
