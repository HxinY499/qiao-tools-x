import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enRoutes from './locales/en/routes.json';
import enTools from './locales/en/tools.json';
import enToolPage from './locales/en/toolPage.json';
import zhCommon from './locales/zh-CN/common.json';
import zhRoutes from './locales/zh-CN/routes.json';
import zhTools from './locales/zh-CN/tools.json';
import zhToolPage from './locales/zh-CN/toolPage.json';

export const SUPPORTED_LANGUAGES = ['zh-CN', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'zh-CN';
const STORAGE_KEY = 'qiao-tools-x-lang';

/** 解析初始语言：localStorage 优先，其次浏览器语言，最后回退默认 */
function resolveInitialLanguage(): SupportedLanguage {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
    return saved as SupportedLanguage;
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : '';
  if (nav.startsWith('zh')) return 'zh-CN';
  if (nav.startsWith('en')) return 'en';
  return DEFAULT_LANGUAGE;
}

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': {
      common: zhCommon,
      routes: zhRoutes,
      toolPage: zhToolPage,
      tools: zhTools,
    },
    en: {
      common: enCommon,
      routes: enRoutes,
      toolPage: enToolPage,
      tools: enTools,
    },
  },
  ns: ['common', 'routes', 'toolPage', 'tools'],
  lng: resolveInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: 'common',
  interpolation: {
    escapeValue: false, // React 已自带 XSS 转义
  },
  react: {
    // 资源同步内联，无需 Suspense；后续按工具懒加载 namespace 时再开启
    useSuspense: false,
  },
});

// 语言切换时持久化到 localStorage，并同步 <html lang>
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
});

// 初始化时同步一次 <html lang>
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language;
}

export default i18n;
