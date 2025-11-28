import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PasswordHistoryItem {
  id: string;
  timestamp: number;
  password: string;
  length: number;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
}

interface PasswordGeneratorStore {
  history: PasswordHistoryItem[];
  addHistory: (item: Omit<PasswordHistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  removeHistoryItem: (id: string) => void;
}

export const usePasswordGeneratorStore = create<PasswordGeneratorStore>()(
  persist(
    (set) => ({
      history: [],
      addHistory: (item) =>
        set((state) => ({
          history: [
            {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              ...item,
            },
            ...state.history,
          ].slice(0, 100),
        })),
      clearHistory: () => set({ history: [] }),
      removeHistoryItem: (id) =>
        set((state) => ({
          history: state.history.filter((x) => x.id !== id),
        })),
    }),
    {
      name: 'qiao-tools-x-persist-password-generator',
    },
  ),
);
