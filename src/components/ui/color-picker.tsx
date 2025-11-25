import { useEffect, useRef, useState } from 'react';
import { HexAlphaColorPicker } from 'react-colorful';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils';

export type ColorPickerProps = {
  // 受控模式：传入 value + onChange
  value?: string;
  // 非受控模式：只传 defaultValue，内部维护状态
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
};

function normalizeHex(value: string, fallback = '#000000') {
  if (!value) return fallback;
  const v = value.trim();
  if (!v.startsWith('#')) return fallback;
  // 支持 #RGB/#RRGGBB 以及带透明度的 #RGBA/#RRGGBBAA
  if (v.length === 4 || v.length === 5 || v.length === 7 || v.length === 9) return v;
  return fallback;
}

function getTextColor(color: string | undefined) {
  if (!color || color === 'transparent') return undefined;
  const hex = normalizeHex(color, '');
  if (!hex) return undefined;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hex.length === 4 || hex.length === 5) {
    const rHex = hex[1] + hex[1];
    const gHex = hex[2] + hex[2];
    const bHex = hex[3] + hex[3];
    r = parseInt(rHex, 16);
    g = parseInt(gHex, 16);
    b = parseInt(bHex, 16);
  } else if (hex.length === 7 || hex.length === 9) {
    const rHex = hex.slice(1, 3);
    const gHex = hex.slice(3, 5);
    const bHex = hex.slice(5, 7);
    r = parseInt(rHex, 16);
    g = parseInt(gHex, 16);
    b = parseInt(bHex, 16);
  }

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000000' : '#ffffff';
}

export function ColorPicker({ value, defaultValue, onChange, className }: ColorPickerProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const currentValue = isControlled ? value! : internalValue;

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(currentValue);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // 保证 inputValue 始终和当前颜色值保持一致
  useEffect(() => {
    setInputValue(currentValue);
  }, [currentValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const previewColor = inputValue || 'transparent';
  const pickerColor = normalizeHex(inputValue);
  const textColor = getTextColor(previewColor);

  return (
    <div className={cn('relative inline-flex items-center gap-2', className)}>
      {/* <span className="h-5 w-5 shrink-0 rounded border bg-white shadow-sm" style={{ backgroundColor: previewColor }} /> */}
      <Input
        className={'h-7 text-xs'}
        style={{ backgroundColor: previewColor, color: textColor }}
        value={inputValue}
        onChange={(e) => {
          const v = e.target.value;
          setInputValue(v);
          if (!isControlled) {
            setInternalValue(v);
          }
          onChange?.(v);
        }}
        placeholder="#RRGGBB 或 transparent"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 px-2 text-[11px]"
        onClick={() => setOpen((prev) => !prev)}
      >
        选择
      </Button>
      {open && (
        <div
          ref={panelRef}
          className="absolute z-50 mt-2 right-0 rounded-md border bg-popover p-3 shadow-md flex flex-col gap-2"
        >
          <div className="text-[11px] text-muted-foreground">取色器</div>
          <div className="[&_.react-colorful]:w-40 [&_.react-colorful]:h-40">
            <HexAlphaColorPicker
              color={pickerColor}
              onChange={(hex) => {
                setInputValue(hex);
                if (!isControlled) {
                  setInternalValue(hex);
                }
                onChange?.(hex);
              }}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={() => setOpen(false)}
            >
              关闭
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ColorPicker;
