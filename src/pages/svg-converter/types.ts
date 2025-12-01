export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export interface ConversionParams {
  width: number;
  height: number;
  format: OutputFormat;
  backgroundColor: string;
  useTransparent: boolean;
}

export interface ConversionResult {
  blob?: Blob;
  url?: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

export interface SvgItem {
  id: string;
  file: File;
  content: string; // SVG string content
  originalWidth: number;
  originalHeight: number;

  // 如果为 undefined，则使用全局参数
  // 如果不为 undefined，则覆盖全局参数
  customParams?: Partial<ConversionParams>;

  result?: ConversionResult;
}

export type PresetType = 'original' | 'icon' | 'web' | 'social' | 'custom';

export interface PresetConfig {
  label: string;
  description: string;
  size?: number;
}
