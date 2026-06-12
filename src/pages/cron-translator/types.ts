export type CronFormat = 'standard' | 'with-seconds';

export interface CronFormatInfo {
  value: CronFormat;
  label: string;
  fields: number;
  desc: string;
}

export const CRON_FORMATS: CronFormatInfo[] = [
  { value: 'standard', label: '标准 (5 字段)', fields: 5, desc: '分 时 日 月 周' },
  { value: 'with-seconds', label: '带秒 (6 字段)', fields: 6, desc: '秒 分 时 日 月 周' },
];

export interface CronField {
  /** 字段名（中文） */
  name: string;
  /** 原始值 */
  value: string;
  /** 取值范围说明 */
  range: string;
}

export interface ParseResult {
  /** 自然语言翻译（中文） */
  description: string;
  /** 字段拆解 */
  fields: CronField[];
  /** 未来 5 次执行时间（毫秒时间戳） */
  nextRuns: number[];
}

export interface ParseError {
  message: string;
}

export interface CronTemplate {
  /** i18n key（位于 tools 命名空间 cronTranslator.templates 下） */
  i18nKey: string;
  label: string;
  /** 标准 5 字段表达式 */
  standard: string;
  /** 带秒 6 字段表达式 */
  withSeconds: string;
}

/** 常用模板 */
export const CRON_TEMPLATES: CronTemplate[] = [
  { i18nKey: 'everyMinute', label: '每分钟', standard: '* * * * *', withSeconds: '0 * * * * *' },
  { i18nKey: 'every5Minutes', label: '每 5 分钟', standard: '*/5 * * * *', withSeconds: '0 */5 * * * *' },
  { i18nKey: 'hourly', label: '每小时整点', standard: '0 * * * *', withSeconds: '0 0 * * * *' },
  { i18nKey: 'daily', label: '每天 0 点', standard: '0 0 * * *', withSeconds: '0 0 0 * * *' },
  { i18nKey: 'workdays9am', label: '工作日早 9 点', standard: '0 9 * * 1-5', withSeconds: '0 0 9 * * 1-5' },
  { i18nKey: 'monday9am', label: '每周一 9 点', standard: '0 9 * * 1', withSeconds: '0 0 9 * * 1' },
  { i18nKey: 'monthly1st', label: '每月 1 号 0 点', standard: '0 0 1 * *', withSeconds: '0 0 0 1 * *' },
  { i18nKey: 'yearlyJan1', label: '每年 1 月 1 日 0 点', standard: '0 0 1 1 *', withSeconds: '0 0 0 1 1 *' },
];

export const DEFAULT_EXPRESSION = '0 9 * * 1-5';
export const NEXT_RUNS_COUNT = 5;
