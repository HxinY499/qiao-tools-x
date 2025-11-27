import { useLocalStorageState } from 'ahooks';
import { RefreshCw } from 'lucide-react';
import { useMemo } from 'react';

import { CodeArea } from '@/components/code-area';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Corner, CornerControl } from './corner-control';

interface BorderRadiusState {
  topLeft: Corner;
  topRight: Corner;
  bottomRight: Corner;
  bottomLeft: Corner;
}

const initialCorner: Corner = { x: 20, y: 20, locked: true };

const initialState: BorderRadiusState = {
  topLeft: { ...initialCorner },
  topRight: { ...initialCorner },
  bottomRight: { ...initialCorner },
  bottomLeft: { ...initialCorner },
};

export default function BorderRadiusPage() {
  const [state, setState] = useLocalStorageState<BorderRadiusState>('qiao-tools-x-persist-border-radius', {
    defaultValue: initialState,
  });

  const updateCorner = (corner: keyof BorderRadiusState, updates: Partial<Corner>) => {
    setState((prev) => {
      if (!prev) return initialState;
      const current = prev[corner];
      const next = { ...current, ...updates };

      // Handle locking logic
      if (next.locked && !current.locked) {
        // Just locked, sync Y to X
        next.y = next.x;
      } else if (next.locked && (updates.x !== undefined || updates.y !== undefined)) {
        // If locked and updating X or Y, sync the other
        if (updates.x !== undefined) next.y = updates.x;
        if (updates.y !== undefined) next.x = updates.y;
      }

      return { ...prev, [corner]: next };
    });
  };

  const reset = () => setState(initialState);

  const cssValue = useMemo(() => {
    if (!state) return '';
    const { topLeft, topRight, bottomRight, bottomLeft } = state;

    // Check if we can use simplified syntax (all x == y)
    const simple =
      topLeft.x === topLeft.y &&
      topRight.x === topRight.y &&
      bottomRight.x === bottomRight.y &&
      bottomLeft.x === bottomLeft.y;

    if (simple) {
      // If all corners are same, use 1 value? No, keep 4 for flexibility unless they are ALL equal
      if (topLeft.x === topRight.x && topRight.x === bottomRight.x && bottomRight.x === bottomLeft.x) {
        return `${topLeft.x}px`;
      }
      return `${topLeft.x}px ${topRight.x}px ${bottomRight.x}px ${bottomLeft.x}px`;
    }

    // Complex slash syntax
    const xValues = `${topLeft.x}px ${topRight.x}px ${bottomRight.x}px ${bottomLeft.x}px`;
    const yValues = `${topLeft.y}px ${topRight.y}px ${bottomRight.y}px ${bottomLeft.y}px`;
    return `${xValues} / ${yValues}`;
  }, [state]);

  const cssCode = `border-radius: ${cssValue};`;

  const tailwindCode = useMemo(() => {
    // Replace spaces with underscores for arbitrary values
    const arbitrary = cssValue.replace(/\s+/g, '_');
    return `rounded-[${arbitrary}]`;
  }, [cssValue]);

  if (!state) return null;

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Left Column: Controls */}
      <Card className="shadow-sm flex flex-col gap-4 p-4 lg:p-5">
        <header className="flex items-center justify-between">
          <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">圆角设置</h2>
          <Button variant="ghost" size="sm" onClick={reset} className="h-7 px-2 text-[11px]">
            <RefreshCw className="h-3 w-3 mr-1.5" />
            重置
          </Button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CornerControl
            label="左上角 (Top Left)"
            value={state.topLeft}
            onUpdate={(updates) => updateCorner('topLeft', updates)}
          />
          <CornerControl
            label="右上角 (Top Right)"
            value={state.topRight}
            onUpdate={(updates) => updateCorner('topRight', updates)}
          />
          <CornerControl
            label="右下角 (Bottom Right)"
            value={state.bottomRight}
            onUpdate={(updates) => updateCorner('bottomRight', updates)}
          />
          <CornerControl
            label="左下角 (Bottom Left)"
            value={state.bottomLeft}
            onUpdate={(updates) => updateCorner('bottomLeft', updates)}
          />
        </div>

        <div className="text-[11px] text-muted-foreground mt-2">
          <p>提示：点击小锁图标可以独立调整水平和垂直半径，制作椭圆圆角。</p>
        </div>
      </Card>

      {/* Right Column: Preview & Code */}
      <Card className="shadow-sm flex flex-col gap-4 p-4 lg:p-5">
        <header>
          <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">预览 & 代码</h2>
        </header>

        <div className="rounded-lg border bg-background/50 p-8 sm:p-16 flex items-center justify-center min-h-[300px]">
          <div
            className="w-full max-w-[240px] aspect-square bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl flex items-center justify-center text-white font-medium transition-all duration-300 border-4 border-white/20"
            style={{ borderRadius: cssValue }}
          >
            <div className="text-center">
              <div className="text-2xl font-bold mb-1"></div>
              <div className="text-xs opacity-80"></div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="css" className="flex-1 flex flex-col">
          <TabsList className="w-max">
            <TabsTrigger value="css" className="text-xs">
              CSS
            </TabsTrigger>
            <TabsTrigger value="tailwind" className="text-xs">
              Tailwind
            </TabsTrigger>
          </TabsList>

          <TabsContent value="css" className="flex-1 mt-2">
            <CodeArea code={cssCode} language="css" />
          </TabsContent>

          <TabsContent value="tailwind" className="flex-1 mt-2">
            <CodeArea code={tailwindCode} language="html" />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
