import { ConversionParams, PresetConfig, PresetType } from './types';

export const PRESETS: Record<PresetType, PresetConfig> = {
  original: {
    label: '原始尺寸',
    description: '保持 SVG 原始宽高',
  },
  icon: {
    label: '图标尺寸',
    description: '64×64 像素，适合应用图标',
    size: 64,
  },
  web: {
    label: '网页尺寸',
    description: '512×512 像素，适合网页展示',
    size: 512,
  },
  social: {
    label: '社交媒体',
    description: '1024×1024 像素，适合头像/封面',
    size: 1024,
  },
  custom: {
    label: '自定义',
    description: '手动设置宽高',
  },
};

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '-';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

export async function parseSvgFile(file: File): Promise<{ content: string; width: number; height: number } | null> {
  try {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');

    if (!svgElement) return null;

    let width = parseFloat(svgElement.getAttribute('width') || '0');
    let height = parseFloat(svgElement.getAttribute('height') || '0');

    // 如果没有明确的 width/height，尝试从 viewBox 获取
    if (!width || !height) {
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);
        width = vbWidth || 300;
        height = vbHeight || 300;
      } else {
        // 如果都没有，给个默认值
        width = 300;
        height = 300;
      }
    }

    return { content: text, width, height };
  } catch (error) {
    console.error('SVG Parse Error:', error);
    return null;
  }
}

export async function convertSvgToImage(svgContent: string, params: ConversionParams): Promise<Blob> {
  const { width, height, format, backgroundColor, useTransparent } = params;

  if (width <= 0 || height <= 0) {
    throw new Error('Invalid image dimensions');
  }

  // 1. SVG string -> Blob URL
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    // 2. Load image
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load SVG image'));
      img.src = url;
    });

    // 3. Draw to Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Failed to create canvas context');

    // Fill background if needed
    // JPEG always needs background. Other formats depend on useTransparent.
    if (!useTransparent || format === 'image/jpeg') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(img, 0, 0, width, height);

    // 4. Canvas -> Blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), format);
    });

    if (!blob) throw new Error('Canvas export failed');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
