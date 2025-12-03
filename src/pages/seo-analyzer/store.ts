import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface UrlHistoryItem {
  url: string;
  timestamp: number;
}

interface SeoAnalyzerState {
  urlHistory: UrlHistoryItem[];
  addUrlToHistory: (url: string) => void;
  removeUrlFromHistory: (url: string) => void;
  clearHistory: () => void;
}

const MAX_HISTORY_ITEMS = 20;

export const useSeoAnalyzerStore = create<SeoAnalyzerState>()(
  persist(
    (set) => ({
      urlHistory: [],

      addUrlToHistory: (url) =>
        set((state) => {
          // 移除重复项
          const filtered = state.urlHistory.filter((item) => item.url !== url);
          // 添加到开头
          const newHistory = [{ url, timestamp: Date.now() }, ...filtered];
          // 限制最多 20 条
          return { urlHistory: newHistory.slice(0, MAX_HISTORY_ITEMS) };
        }),

      removeUrlFromHistory: (url) =>
        set((state) => ({
          urlHistory: state.urlHistory.filter((item) => item.url !== url),
        })),

      clearHistory: () => set({ urlHistory: [] }),
    }),
    {
      name: 'qiao-tools-x-persist-seo-analyzer',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
