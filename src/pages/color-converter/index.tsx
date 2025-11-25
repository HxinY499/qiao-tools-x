import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { HexAlphaColorPicker } from 'react-colorful';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

import { useColorConverterStore } from './store';

function ColorConverterPage() {
  const { color, setColor, setFromHex, setFromHSL, getHex, getHSL } = useColorConverterStore();

  // 获取各种格式的颜色值
  const hexValue = getHex();
  const hslValue = getHSL();
  const rgbaValue = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a.toFixed(2)})`;
  const hslaValue = `hsla(${hslValue.h}, ${hslValue.s}%, ${hslValue.l}%, ${hslValue.a.toFixed(2)})`;

  // 本地输入状态（用于实时显示用户输入）
  const [hexInput, setHexInput] = useState(hexValue);
  const [hexError, setHexError] = useState('');

  // 复制状态
  const [copiedHex, setCopiedHex] = useState(false);
  const [copiedRgb, setCopiedRgb] = useState(false);
  const [copiedHsl, setCopiedHsl] = useState(false);

  // 同步 hexValue 到 hexInput
  useEffect(() => {
    setHexInput(hexValue);
    setHexError('');
  }, [hexValue]);

  // 更新页面背景色
  useEffect(() => {
    const rgba = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
    document.body.style.backgroundColor = rgba;

    // 清理函数：组件卸载时恢复默认背景色
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [color]);

  // 复制到剪贴板
  const copyToClipboard = async (text: string, type: 'hex' | 'rgb' | 'hsl') => {
    try {
      await navigator.clipboard.writeText(text);
      // 设置对应的复制状态
      if (type === 'hex') {
        setCopiedHex(true);
        setTimeout(() => setCopiedHex(false), 2000);
      } else if (type === 'rgb') {
        setCopiedRgb(true);
        setTimeout(() => setCopiedRgb(false), 2000);
      } else if (type === 'hsl') {
        setCopiedHsl(true);
        setTimeout(() => setCopiedHsl(false), 2000);
      }
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 处理 Hex 输入变化
  const handleHexChange = (value: string) => {
    setHexInput(value);

    // 验证 Hex 格式（支持 3/4/6/8 位）
    const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

    if (!value) {
      setHexError('请输入颜色值');
      return;
    }

    if (!value.startsWith('#')) {
      setHexError('必须以 # 开头');
      return;
    }

    const validLengths = [4, 5, 7, 9]; // 包含 # 的总长度
    if (!validLengths.includes(value.length)) {
      setHexError('长度必须为 4/5/7/9 位（含 #）');
      return;
    }

    if (!hexRegex.test(value)) {
      setHexError('格式不正确，仅支持 0-9 和 A-F');
      return;
    }

    // 格式正确，更新颜色
    setHexError('');
    setFromHex(value);
  };

  // 处理 RGB 输入变化
  const handleRGBChange = (key: 'r' | 'g' | 'b', value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num <= 255) {
      setColor({ [key]: num });
    }
  };

  // 处理 Alpha 输入变化
  const handleAlphaChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 1) {
      setColor({ a: num });
    }
  };

  // 处理 HSL 输入变化
  const handleHSLChange = (key: 'h' | 's' | 'l', value: string) => {
    const num = parseInt(value, 10);
    const hsl = getHSL();
    const maxValues = { h: 360, s: 100, l: 100 };

    if (!isNaN(num) && num >= 0 && num <= maxValues[key]) {
      setFromHSL({ ...hsl, [key]: num });
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 pb-5 lg:py-8">
      {/* 颜色选择器和预览区域 */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 颜色选择器 */}
          <div className="flex justify-center items-center">
            <HexAlphaColorPicker
              color={hexValue}
              onChange={(hex) => setFromHex(hex)}
              style={{ width: '100%', maxWidth: '280px' }}
            />
          </div>

          {/* 颜色预览 */}
          <div>
            <div
              className="w-full h-[200px] rounded-lg border relative overflow-hidden"
              style={{
                backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
              }}
            >
              {hexError && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    颜色格式不正确
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 三个颜色格式面板 - 响应式网格布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hex 格式 */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold">Hex</h3>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(hexValue, 'hex')} className="h-8 px-2">
              {copiedHex ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div>
            <Input
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#FF5733"
              className={`font-mono text-sm ${hexError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {hexError ? (
              <p className="text-xs text-red-500 mt-2">{hexError}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">支持 3/4/6/8 位格式（如 #333 或 #FF5733）</p>
            )}
          </div>
        </div>

        {/* RGB/RGBA 格式 */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold">RGB / RGBA</h3>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(rgbaValue, 'rgb')} className="h-8 px-2">
              {copiedRgb ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="p-2 rounded-lg bg-muted my-2">
            <p className="text-xs font-mono break-all">{rgbaValue}</p>
          </div>
          <div className="space-y-3">
            {/* R */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="rgb-r" className="text-xs">
                  R
                </Label>
                <Input
                  id="rgb-r"
                  type="number"
                  min="0"
                  max="255"
                  value={color.r}
                  onChange={(e) => handleRGBChange('r', e.target.value)}
                  className="w-22 h-7 text-xs text-center"
                />
              </div>
              <Slider
                value={[color.r]}
                onValueChange={([value]) => setColor({ r: value })}
                min={0}
                max={255}
                step={1}
              />
            </div>

            {/* G */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="rgb-g" className="text-xs">
                  G
                </Label>
                <Input
                  id="rgb-g"
                  type="number"
                  min="0"
                  max="255"
                  value={color.g}
                  onChange={(e) => handleRGBChange('g', e.target.value)}
                  className="w-22 h-7 text-xs text-center"
                />
              </div>
              <Slider
                value={[color.g]}
                onValueChange={([value]) => setColor({ g: value })}
                min={0}
                max={255}
                step={1}
              />
            </div>

            {/* B */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="rgb-b" className="text-xs">
                  B
                </Label>
                <Input
                  id="rgb-b"
                  type="number"
                  min="0"
                  max="255"
                  value={color.b}
                  onChange={(e) => handleRGBChange('b', e.target.value)}
                  className="w-22 h-7 text-xs text-center"
                />
              </div>
              <Slider
                value={[color.b]}
                onValueChange={([value]) => setColor({ b: value })}
                min={0}
                max={255}
                step={1}
              />
            </div>

            {/* A */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="rgb-a" className="text-xs">
                  A
                </Label>
                <Input
                  id="rgb-a"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={color.a.toFixed(2)}
                  onChange={(e) => handleAlphaChange(e.target.value)}
                  className="w-22 h-7 text-xs text-center"
                />
              </div>
              <Slider
                value={[color.a * 100]}
                onValueChange={([value]) => setColor({ a: value / 100 })}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>
        </div>

        {/* HSL/HSLA 格式 */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold">HSL / HSLA</h3>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(hslaValue, 'hsl')} className="h-8 px-2">
              {copiedHsl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="p-2 rounded-lg bg-muted my-2">
            <p className="text-xs font-mono break-all">{hslaValue}</p>
          </div>
          <div className="space-y-3">
            {/* H */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="hsl-h" className="text-xs">
                  H
                </Label>
                <Input
                  id="hsl-h"
                  type="number"
                  min="0"
                  max="360"
                  value={hslValue.h}
                  onChange={(e) => handleHSLChange('h', e.target.value)}
                  className="w-22 h-7 text-xs text-center"
                />
              </div>
              <Slider
                value={[hslValue.h]}
                onValueChange={([value]) => setFromHSL({ ...hslValue, h: value })}
                min={0}
                max={360}
                step={1}
              />
            </div>

            {/* S */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="hsl-s" className="text-xs">
                  S
                </Label>
                <Input
                  id="hsl-s"
                  type="number"
                  min="0"
                  max="100"
                  value={hslValue.s}
                  onChange={(e) => handleHSLChange('s', e.target.value)}
                  className="w-22 h-7 text-xs text-center"
                />
              </div>
              <Slider
                value={[hslValue.s]}
                onValueChange={([value]) => setFromHSL({ ...hslValue, s: value })}
                min={0}
                max={100}
                step={1}
              />
            </div>

            {/* L */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="hsl-l" className="text-xs">
                  L
                </Label>
                <Input
                  id="hsl-l"
                  type="number"
                  min="0"
                  max="100"
                  value={hslValue.l}
                  onChange={(e) => handleHSLChange('l', e.target.value)}
                  className="w-22 h-7 text-xs text-center"
                />
              </div>
              <Slider
                value={[hslValue.l]}
                onValueChange={([value]) => setFromHSL({ ...hslValue, l: value })}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ColorConverterPage;
