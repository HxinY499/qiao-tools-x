import type { LucideIcon } from 'lucide-react';
import { ImageIcon, Palette, ScrollText } from 'lucide-react';
import type { ComponentType } from 'react';
import { lazy } from 'react';

const ImageCompressorPage = lazy(() => import('@/pages/image-compressor'));
const ScrollBarPage = lazy(() => import('@/pages/scroll-bar'));
const ColorConverterPage = lazy(() => import('@/pages/color-converter'));

export type ToolRoute = {
  path: string;
  label: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  component: ComponentType;
};

export const toolRoutes: ToolRoute[] = [
  {
    path: '/image-compressor',
    label: '图片压缩工具',
    title: 'Image Compressor',
    subtitle: '在线图片压缩与尺寸调整工具，支持实时预览与参数调节',
    icon: ImageIcon,
    component: ImageCompressorPage,
  },
  {
    path: '/scroll-bar',
    label: '滚动条生成器',
    title: 'Scorllbar Style Generator',
    subtitle: '可视化调整滚动条样式，并生成可复制的 CSS 代码',
    icon: ScrollText,
    component: ScrollBarPage,
  },
  {
    path: '/color-converter',
    label: '颜色格式转换',
    title: 'Color Converter',
    subtitle: '在线颜色格式转换工具，支持 Hex、RGB/RGBA、HSL/HSLA 格式互转',
    icon: Palette,
    component: ColorConverterPage,
  },
];
