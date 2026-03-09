import { describe, expect, it } from 'vitest';

import { getThemeLabel, getThemesByCategory, THEME_LIST } from './index';

describe('THEME_LIST', () => {
  it('应包含多个主题', () => {
    expect(THEME_LIST.length).toBeGreaterThan(0);
  });

  it('每个主题应有 name、label、isDark', () => {
    THEME_LIST.forEach((theme) => {
      expect(theme.name).toBeTruthy();
      expect(theme.label).toBeTruthy();
      expect(typeof theme.isDark).toBe('boolean');
    });
  });

  it('亮色暗色应成对存在', () => {
    const lightCount = THEME_LIST.filter((t) => !t.isDark).length;
    const darkCount = THEME_LIST.filter((t) => t.isDark).length;
    expect(lightCount).toBe(darkCount);
  });
});

describe('getThemeLabel', () => {
  it('已知主题应返回 label', () => {
    expect(getThemeLabel('github-light')).toBe('GitHub Light');
    expect(getThemeLabel('github-dark')).toBe('GitHub Dark');
    expect(getThemeLabel('notion-style-light')).toBe('Notion Style Light');
  });

  it('未知主题应返回 name 本身', () => {
    expect(getThemeLabel('unknown-theme' as any)).toBe('unknown-theme');
  });
});

describe('getThemesByCategory', () => {
  it('应返回 light 和 dark 两个分类', () => {
    const categories = getThemesByCategory();
    expect(categories).toHaveProperty('light');
    expect(categories).toHaveProperty('dark');
  });

  it('light 分类不应包含暗色主题', () => {
    const { light } = getThemesByCategory();
    light.forEach((t) => expect(t.isDark).toBe(false));
  });

  it('dark 分类不应包含亮色主题', () => {
    const { dark } = getThemesByCategory();
    dark.forEach((t) => expect(t.isDark).toBe(true));
  });

  it('所有主题应被分到某一类', () => {
    const { light, dark } = getThemesByCategory();
    expect(light.length + dark.length).toBe(THEME_LIST.length);
  });
});
