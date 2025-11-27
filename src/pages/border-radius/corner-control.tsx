import { Lock, Unlock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export interface Corner {
  x: number;
  y: number;
  locked: boolean;
}

interface CornerControlProps {
  label: string;
  value: Corner;
  onUpdate: (updates: Partial<Corner>) => void;
}

export function CornerControl({ label, value, onUpdate }: CornerControlProps) {
  return (
    <div className="space-y-3 p-4 rounded-lg border bg-muted/20">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onUpdate({ locked: !value.locked })}
          title={value.locked ? 'Unlock X/Y' : 'Lock X/Y'}
        >
          {value.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
        </Button>
      </div>

      <div className="space-y-3">
        {/* Horizontal Radius (X) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>水平半径 (X)</span>
            <span>{value.x}px</span>
          </div>
          <div className="flex items-center gap-3">
            <Slider
              value={[value.x]}
              min={0}
              max={200}
              step={1}
              onValueChange={([val]) => onUpdate({ x: val })}
              className="flex-1"
            />
            <Input
              type="number"
              value={value.x}
              onChange={(e) => onUpdate({ x: Number(e.target.value) })}
              className="h-7 w-16 px-2 text-xs"
            />
          </div>
        </div>

        {/* Vertical Radius (Y) */}
        {!value.locked && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>垂直半径 (Y)</span>
              <span>{value.y}px</span>
            </div>
            <div className="flex items-center gap-3">
              <Slider
                value={[value.y]}
                min={0}
                max={200}
                step={1}
                onValueChange={([val]) => onUpdate({ y: val })}
                className="flex-1"
              />
              <Input
                type="number"
                value={value.y}
                onChange={(e) => onUpdate({ y: Number(e.target.value) })}
                className="h-7 w-16 px-2 text-xs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
