import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TextDiffState {
  leftText: string;
  rightText: string;
  setLeftText: (value: string) => void;
  setRightText: (value: string) => void;
  swapTexts: () => void;
  reset: () => void;
}

const DEFAULT_STATE: Pick<TextDiffState, 'leftText' | 'rightText'> = {
  leftText: '',
  rightText: '',
};

export const useTextDiffStore = create<TextDiffState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      setLeftText: (value) => set({ leftText: value }),
      setRightText: (value) => set({ rightText: value }),
      swapTexts: () => {
        const { leftText, rightText } = get();
        set({ leftText: rightText, rightText: leftText });
      },
      reset: () => set(DEFAULT_STATE),
    }),
    {
      name: 'qiao-tools-x-persist-text-diff',
    },
  ),
);
