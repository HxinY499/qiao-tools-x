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

/**
 * 字符间距（横向布局）。
 * - fitted: 字符紧贴（figlet 默认体验）
 * - universal smushing: 字符融合，更紧凑酷炫
 * - full: 字符之间留空，舒展
 */
export const KERNING_OPTIONS = [
  { value: 'fitted', label: '紧凑' },
  { value: 'universal smushing', label: '重叠' },
  { value: 'full', label: '宽松' },
] as const;

export type KerningValue = (typeof KERNING_OPTIONS)[number]['value'];
export const DEFAULT_KERNING: KerningValue = 'fitted';

/**
 * 边框装饰：包裹整个 ASCII 矩形（按最长行宽对齐）。
 * 每种边框由四角字符 + 上下横线 + 左右竖线组成。
 */
export interface BorderStyle {
  value: BorderValue;
  label: string;
  /** 四角字符 [tl, tr, bl, br]；none 时全部为空字符串 */
  corners: [string, string, string, string];
  horizontal: string;
  vertical: string;
  /** 边框与内容之间的内边距列数（左右各加几列空格） */
  padding: number;
}

export type BorderValue = 'none' | 'single' | 'double' | 'star';

export const BORDER_STYLES: BorderStyle[] = [
  { value: 'none', label: '无边框', corners: ['', '', '', ''], horizontal: '', vertical: '', padding: 0 },
  { value: 'single', label: '单线', corners: ['┌', '┐', '└', '┘'], horizontal: '─', vertical: '│', padding: 1 },
  { value: 'double', label: '双线', corners: ['╔', '╗', '╚', '╝'], horizontal: '═', vertical: '║', padding: 1 },
  { value: 'star', label: '星号', corners: ['*', '*', '*', '*'], horizontal: '*', vertical: '*', padding: 1 },
];

export const DEFAULT_BORDER: BorderValue = 'none';

/**
 * 注释格式（用于「复制为注释」下拉）。
 * - line: 逐行加前缀（// / # 等）
 * - block: 整段包在块注释里（/* *\/ / <!-- --> 等）
 */
export interface CommentFormat {
  key: string;
  label: string;
  type: 'line' | 'block';
  prefix: string;
  /** block 类型必填：起始/结束标记 */
  open?: string;
  close?: string;
}

export const COMMENT_FORMATS: CommentFormat[] = [
  { key: 'slash', label: '// 行注释 (JS/TS/Java/Go)', type: 'line', prefix: '// ' },
  { key: 'hash', label: '# 行注释 (Py/Sh/YAML)', type: 'line', prefix: '# ' },
  { key: 'block-c', label: '/* 块注释 */ (CSS/C-style)', type: 'block', prefix: '', open: '/*', close: '*/' },
  { key: 'block-html', label: '<!-- HTML 注释 -->', type: 'block', prefix: '', open: '<!--', close: '-->' },
];

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
