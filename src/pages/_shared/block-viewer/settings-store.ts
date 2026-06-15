import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 块查看类工具（SSE / ljson）的渲染设置，两工具共享。
 * - highlightEnabled：是否对 JSON 块做语法高亮（关闭后用纯文本渲染，避免大数据量卡顿）
 * - virtualScrollEnabled：是否开启虚拟滚动（开启后仅渲染视口内块，浏览器 Ctrl+F 将失效）
 */
type BlockViewerSettingsState = {
  highlightEnabled: boolean;
  virtualScrollEnabled: boolean;
  setHighlightEnabled: (enabled: boolean) => void;
  setVirtualScrollEnabled: (enabled: boolean) => void;
};

export const useBlockViewerSettings = create<BlockViewerSettingsState>()(
  persist(
    (set) => ({
      highlightEnabled: true,
      virtualScrollEnabled: false,
      setHighlightEnabled: (enabled) => set({ highlightEnabled: enabled }),
      setVirtualScrollEnabled: (enabled) => set({ virtualScrollEnabled: enabled }),
    }),
    {
      name: 'qiao-tools-x-persist-block-viewer',
    },
  ),
);
