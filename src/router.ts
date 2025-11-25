import type { LucideIcon } from 'lucide-react';
import { ImageIcon, ScrollText } from 'lucide-react';
import type { ComponentType } from 'react';
import { lazy } from 'react';

const ImageCompressorPage = lazy(() => import('@/pages/image-compressor'));
const ScrollBarPage = lazy(() => import('@/pages/scroll-bar'));

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
    title: 'ImageCompressor',
    subtitle: '在线图片压缩与尺寸调整工具，支持实时预览与参数调节',
    icon: ImageIcon,
    component: ImageCompressorPage,
  },
  {
    path: '/scroll-bar',
    label: '滚动条生成器',
    title: '滚动条样式可视化',
    subtitle: '可视化调整滚动条样式，并生成可复制的 CSS 代码',
    icon: ScrollText,
    component: ScrollBarPage,
  },
];
