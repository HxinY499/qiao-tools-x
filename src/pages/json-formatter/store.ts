import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface JsonFormatterState {
  // Mode
  simpleMode: boolean;

  // Visual
  rootFontSize: number;
  indent: number;
  collapse: boolean;
  showArrayIndices: boolean;
  showStringQuotes: boolean;
  sortKeys: boolean;
  showCollectionCount: boolean;
  arrayIndexFromOne: boolean;
  showIconTooltips: boolean;
  stringTruncate: number;
  collapseAnimationTime: number;

  // Functional
  viewOnly: boolean;
  enableClipboard: boolean;

  // Actions
  setSimpleMode: (simple: boolean) => void;
  setRootFontSize: (size: number) => void;
  setIndent: (indent: number) => void;
  setCollapse: (collapse: boolean) => void;
  setShowArrayIndices: (show: boolean) => void;
  setShowStringQuotes: (show: boolean) => void;
  setSortKeys: (sort: boolean) => void;
  setShowCollectionCount: (show: boolean) => void;
  setArrayIndexFromOne: (fromOne: boolean) => void;
  setShowIconTooltips: (show: boolean) => void;
  setStringTruncate: (length: number) => void;
  setCollapseAnimationTime: (time: number) => void;
  setViewOnly: (viewOnly: boolean) => void;
  setEnableClipboard: (enable: boolean) => void;

  resetSettings: () => void;
}

const defaultSettings = {
  simpleMode: false,
  rootFontSize: 13,
  indent: 2,
  collapse: false,
  showArrayIndices: false,
  showStringQuotes: true,
  sortKeys: false,
  showCollectionCount: true,
  arrayIndexFromOne: false,
  showIconTooltips: false,
  stringTruncate: 250,
  collapseAnimationTime: 200,
  viewOnly: true,
  enableClipboard: false,
};

export const useJsonFormatterStore = create<JsonFormatterState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setSimpleMode: (simpleMode) => set({ simpleMode }),
      setRootFontSize: (rootFontSize) => set({ rootFontSize }),
      setIndent: (indent) => set({ indent }),
      setCollapse: (collapse) => set({ collapse }),
      setShowArrayIndices: (showArrayIndices) => set({ showArrayIndices }),
      setShowStringQuotes: (showStringQuotes) => set({ showStringQuotes }),
      setSortKeys: (sortKeys) => set({ sortKeys }),
      setShowCollectionCount: (showCollectionCount) => set({ showCollectionCount }),
      setArrayIndexFromOne: (arrayIndexFromOne) => set({ arrayIndexFromOne }),
      setShowIconTooltips: (showIconTooltips) => set({ showIconTooltips }),
      setStringTruncate: (stringTruncate) => set({ stringTruncate }),
      setCollapseAnimationTime: (collapseAnimationTime) => set({ collapseAnimationTime }),
      setViewOnly: (viewOnly) => set({ viewOnly }),
      setEnableClipboard: (enableClipboard) => set({ enableClipboard }),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'qiao-tools-x-persist-json-formatter',
    },
  ),
);
