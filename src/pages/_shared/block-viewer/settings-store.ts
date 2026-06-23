import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 块查看类工具（SSE / JSONL 等）的渲染与查找设置，多工具共享。
 * - highlightEnabled：是否对 JSON 块做语法高亮
 * - virtualScrollEnabled：是否开启虚拟滚动
 * - caseSensitive：查找是否大小写敏感
 * - regexMode：查找是否启用正则模式
 * - showMatchedOnly：是否只渲染命中查询的块（关闭时全量渲染，命中块高亮）
 */
type BlockViewerSettingsState = {
  highlightEnabled: boolean;
  virtualScrollEnabled: boolean;
  caseSensitive: boolean;
  regexMode: boolean;
  showMatchedOnly: boolean;
  setHighlightEnabled: (enabled: boolean) => void;
  setVirtualScrollEnabled: (enabled: boolean) => void;
  setCaseSensitive: (enabled: boolean) => void;
  setRegexMode: (enabled: boolean) => void;
  setShowMatchedOnly: (enabled: boolean) => void;
};

export const useBlockViewerSettings = create<BlockViewerSettingsState>()(
  persist(
    (set) => ({
      highlightEnabled: true,
      virtualScrollEnabled: false,
      caseSensitive: false,
      regexMode: false,
      showMatchedOnly: false,
      setHighlightEnabled: (enabled) => set({ highlightEnabled: enabled }),
      setVirtualScrollEnabled: (enabled) => set({ virtualScrollEnabled: enabled }),
      setCaseSensitive: (enabled) => set({ caseSensitive: enabled }),
      setRegexMode: (enabled) => set({ regexMode: enabled }),
      setShowMatchedOnly: (enabled) => set({ showMatchedOnly: enabled }),
    }),
    {
      name: 'qiao-tools-x-persist-block-viewer',
    },
  ),
);
