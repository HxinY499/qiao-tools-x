// 主题配置 - 按需加载

export type ThemeName =
  | 'github-light'
  | 'github-dark'
  | 'notion-style-light'
  | 'notion-style-dark'
  | 'scrolls-light'
  | 'scrolls-dark';

export interface ThemeMeta {
  name: ThemeName;
  label: string;
  /** 是否为暗色主题 */
  isDark: boolean;
}

// 主题元数据（不包含样式，体积很小）
export const THEME_LIST: ThemeMeta[] = [
  { name: 'notion-style-light', label: 'Notion Style Light', isDark: false },
  { name: 'notion-style-dark', label: 'Notion Style Dark', isDark: true },
  { name: 'github-light', label: 'GitHub Light', isDark: false },
  { name: 'github-dark', label: 'GitHub Dark', isDark: true },
  { name: 'scrolls-light', label: 'Scrolls Light', isDark: false },
  { name: 'scrolls-dark', label: 'Scrolls Dark', isDark: true },
];

// 主题加载器 - 按需动态导入（使用 ?raw 获取 CSS 原始内容）
const themeLoaders: Record<ThemeName, () => Promise<{ default: string }>> = {
  'notion-style-light': () => import('./notion-style-light.css?raw'),
  'notion-style-dark': () => import('./notion-style-dark.css?raw'),
  'github-light': () => import('./github-light.css?raw'),
  'github-dark': () => import('./github-dark.css?raw'),
  'scrolls-light': () => import('./scrolls-light.css?raw'),
  'scrolls-dark': () => import('./scrolls-dark.css?raw'),
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
  const style = module.default;

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
