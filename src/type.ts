import type { LucideIcon } from 'lucide-react';
import { ComponentType } from 'react';

export type ToolCategory = 'image' | 'css' | 'dev' | 'text' | 'life' | 'other';

export enum ToolKey {
  ImageCompressor = 'image-compressor',
  ImageWatermark = 'image-watermark',
  SvgConverter = 'svg-converter',
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
  TextDiff = 'text-diff',
  TextEscaper = 'text-escaper',
  PasswordGenerator = 'password-generator',
  SeoAnalyzer = 'seo-analyzer',
  UserAgentParser = 'user-agent-parser',
  QRCodeTool = 'qrcode-tool',
  JsonSchemaConverter = 'json-schema-converter',
  RegexVisualizer = 'regex-visualizer',
  MarkdownEditor = 'markdown-editor',
}

export type ToolRoute = {
  key: ToolKey;
  path: string;
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
