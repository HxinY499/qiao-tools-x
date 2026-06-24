import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 块查看类工具（SSE / JSONL 等）的渲染与查找设置，多工具共享。
 * - highlightEnabled：是否对 JSON 块做语法高亮
 * - virtualScrollEnabled：是否开启虚拟滚动
 * - caseSensitive：过滤是否大小写敏感
 * - regexMode：过滤是否启用正则模式
 * - showMatchedOnly：是否只渲染命中查询的块（关闭时全量渲染，命中块高亮）。
 *   该项默认开启，且【不持久化】——每次进页面都按默认值开始，避免老用户被旧值粘住。
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
      showMatchedOnly: true,
      setHighlightEnabled: (enabled) => set({ highlightEnabled: enabled }),
      setVirtualScrollEnabled: (enabled) => set({ virtualScrollEnabled: enabled }),
      setCaseSensitive: (enabled) => set({ caseSensitive: enabled }),
      setRegexMode: (enabled) => set({ regexMode: enabled }),
      setShowMatchedOnly: (enabled) => set({ showMatchedOnly: enabled }),
    }),
    {
      name: 'qiao-tools-x-persist-block-viewer',
      // 只持久化下列字段。showMatchedOnly 故意排除：每次进页面都用默认（开启）状态。
      partialize: (state) => ({
        highlightEnabled: state.highlightEnabled,
        virtualScrollEnabled: state.virtualScrollEnabled,
        caseSensitive: state.caseSensitive,
        regexMode: state.regexMode,
      }),
    },
  ),
);
