import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WordCountState {
  text: string;
  targetWordCount: number;
  setText: (text: string) => void;
  setTargetWordCount: (count: number) => void;
}

export const useWordCountStore = create<WordCountState>()(
  persist(
    (set) => ({
      text: '',
      targetWordCount: 0,
      setText: (text) => set({ text }),
      setTargetWordCount: (count) => set({ targetWordCount: count }),
    }),
    {
      name: 'qiao-tools-x-persist-word-count',
    },
  ),
);
