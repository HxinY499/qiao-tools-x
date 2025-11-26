import type { LucideIcon } from 'lucide-react';
import { ImageIcon, Palette, Rainbow, ScrollText, Square } from 'lucide-react';
import type { ComponentType } from 'react';
import { lazy } from 'react';

const ImageCompressorPage = lazy(() => import('@/pages/image-compressor'));
const ScrollBarPage = lazy(() => import('@/pages/scroll-bar'));
const ColorConverterPage = lazy(() => import('@/pages/color-converter'));
const BoxShadowPage = lazy(() => import('@/pages/box-shadow'));
const GradientGeneratorPage = lazy(() => import('@/pages/gradient-generator'));
const Base64ToolPage = lazy(() => import('@/pages/base64'));

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
    path: '/box-shadow',
    label: '阴影生成器',
    title: 'Box Shadow Generator',
    subtitle: '可视化叠加多层阴影，并一键生成 CSS 与 Tailwind 代码',
    icon: Square,
    component: BoxShadowPage,
  },
  {
    path: '/gradient-generator',
    label: 'CSS 渐变生成器',
    title: 'CSS Gradient Generator',
    subtitle: '可视化创建 linear/radial 渐变，支持多色断点与角度调整，并生成 CSS 与 Tailwind 类名',
    icon: Rainbow,
    component: GradientGeneratorPage,
  },
  {
    path: '/color-converter',
    label: '颜色格式转换',
    title: 'Color Converter',
    subtitle: '在线颜色格式转换工具，支持 Hex、RGB/RGBA、HSL/HSLA 格式互转',
    icon: Palette,
    component: ColorConverterPage,
  },
  {
    path: '/base64',
    label: 'Base64 编解码',
    title: 'Base64 编解码',
    subtitle:
      '在文本模式下支持普通文本与 Base64 间互转，在图片模式下可将本地图片转换为 Base64 Data URL，方便内联到 CSS 或 HTML 中',
    icon: Square,
    component: Base64ToolPage,
  },
];
