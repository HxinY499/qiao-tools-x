// 主题配置 - 按需加载

export type ThemeName = 'github' | 'newsprint' | 'night' | 'vercel';

export interface ThemeMeta {
  name: ThemeName;
  label: string;
}

// 主题元数据（不包含样式，体积很小）
export const THEME_LIST: ThemeMeta[] = [
  { name: 'github', label: 'GitHub' },
  { name: 'newsprint', label: '报纸印刷' },
  { name: 'night', label: '暗夜' },
  { name: 'vercel', label: 'Vercel' },
];

// 主题加载器 - 按需动态导入
const themeLoaders: Record<ThemeName, () => Promise<{ style: string }>> = {
  github: () => import('./github'),
  newsprint: () => import('./newsprint'),
  night: () => import('./night'),
  vercel: () => import('./vercel'),
};

// 主题缓存
const themeCache = new Map<ThemeName, string>();

/**
 * 加载主题样式（带缓存）
 */
export async function loadThemeStyle(name: ThemeName): Promise<string> {
  // 先检查缓存
  const cached = themeCache.get(name);
  if (cached) return cached;

  // 动态加载
  const loader = themeLoaders[name];
  if (!loader) return '';

  const module = await loader();
  const style = module.style;

  // 缓存结果
  themeCache.set(name, style);

  return style;
}

/**
 * 获取主题标签
 */
export function getThemeLabel(name: ThemeName): string {
  return THEME_LIST.find((t) => t.name === name)?.label || name;
}
