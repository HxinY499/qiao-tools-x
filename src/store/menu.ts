import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ToolCategory } from '@/type';

type MenuState = {
  // 置顶的工具路径列表
  pinnedPaths: string[];
  // 被【折叠】的分类列表（默认全部展开，所以用"被折叠的"反向存储更轻量）
  collapsedCategories: ToolCategory[];
  // 置顶某个工具
  pinTool: (path: string) => void;
  // 取消置顶某个工具
  unpinTool: (path: string) => void;
  // 切换置顶状态
  togglePin: (path: string) => void;
  // 切换分类的折叠状态
  toggleCategory: (category: ToolCategory) => void;
};

export const useMenuStore = create<MenuState>()(
  persist(
    (set) => ({
      pinnedPaths: [],
      collapsedCategories: [],
      pinTool: (path) =>
        set((state) => {
          if (state.pinnedPaths.includes(path)) return state;
          return { pinnedPaths: [...state.pinnedPaths, path] };
        }),
      unpinTool: (path) =>
        set((state) => ({
          pinnedPaths: state.pinnedPaths.filter((p) => p !== path),
        })),
      togglePin: (path) =>
        set((state) => {
          if (state.pinnedPaths.includes(path)) {
            return { pinnedPaths: state.pinnedPaths.filter((p) => p !== path) };
          }
          return { pinnedPaths: [...state.pinnedPaths, path] };
        }),
      toggleCategory: (category) =>
        set((state) => {
          if (state.collapsedCategories.includes(category)) {
            return { collapsedCategories: state.collapsedCategories.filter((c) => c !== category) };
          }
          return { collapsedCategories: [...state.collapsedCategories, category] };
        }),
    }),
    {
      name: 'qiao-tools-x-persist-menu',
    },
  ),
);
