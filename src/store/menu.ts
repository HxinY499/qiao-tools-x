import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type MenuState = {
  // 置顶的工具路径列表
  pinnedPaths: string[];
  // 置顶某个工具
  pinTool: (path: string) => void;
  // 取消置顶某个工具
  unpinTool: (path: string) => void;
  // 切换置顶状态
  togglePin: (path: string) => void;
  // 检查是否已置顶
  isPinned: (path: string) => boolean;
};

export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      pinnedPaths: [],
      pinTool: (path) =>
        set((state) => {
          if (state.pinnedPaths.includes(path)) return state;
          return { pinnedPaths: [...state.pinnedPaths, path] };
        }),
      unpinTool: (path) =>
        set((state) => ({
          pinnedPaths: state.pinnedPaths.filter((p) => p !== path),
        })),
      togglePin: (path) => {
        const { pinnedPaths } = get();
        if (pinnedPaths.includes(path)) {
          get().unpinTool(path);
        } else {
          get().pinTool(path);
        }
      },
      isPinned: (path) => get().pinnedPaths.includes(path),
    }),
    {
      name: 'qiao-tools-x-persist-menu',
    },
  ),
);
