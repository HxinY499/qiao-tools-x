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
}

const DEFAULT_DATA: TextEscaperData = {
  input: '',
  activeTab: 'html',
  mode: 'encode',
};

export const useTextEscaperStore = create<TextEscaperState>()(
  persist(
    (set) => ({
      data: DEFAULT_DATA,
      setInput: (input) => set((state) => ({ data: { ...state.data, input } })),
      setTab: (tab) => set((state) => ({ data: { ...state.data, activeTab: tab } })),
      setMode: (mode) => set((state) => ({ data: { ...state.data, mode } })),
      reset: () => set({ data: DEFAULT_DATA }),
    }),
    {
      name: 'qiao-tools-x-persist-text-escaper',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// 纯函数：根据源 state 计算输出（组件侧用 useMemo 缓存调用）
export function computeEscapeOutput(input: string, tab: EscapeType, mode: 'encode' | 'decode'): string {
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
}
