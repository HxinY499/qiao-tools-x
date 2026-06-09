/**
 * 精选的 figlet 字体列表（从 figlet/importable-fonts 中挑选）。
 * 选择标准：风格多样、视觉效果好、字符宽度合理（避免太宽超出预览框）。
 */
export const FONT_LIST = [
  'Standard',
  'ANSI Shadow',
  'Big',
  'Block',
  'Bloody',
  'Bubble',
  'Cyberlarge',
  'Doom',
  'Ghost',
  'Graffiti',
  'Isometric1',
  'Larry 3D',
  'Slant',
  'Small',
  'Speed',
  'Star Wars',
  'Sub-Zero',
  'Univers',
] as const;

export type FontName = (typeof FONT_LIST)[number];

export const DEFAULT_FONT: FontName = 'ANSI Shadow';

/** 随机预置示例文案（点击"换一个"时随机一句） */
export const SAMPLE_TEXTS = [
  'Hello',
  'Coding',
  'Bug Free',
  'Ship It',
  'TODO',
  'WIP',
  'It Works',
  'Friday',
  'LGTM',
  '404',
  'Vite',
  'React',
];
