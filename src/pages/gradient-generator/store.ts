import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GradientType = 'linear' | 'radial';

export type ColorStop = {
  id: string;
  color: string;
  position: number; // 0 - 100
};

export type GradientConfig = {
  type: GradientType;
  angle: number; // 0 - 360, only for linear
  stops: ColorStop[];
};

type GradientStore = {
  config: GradientConfig;
  setConfig: (updater: (prev: GradientConfig) => GradientConfig) => void;
};

function createStop(id: string, color: string, position: number): ColorStop {
  return { id, color, position };
}

const initialStops: ColorStop[] = [createStop('stop-1', '#FFA116', 0), createStop('stop-2', '#000000', 100)];

export const initialGradientConfig: GradientConfig = {
  type: 'linear',
  angle: 135,
  stops: initialStops,
};

export const useGradientStore = create<GradientStore>()(
  persist(
    (set) => ({
      config: initialGradientConfig,
      setConfig: (updater) =>
        set((state) => ({
          config: updater(state.config),
        })),
    }),
    {
      name: 'qiao-tools-x-persist-gradient-generator',
    },
  ),
);

export function createNewStop(index: number): ColorStop {
  const id = `stop-${index}-${Date.now()}`;
  const basePosition = Math.min(100, Math.max(0, index * (100 / 3)));
  return createStop(id, '#22c55e', Math.round(basePosition));
}
