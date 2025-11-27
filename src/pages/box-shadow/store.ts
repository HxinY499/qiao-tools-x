import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ShadowLayer = {
  id: string;
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  spreadRadius: number;
  color: string;
  inset: boolean;
};

export type BoxShadowConfig = {
  layers: ShadowLayer[];
};

function createLayer(id: string, overrides?: Partial<ShadowLayer>): ShadowLayer {
  return {
    id,
    offsetX: 0,
    offsetY: 12,
    blurRadius: 30,
    spreadRadius: -10,
    color: '#000000',
    inset: false,
    ...overrides,
  };
}

export const initialBoxShadowConfig: BoxShadowConfig = {
  layers: [createLayer('layer-1')],
};

type BoxShadowStore = {
  config: BoxShadowConfig;
  setConfig: (updater: (prev: BoxShadowConfig) => BoxShadowConfig) => void;
};

export const useBoxShadowStore = create<BoxShadowStore>()(
  persist(
    (set) => ({
      config: initialBoxShadowConfig,
      setConfig: (updater) =>
        set((state) => ({
          config: updater(state.config),
        })),
    }),
    {
      name: 'qiao-tools-x-persist-box-shadow',
    },
  ),
);

export function createNewLayer(baseIndex: number): ShadowLayer {
  const id = `layer-${baseIndex}-${Date.now()}`;
  const offsetY = 6 + baseIndex * 4;
  const blurRadius = 18 + baseIndex * 6;
  const spreadRadius = -6 - baseIndex * 2;
  return createLayer(id, { offsetY, blurRadius, spreadRadius });
}
