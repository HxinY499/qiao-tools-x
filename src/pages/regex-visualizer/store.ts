import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { RegexFlags, RegexTemplate, RegexVisualizerState } from './types';

const DEFAULT_FLAGS: RegexFlags = {
  global: true,
  ignoreCase: false,
  multiline: false,
  dotAll: false,
  unicode: false,
  sticky: false,
};

const DEFAULT_PATTERN = '';
const DEFAULT_TEST_TEXT = '';

export const useRegexVisualizerStore = create<RegexVisualizerState>()(
  persist(
    (set) => ({
      pattern: DEFAULT_PATTERN,
      testText: DEFAULT_TEST_TEXT,
      replacePattern: '',
      flags: DEFAULT_FLAGS,

      setPattern: (pattern) => set({ pattern }),
      setTestText: (text) => set({ testText: text }),
      setReplacePattern: (pattern) => set({ replacePattern: pattern }),

      setFlags: (flags) =>
        set((state) => ({
          flags: { ...state.flags, ...flags },
        })),

      toggleFlag: (flag) =>
        set((state) => ({
          flags: { ...state.flags, [flag]: !state.flags[flag] },
        })),

      reset: () =>
        set({
          pattern: DEFAULT_PATTERN,
          testText: DEFAULT_TEST_TEXT,
          replacePattern: '',
          flags: DEFAULT_FLAGS,
        }),

      applyTemplate: (template: RegexTemplate) =>
        set({
          pattern: template.pattern,
          testText: template.testText || '',
        }),
    }),
    {
      name: 'qiao-tools-x-persist-regex-visualizer',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
