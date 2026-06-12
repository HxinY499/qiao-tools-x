// 只引入中文 locale（~4KB），比 cronstrue/i18n（~130KB 含全部语言）小一个数量级
import 'cronstrue/locales/zh_CN';

import { CronExpressionParser } from 'cron-parser';
import cronstrue from 'cronstrue';

import { type CronField, type CronFormat, NEXT_RUNS_COUNT, type ParseResult } from './types';

/** 标准 5 字段的字段定义 */
const FIELDS_5: Array<{ name: string; range: string }> = [
  { name: '分钟', range: '0-59' },
  { name: '小时', range: '0-23' },
  { name: '日', range: '1-31' },
  { name: '月', range: '1-12 (或 JAN-DEC)' },
  { name: '周', range: '0-7 (0/7=周日)' },
];

/** 带秒 6 字段的字段定义 */
const FIELDS_6: Array<{ name: string; range: string }> = [{ name: '秒', range: '0-59' }, ...FIELDS_5];

/**
 * 按空格切分并去除多余空白，返回字段数组。
 */
function splitFields(expr: string): string[] {
  return expr.trim().split(/\s+/);
}

/**
 * 自动检测字段数（5 或 6）。
 * 7 字段及以上返回 -1（不支持）。
 */
export function detectFormat(expr: string): CronFormat | null {
  const parts = splitFields(expr);
  if (parts.length === 5) return 'standard';
  if (parts.length === 6) return 'with-seconds';
  return null;
}

/**
 * 解析 cron 表达式：返回翻译、字段拆解、未来 N 次执行时间。
 * 解析失败时抛出错误（调用方需要 try/catch）。
 */
export function parseCron(expr: string, format: CronFormat): ParseResult {
  const trimmed = expr.trim();
  if (!trimmed) {
    throw new Error('请输入 cron 表达式');
  }

  // 字段数校验
  const parts = splitFields(trimmed);
  const expectedFields = format === 'standard' ? 5 : 6;
  if (parts.length !== expectedFields) {
    throw new Error(`当前格式需要 ${expectedFields} 个字段，但收到 ${parts.length} 个`);
  }

  // 1) 自然语言翻译（cronstrue 自动识别字段数，无需额外参数）
  let description: string;
  try {
    description = cronstrue.toString(trimmed, { locale: 'zh_CN' });
  } catch (err) {
    throw new Error(`无法翻译：${err instanceof Error ? err.message : String(err)}`);
  }

  // 2) 字段拆解
  const fieldDefs = format === 'standard' ? FIELDS_5 : FIELDS_6;
  const fields: CronField[] = fieldDefs.map((def, i) => ({
    name: def.name,
    value: parts[i],
    range: def.range,
  }));

  // 3) 未来 N 次执行 —— cron-parser 通过字段数自动识别
  let nextRuns: number[] = [];
  try {
    const interval = CronExpressionParser.parse(trimmed, { currentDate: new Date() });
    nextRuns = interval.take(NEXT_RUNS_COUNT).map((d) => d.toDate().getTime());
  } catch (err) {
    // cron-parser 解析失败不影响翻译结果，仅留空 nextRuns
    console.warn('[cron-translator] next-runs computation failed:', err);
  }

  return { description, fields, nextRuns };
}

/**
 * 格式化未来执行时间显示：
 * - 日期 + 周几 + 时间
 * - 与"现在"的相对距离（如 "3 天后"、"2 小时后"）
 */
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function formatNextRun(ts: number, withSeconds: boolean): { absolute: string; relative: string } {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const time = withSeconds ? `${h}:${mi}:${s}` : `${h}:${mi}`;
  const absolute = `${y}-${m}-${day} (${WEEKDAYS[d.getDay()]}) ${time}`;

  const diffMs = ts - Date.now();
  const relative = formatRelative(diffMs);
  return { absolute, relative };
}

function formatRelative(diffMs: number): string {
  if (diffMs <= 0) return '即将';
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec} 秒后`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟后`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时后`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day} 天后`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month} 个月后`;
  const year = Math.floor(day / 365);
  return `${year} 年后`;
}
