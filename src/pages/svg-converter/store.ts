import { toast } from 'sonner';
import { create } from 'zustand';

import { ConversionParams, PresetType, SvgItem } from './types';
import { convertSvgToImage, parseSvgFile, PRESETS } from './utils';

interface SvgConverterState {
  items: SvgItem[];
  selectedId: string | null;

  globalParams: ConversionParams;
  isIndividualMode: boolean;
  currentPreset: PresetType;

  // Actions
  addFiles: (files: File[]) => Promise<void>;
  removeItem: (id: string) => void;
  clearAll: () => void;
  selectItem: (id: string | null) => void;

  setGlobalParams: (params: Partial<ConversionParams>) => void;
  setItemParams: (id: string, params: Partial<ConversionParams>) => void;
  toggleMode: () => void;
  applyPreset: (preset: PresetType) => void;

  // Conversion
  convertItem: (id: string) => Promise<void>;
  convertAll: () => Promise<void>;

  // Helper to get params for current view
  getDisplayParams: () => ConversionParams;
}

const DEFAULT_PARAMS: ConversionParams = {
  width: 300,
  height: 300,
  format: 'image/png',
  backgroundColor: '#ffffff',
  useTransparent: true,
};

export const useSvgConverterStore = create<SvgConverterState>()((set, get) => ({
  items: [],
  selectedId: null,
  globalParams: DEFAULT_PARAMS,
  isIndividualMode: false,
  currentPreset: 'original',

  addFiles: async (files) => {
    const newItems: SvgItem[] = [];
    const { globalParams, items: currentItems } = get();

    // Filter for SVG
    const svgFiles = files.filter((f) => f.type.includes('svg') || f.name.endsWith('.svg'));
    if (svgFiles.length === 0) {
      toast.error('未找到有效的 SVG 文件');
      return;
    }

    if (svgFiles.length !== files.length) {
      toast.warning(`已过滤 ${files.length - svgFiles.length} 个非 SVG 文件`);
    }

    for (const file of svgFiles) {
      const parsed = await parseSvgFile(file);
      if (!parsed) {
        toast.error(`解析失败: ${file.name}`);
        continue;
      }

      const newItem: SvgItem = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        file,
        content: parsed.content,
        originalWidth: parsed.width,
        originalHeight: parsed.height,
      };
      newItems.push(newItem);
    }

    if (newItems.length === 0) return;

    // Logic from original: if this is the first file, update global params to match its size
    let nextGlobalParams = { ...globalParams };
    if (currentItems.length === 0 && newItems.length > 0) {
      nextGlobalParams = {
        ...nextGlobalParams,
        width: newItems[0].originalWidth,
        height: newItems[0].originalHeight,
      };
    }

    set((state) => ({
      items: [...state.items, ...newItems],
      selectedId: state.selectedId || newItems[0].id, // Select first if none selected
      globalParams: nextGlobalParams,
    }));

    toast.success(`已添加 ${newItems.length} 个文件`);

    // Trigger conversion for new items (immediate)
    newItems.forEach((item) => {
      get().convertItem(item.id);
    });
  },

  removeItem: (id) => {
    const { items, selectedId } = get();
    const itemToRemove = items.find((i) => i.id === id);

    // Cleanup URL
    if (itemToRemove?.result?.url) {
      URL.revokeObjectURL(itemToRemove.result.url);
    }

    const nextItems = items.filter((i) => i.id !== id);
    let nextSelectedId = selectedId;

    if (selectedId === id) {
      nextSelectedId = nextItems.length > 0 ? nextItems[0].id : null;
    }

    set({ items: nextItems, selectedId: nextSelectedId });
  },

  clearAll: () => {
    const { items } = get();
    items.forEach((item) => {
      if (item.result?.url) URL.revokeObjectURL(item.result.url);
    });

    set({ items: [], selectedId: null, currentPreset: 'original' });
  },

  selectItem: (id) => set({ selectedId: id }),

  setGlobalParams: (params) => {
    set((state) => ({
      globalParams: { ...state.globalParams, ...params },
    }));
    // If not individual mode, trigger re-convert for all (immediately)
    if (!get().isIndividualMode) {
      get().convertAll();
    }
  },

  setItemParams: (id, params) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== id) return item;
        const currentCustom = item.customParams || state.globalParams;
        return {
          ...item,
          customParams: { ...currentCustom, ...params },
        };
      }),
    }));

    // Trigger re-convert for this item (immediately)
    get().convertItem(id);
  },

  toggleMode: () => {
    const { isIndividualMode, items, globalParams } = get();
    const newMode = !isIndividualMode;

    if (newMode) {
      // Switching TO Individual Mode
      // Copy global params to all items to "freeze" their state
      const newItems = items.map((item) => ({
        ...item,
        customParams: { ...globalParams },
      }));
      set({ isIndividualMode: newMode, items: newItems });
    } else {
      // Switching TO Unified Mode
      const newItems = items.map((item) => ({
        ...item,
        customParams: undefined,
      }));
      set({ isIndividualMode: newMode, items: newItems });
      // Trigger re-convert all to match global (Immediate)
      get().convertAll();
    }
  },

  applyPreset: (preset) => {
    const { isIndividualMode, selectedId, items } = get();
    const config = PRESETS[preset];

    set({ currentPreset: preset });

    // Helper to determine new dimensions
    const getDims = (originalW: number, originalH: number) => {
      if (preset === 'original') return { width: originalW, height: originalH };
      if (config.size) return { width: config.size, height: config.size };
      return {};
    };

    if (isIndividualMode && selectedId) {
      const item = items.find((i) => i.id === selectedId);
      if (!item) return;

      const dims = getDims(item.originalWidth, item.originalHeight);
      if (Object.keys(dims).length > 0) {
        get().setItemParams(selectedId, dims);
      }
    } else {
      if (preset === 'original' && items.length > 0) {
        get().setGlobalParams({
          width: items[0].originalWidth,
          height: items[0].originalHeight,
        });
      } else if (config.size) {
        get().setGlobalParams({ width: config.size, height: config.size });
      }
    }
  },

  convertItem: async (id) => {
    const { items, globalParams } = get();
    const itemIndex = items.findIndex((i) => i.id === id);
    if (itemIndex === -1) return;

    const item = items[itemIndex];
    const params = item.customParams || globalParams;

    // Set status to loading
    set((state) => {
      const newItems = [...state.items];
      if (!newItems[itemIndex]) return {};
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        result: { ...(newItems[itemIndex].result || {}), status: 'loading' } as any,
      };
      return { items: newItems };
    });

    try {
      const blob = await convertSvgToImage(item.content, params as ConversionParams);
      const url = URL.createObjectURL(blob);

      // Revoke old url
      if (item.result?.url) URL.revokeObjectURL(item.result.url);

      set((state) => {
        const newItems = [...state.items];
        // Check if item still exists (might be removed during async)
        if (!newItems[itemIndex]) return {};

        newItems[itemIndex] = {
          ...newItems[itemIndex],
          result: { blob, url, status: 'success' },
        };
        return { items: newItems };
      });
    } catch (error) {
      console.error('Conversion failed', error);
      set((state) => {
        const newItems = [...state.items];
        if (!newItems[itemIndex]) return {};
        newItems[itemIndex] = {
          ...newItems[itemIndex],
          result: { ...(newItems[itemIndex].result || {}), status: 'error', error: String(error) } as any,
        };
        return { items: newItems };
      });
    }
  },

  convertAll: async () => {
    const { items } = get();
    await Promise.all(items.map((item) => get().convertItem(item.id)));
  },

  getDisplayParams: () => {
    const { items, selectedId, isIndividualMode, globalParams } = get();
    if (isIndividualMode && selectedId) {
      const item = items.find((i) => i.id === selectedId);
      if (item && item.customParams) {
        // Merge with global defaults for safety, though customParams should be complete if set
        return { ...globalParams, ...item.customParams };
      }
      // Fallback if customParams not set yet
      if (item) {
        return {
          ...globalParams,
          width: item.originalWidth,
          height: item.originalHeight,
        };
      }
    }
    return globalParams;
  },
}));
