import type { LucideIcon } from 'lucide-react';
import {
  Braces,
  CalendarClock,
  Circle,
  Fingerprint,
  ImageIcon,
  Link,
  Palette,
  Rainbow,
  ScrollText,
  Square,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { lazy } from 'react';

const ImageCompressorPage = lazy(() => import('@/pages/image-compressor'));
const ScrollBarPage = lazy(() => import('@/pages/scroll-bar'));
const ColorConverterPage = lazy(() => import('@/pages/color-converter'));
const BoxShadowPage = lazy(() => import('@/pages/box-shadow'));
const GradientGeneratorPage = lazy(() => import('@/pages/gradient-generator'));
const Base64ToolPage = lazy(() => import('@/pages/base64'));
const TimestampConverterPage = lazy(() => import('@/pages/timestamp-converter'));
const UrlEncoderPage = lazy(() => import('@/pages/url-encoder'));
const UUIDGeneratorPage = lazy(() => import('@/pages/uuid-generator'));

export type ToolCategory = 'image' | 'css' | 'dev' | 'other';

export type ToolRoute = {
  path: string;
  label: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  component: ComponentType;
  category: ToolCategory;
};

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  image: '图片工具',
  css: '样式工具',
  dev: '开发工具',
  other: '其他工具',
};

export const toolRoutes: ToolRoute[] = [
  {
    path: '/image-compressor',
    label: '图片压缩工具',
    title: 'Image Compressor',
    subtitle: '在线图片压缩与尺寸调整工具，支持实时预览与参数调节',
    icon: ImageIcon,
    component: ImageCompressorPage,
    category: 'image',
  },
  {
    path: '/scroll-bar',
    label: '滚动条生成器',
    title: 'Scorllbar Style Generator',
    subtitle: '可视化调整滚动条样式，并生成可复制的 CSS 代码',
    icon: ScrollText,
    component: ScrollBarPage,
    category: 'css',
  },
  {
    path: '/box-shadow',
    label: '阴影生成器',
    title: 'Box Shadow Generator',
    subtitle: '可视化叠加多层阴影，并一键生成 CSS 与 Tailwind 代码',
    icon: Square,
    component: BoxShadowPage,
    category: 'css',
  },
  {
    path: '/gradient-generator',
    label: '渐变生成器',
    title: 'CSS Gradient Generator',
    subtitle: '可视化创建 linear/radial 渐变，支持多色断点与角度调整，并生成 CSS 与 Tailwind 类名',
    icon: Rainbow,
    component: GradientGeneratorPage,
    category: 'css',
  },
  {
    path: '/color-converter',
    label: '颜色格式转换',
    title: 'Color Converter',
    subtitle: '在线颜色格式转换工具，支持 Hex、RGB/RGBA、HSL/HSLA 格式互转',
    icon: Palette,
    component: ColorConverterPage,
    category: 'css',
  },
  {
    path: '/timestamp-converter',
    label: '时间戳转换',
    title: 'Timestamp Converter',
    subtitle: '时间戳与日期时间互转，支持多种常用格式并可快速复制当前时间',
    icon: CalendarClock,
    component: TimestampConverterPage,
    category: 'dev',
  },
  {
    path: '/json-formatter',
    label: 'JSON 格式化',
    title: 'JSON Formatter',
    subtitle: 'JSON 美化、压缩、语法高亮与错误检测工具',
    icon: Braces,
    component: lazy(() => import('@/pages/json-formatter')),
    category: 'dev',
  },
  {
    path: '/border-radius',
    title: 'Border Radius Generator',
    label: '圆角生成器',
    component: lazy(() => import('./pages/border-radius')),
    icon: Circle,
    category: 'css',
  },
  {
    path: '/url-encoder',
    label: 'URL 编解码',
    title: 'URL Encoder / Decoder',
    subtitle: 'URL 编码/解码工具，支持 URL 参数解析与可视化展示',
    icon: Link,
    component: UrlEncoderPage,
    category: 'dev',
  },
  {
    path: '/base64',
    label: 'Base64 编解码',
    title: 'Base64 编解码',
    subtitle:
      '在文本模式下支持普通文本与 Base64 间互转，在图片模式下可将本地图片转换为 Base64 Data URL，方便内联到 CSS 或 HTML 中',
    icon: Square,
    component: Base64ToolPage,
    category: 'dev',
  },
  {
    path: '/uuid-generator',
    label: 'UUID 生成器',
    title: 'UUID Generator',
    subtitle: '在线批量生成 UUID/GUID，支持自定义格式（大小写、连字符）与历史记录功能',
    icon: Fingerprint,
    component: UUIDGeneratorPage,
    category: 'dev',
  },
];
