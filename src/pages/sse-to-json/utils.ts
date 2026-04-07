/** data 块的类型 */
export type SseBlockType = 'json' | 'signal' | 'text';

export interface SseDataBlock {
  /** 原始 data 行内容（多行会用 \n 拼接） */
  raw: string;
  /** 解析后的 JSON 对象（非 json 类型为 null） */
  parsed: unknown | null;
  /** 格式化后的 JSON 字符串（仅 json 类型有值） */
  formatted?: string;
  /** 是否解析成功 */
  valid: boolean;
  /** 块类型：json（正常 JSON）、signal（[DONE] 等标记）、text（无法解析的文本） */
  type: SseBlockType;
  /** 解析失败时的错误信息 */
  error?: string;
  /** 块索引 */
  index: number;
  /** 该 data 所属的 event 类型 */
  event?: string;
  /** SSE id 字段 */
  id?: string;
  /** SSE retry 字段 */
  retry?: number;
}

export interface ParseResult {
  blocks: SseDataBlock[];
  validCount: number;
  invalidCount: number;
  signalCount: number;
}

/** 已知的 SSE 流结束/特殊信号标记 */
const KNOWN_SIGNALS = new Set(['[DONE]', '[END]', '[COMPLETE]']);

function isSignal(raw: string): boolean {
  return KNOWN_SIGNALS.has(raw);
}

/**
 * SSE 规范：字段值前如果有一个空格则去掉，否则原样保留
 */
function stripLeadingSpace(s: string): string {
  return s.startsWith(' ') ? s.slice(1) : s;
}

/**
 * 粗略判断文本是否像 SSE 数据
 * 要求至少出现 2 条 data: 行，或 1 条 data: 后跟 JSON 对象/数组
 */
export function looksLikeSse(text: string): boolean {
  const dataLines = text.match(/^data:\s*\S/gm);
  if (!dataLines) return false;
  if (dataLines.length >= 2) return true;
  // 只有一条 data: 时，要求内容看起来像 JSON
  return /^data:\s*[\[{]/m.test(text);
}

/**
 * 判断当前平台是否为 macOS
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /mac|iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * 按 SSE 规范从文本中提取事件块，支持多行 data 拼接
 */
export function parseSseToJson(sseText: string): ParseResult {
  if (!sseText.trim()) return { blocks: [], validCount: 0, invalidCount: 0, signalCount: 0 };

  const results: SseDataBlock[] = [];
  let blockIndex = 0;
  let validCount = 0;
  let invalidCount = 0;
  let signalCount = 0;

  // 按照 SSE 规范，事件之间用空行分隔
  // 但也要兼容没有空行的情况（每行 data: 独立成块）
  const lines = sseText.split('\n');

  // 累积当前事件块的字段
  let currentEvent: string | undefined;
  let currentId: string | undefined;
  let currentRetry: number | undefined;
  let dataLines: string[] = [];

  const flushBlock = () => {
    if (dataLines.length === 0) return;

    const raw = dataLines.join('\n');
    const block: SseDataBlock = {
      raw,
      parsed: null,
      valid: false,
      type: 'text',
      index: blockIndex++,
      event: currentEvent,
      id: currentId,
      retry: currentRetry,
    };

    if (isSignal(raw)) {
      block.type = 'signal';
      block.valid = true;
      signalCount++;
    } else {
      try {
        block.parsed = JSON.parse(raw);
        block.formatted = JSON.stringify(block.parsed, null, 2);
        block.valid = true;
        block.type = 'json';
        validCount++;
      } catch (e) {
        block.valid = false;
        block.type = 'text';
        block.error = e instanceof Error ? e.message : '解析失败';
        invalidCount++;
      }
    }

    results.push(block);
    dataLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // 空行：事件边界，flush 当前累积的数据
    if (trimmed === '') {
      flushBlock();
      // 空行后重置所有字段
      currentEvent = undefined;
      currentId = undefined;
      currentRetry = undefined;
      continue;
    }

    // 注释行，跳过
    if (trimmed.startsWith(':')) continue;

    // event: 字段
    if (trimmed.startsWith('event:')) {
      // 如果切换到新 event 前有未 flush 的 data，先 flush
      if (dataLines.length > 0) {
        flushBlock();
      }
      currentEvent = stripLeadingSpace(trimmed.slice(6)) || undefined;
      continue;
    }

    // id: 字段
    if (trimmed.startsWith('id:')) {
      currentId = stripLeadingSpace(trimmed.slice(3)) || undefined;
      continue;
    }

    // retry: 字段
    if (trimmed.startsWith('retry:')) {
      const val = parseInt(stripLeadingSpace(trimmed.slice(6)), 10);
      currentRetry = isNaN(val) ? undefined : val;
      continue;
    }

    // data: 字段 — 累积（支持多行 data 拼接）
    // SSE 规范：空 data: 行也要保留（拼接为空行），用于多行 JSON 等场景
    if (trimmed.startsWith('data:')) {
      dataLines.push(stripLeadingSpace(trimmed.slice(5)));
      continue;
    }
  }

  // 处理末尾未被空行 flush 的数据
  flushBlock();

  return { blocks: results, validCount, invalidCount, signalCount };
}
