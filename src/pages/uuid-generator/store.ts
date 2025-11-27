import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UUIDBatch {
  id: string;
  timestamp: number;
  uuids: string[];
}

interface UUIDStore {
  history: UUIDBatch[];
  addHistory: (uuids: string[]) => void;
  clearHistory: () => void;
  removeHistoryItem: (id: string) => void;
}

export const useUUIDStore = create<UUIDStore>()(
  persist(
    (set) => ({
      history: [],
      addHistory: (uuids) =>
        set((state) => ({
          history: [
            {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              uuids,
            },
            ...state.history,
          ].slice(0, 50), // Keep last 50 batches
        })),
      clearHistory: () => set({ history: [] }),
      removeHistoryItem: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'uuid-generator-storage',
    },
  ),
);
