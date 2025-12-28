// 主题配置 - 按需加载

export type ThemeName =
  | 'github'
  | 'newsprint'
  | 'night'
  | 'vercel'
  | 'jetbrains-dark'
  | 'konayuki'
  | 'notion-style'
  | 'notion-style-dark'
  | 'scrolls'
  | 'scrolls-dark';

export interface ThemeMeta {
  name: ThemeName;
  label: string;
  /** 是否为暗色主题 */
  isDark: boolean;
}

// 主题元数据（不包含样式，体积很小）
export const THEME_LIST: ThemeMeta[] = [
  { name: 'notion-style', label: 'Notion Style', isDark: false },
  { name: 'github', label: 'GitHub', isDark: false },
  { name: 'newsprint', label: '报纸印刷', isDark: false },
  { name: 'vercel', label: 'Vercel', isDark: false },
  { name: 'konayuki', label: '小雪 Konayuki', isDark: false },
  { name: 'scrolls', label: '羊皮卷 Scrolls', isDark: false },
  { name: 'notion-style-dark', label: 'Notion Style Dark', isDark: true },
  { name: 'night', label: '暗夜', isDark: true },
  { name: 'jetbrains-dark', label: 'JetBrains Dark', isDark: true },
  { name: 'scrolls-dark', label: '羊皮卷 Scrolls Dark', isDark: true },
];

// 主题加载器 - 按需动态导入
const themeLoaders: Record<ThemeName, () => Promise<{ style: string }>> = {
  'github': () => import('./github'),
  'newsprint': () => import('./newsprint'),
  'night': () => import('./night'),
  'vercel': () => import('./vercel'),
  'jetbrains-dark': () => import('./jetbrains-dark'),
  'konayuki': () => import('./konayuki'),
  'notion-style': () => import('./notion-style'),
  'notion-style-dark': () => import('./notion-style-dark'),
  'scrolls': () => import('./scrolls'),
  'scrolls-dark': () => import('./scrolls-dark'),
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

/**
 * 按亮色/暗色分类主题
 */
export function getThemesByCategory() {
  return {
    light: THEME_LIST.filter((t) => !t.isDark),
    dark: THEME_LIST.filter((t) => t.isDark),
  };
}
