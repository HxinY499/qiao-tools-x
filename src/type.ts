import type { LucideIcon } from 'lucide-react';
import { ComponentType } from 'react';

export type ToolCategory = 'image' | 'css' | 'dev' | 'text' | 'life' | 'other';

export enum ToolKey {
  ImageCompressor = 'image-compressor',
  ImageWatermark = 'image-watermark',
  ScrollBar = 'scroll-bar',
  BoxShadow = 'box-shadow',
  GradientGenerator = 'gradient-generator',
  ColorConverter = 'color-converter',
  TimestampConverter = 'timestamp-converter',
  JsonFormatter = 'json-formatter',
  BorderRadius = 'border-radius',
  UrlEncoder = 'url-encoder',
  Base64 = 'base64',
  UuidGenerator = 'uuid-generator',
  WordCount = 'word-count',
  PasswordGenerator = 'password-generator',
}

export type ToolRoute = {
  key: ToolKey;
  path: string;
  label: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  component: ComponentType;
  category: ToolCategory;
  seo?: {
    description: string;
    keywords?: string;
  };
};
