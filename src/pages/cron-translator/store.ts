import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { type CronFormat, DEFAULT_EXPRESSION } from './types';

interface CronTranslatorState {
  expression: string;
  format: CronFormat;
  setExpression: (expr: string) => void;
  setFormat: (fmt: CronFormat) => void;
  reset: () => void;
}

export const useCronTranslatorStore = create<CronTranslatorState>()(
  persist(
    (set) => ({
      expression: DEFAULT_EXPRESSION,
      format: 'standard',
      setExpression: (expression) => set({ expression }),
      setFormat: (format) => set({ format }),
      reset: () => set({ expression: DEFAULT_EXPRESSION, format: 'standard' }),
    }),
    {
      name: 'qiao-tools-x-persist-cron-translator',
    },
  ),
);
