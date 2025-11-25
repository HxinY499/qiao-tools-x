import { create } from 'zustand';

const THEME_STORAGE_KEY = 'qiao-tools-theme-setting';

export type ThemeSetting = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function computeEffectiveTheme(setting: ThemeSetting): EffectiveTheme {
  if (setting === 'light') return 'light';
  if (setting === 'dark') return 'dark';
  return getSystemPrefersDark() ? 'dark' : 'light';
}

function readStoredSetting(): ThemeSetting {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

function applyThemeToDocument(theme: EffectiveTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (!root) return;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

const initialThemeSetting: ThemeSetting = readStoredSetting();
const initialEffectiveTheme: EffectiveTheme = computeEffectiveTheme(initialThemeSetting);

applyThemeToDocument(initialEffectiveTheme);

export type ThemeState = {
  themeSetting: ThemeSetting;
  effectiveTheme: EffectiveTheme;
  initialized: boolean;
  setThemeSetting: (next: ThemeSetting) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  themeSetting: initialThemeSetting,
  effectiveTheme: initialEffectiveTheme,
  initialized: true,
  setThemeSetting: (next) => {
    const effective = computeEffectiveTheme(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    }
    applyThemeToDocument(effective);
    set({ themeSetting: next, effectiveTheme: effective, initialized: true });
  },
}));

if (typeof window !== 'undefined' && window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = (event: MediaQueryListEvent) => {
    const state = useThemeStore.getState();
    if (state.themeSetting !== 'system') return;
    const nextEffective: EffectiveTheme = event.matches ? 'dark' : 'light';
    applyThemeToDocument(nextEffective);
    useThemeStore.setState({ effectiveTheme: nextEffective, initialized: true });
  };
  mediaQuery.addEventListener('change', handleChange);
}
