/**
 * 合并后的解析器：自动识别 SSE / JSONL（JSON Lines / NDJSON）。
 * - 判定优先级：SSE > JSONL（SSE 的 `data:` 前缀特征更强）
 * - 两种格式产出的块结构不同，所以使用判别联合（kind 字段区分）
 */

// ─── 联合 Block 类型 ────────────────────────────────────────

/** SSE data 块的子类型 */
export type SseBlockType = 'json' | 'signal' | 'text';

export interface SseDataBlock {
  /** 判别字段：来源于 SSE */
  kind: 'sse';
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

export interface LjsonLineBlock {
  /** 判别字段：来源于 JSONL */
  kind: 'ljson';
  /** 原始行内容 */
  raw: string;
  /** 解析后的 JSON 对象（仅当 valid 为 true 时有效） */
  parsed: unknown | null;
  /** 格式化后的 JSON 字符串（仅当 valid 为 true 时有值） */
  formatted?: string;
  /** 是否解析成功 */
  valid: boolean;
  /** 解析失败时的错误信息 */
  error?: string;
  /** 块索引（0-based） */
  index: number;
  /** 在原始文本中的行号（1-based，跳过空行计数） */
  lineNo: number;
}

export type StreamBlock = SseDataBlock | LjsonLineBlock;

/** 识别到的源格式 */
export type SourceFormat = 'sse' | 'ljson' | 'unknown';

export interface ParseResult {
  blocks: StreamBlock[];
  /** 识别到的源格式 */
  format: SourceFormat;
  /** 解析成功的（json 块）数量 */
  validCount: number;
  /** 解析失败的数量 */
  invalidCount: number;
  /** SSE 信号块数量（仅 sse 格式才会 > 0） */
  signalCount: number;
  /** SSE 格式下，末尾事件块后缺少空行分隔符（数据可能不完整） */
  trailingIncomplete?: boolean;
}

// ─── 格式识别 ────────────────────────────────────────────────

/**
 * 粗略判断文本是否像 SSE 数据。
 * 要求至少出现 2 条 data: 行，或 1 条 data: 后跟 JSON 对象/数组。
 */
export function looksLikeSse(text: string): boolean {
  const dataLines = text.match(/^data:\s*\S/gm);
  if (!dataLines) return false;
  if (dataLines.length >= 2) return true;
  // 只有一条 data: 时，要求内容看起来像 JSON
  return /^data:\s*[\[{]/m.test(text);
}

/**
 * 粗略判断文本是否像 ljson（JSON Lines / NDJSON）。
 * 规则：
 *   - 至少有 2 个非空行
 *   - 前若干非空行中，超过 60% 能被 JSON.parse
 * 只检测前 10 行以避免大文本性能问题。
 */
export function looksLikeLjson(text: string): boolean {
  if (!text || !text.trim()) return false;

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return false;

  const sample = lines.slice(0, 10);
  let validCount = 0;
  for (const line of sample) {
    try {
      JSON.parse(line);
      validCount++;
    } catch {
      /* ignore */
    }
  }
  return validCount / sample.length >= 0.6;
}

/**
 * 识别文本是 SSE / JSONL / 都不像。
 * SSE 优先（特征更强），其次 JSONL。
 */
export function detectFormat(text: string): SourceFormat {
  if (looksLikeSse(text)) return 'sse';
  if (looksLikeLjson(text)) return 'ljson';
  return 'unknown';
}

/** 整体 looksLike：SSE 或 JSONL 任一命中即可（用于全局粘贴拦截） */
export function looksLikeStream(text: string): boolean {
  return detectFormat(text) !== 'unknown';
}

// ─── SSE 解析 ────────────────────────────────────────────────

/**
 * 判断 SSE data 内容是否为流控信号。
 * 匹配规则：方括号包裹的大写字母/下划线文本（如 [DONE]、[END]、[COMPLETE]、[FINISHED] 等），
 * 排除合法 JSON 数组（以 `[{` 或 `["` 或 `[数字` 开头的情况）。
 */
function isSignal(raw: string): boolean {
  return /^\[[A-Z][A-Z_]*\]$/.test(raw);
}

/** SSE 规范：字段值前如果有一个空格则去掉，否则原样保留 */
function stripLeadingSpace(s: string): string {
  return s.startsWith(' ') ? s.slice(1) : s;
}

/** 按 SSE 规范从文本中提取事件块，支持多行 data 拼接 */
function parseSse(sseText: string): {
  blocks: SseDataBlock[];
  validCount: number;
  invalidCount: number;
  signalCount: number;
  trailingIncomplete: boolean;
} {
  const results: SseDataBlock[] = [];
  let blockIndex = 0;
  let validCount = 0;
  let invalidCount = 0;
  let signalCount = 0;

  let currentEvent: string | undefined;
  let currentId: string | undefined;
  let currentRetry: number | undefined;
  let dataLines: string[] = [];

  const flushBlock = () => {
    if (dataLines.length === 0) return;

    const raw = dataLines.join('\n');
    const block: SseDataBlock = {
      kind: 'sse',
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

  // 游标方式逐行遍历，避免大文本 split 产生大量临时字符串
  let pos = 0;
  const len = sseText.length;
  while (pos <= len) {
    const nlIdx = sseText.indexOf('\n', pos);
    const lineEnd = nlIdx === -1 ? len : nlIdx;
    // 提取行内容（不含 \n），同时处理 \r\n
    let line = sseText.slice(pos, lineEnd);
    if (line.endsWith('\r')) line = line.slice(0, -1);
    pos = lineEnd + 1;

    // SSE 规范：空行触发事件分发
    if (line === '') {
      flushBlock();
      currentEvent = undefined;
      currentId = undefined;
      currentRetry = undefined;
      continue;
    }

    // SSE 规范要求字段名从行首开始（column 0），不 trim
    // 注释行：以冒号开头
    if (line.charCodeAt(0) === 58 /* ':' */) continue;

    if (line.startsWith('event:')) {
      if (dataLines.length > 0) {
        flushBlock();
      }
      currentEvent = stripLeadingSpace(line.slice(6)) || undefined;
      continue;
    }

    if (line.startsWith('id:')) {
      currentId = stripLeadingSpace(line.slice(3)) || undefined;
      continue;
    }

    if (line.startsWith('retry:')) {
      const val = parseInt(stripLeadingSpace(line.slice(6)), 10);
      currentRetry = isNaN(val) ? undefined : val;
      continue;
    }

    if (line.startsWith('data:')) {
      dataLines.push(stripLeadingSpace(line.slice(5)));
      continue;
    }

    // SSE 规范：没有冒号的非空行，整行作为字段名，值为空字符串
    // 有冒号但不是已知字段名的行，按规范忽略
  }

  // 末尾兜底 flush：如果 dataLines 非空，说明最后一个事件块后缺少空行分隔符
  const trailingIncomplete = dataLines.length > 0;
  flushBlock();

  return { blocks: results, validCount, invalidCount, signalCount, trailingIncomplete };
}

// ─── JSONL 解析 ──────────────────────────────────────────────

/** 按行解析 ljson 文本。每个非空行视作一条独立 JSON。 */
function parseLjson(ljsonText: string): {
  blocks: LjsonLineBlock[];
  validCount: number;
  invalidCount: number;
} {
  const results: LjsonLineBlock[] = [];
  let validCount = 0;
  let invalidCount = 0;
  let blockIndex = 0;
  let lineNo = 0;

  // 游标方式逐行遍历
  let pos = 0;
  const len = ljsonText.length;
  while (pos <= len) {
    const nlIdx = ljsonText.indexOf('\n', pos);
    const lineEnd = nlIdx === -1 ? len : nlIdx;
    let line = ljsonText.slice(pos, lineEnd);
    if (line.endsWith('\r')) line = line.slice(0, -1);
    line = line.trim();
    pos = lineEnd + 1;

    if (!line) continue;
    lineNo++;

    const block: LjsonLineBlock = {
      kind: 'ljson',
      raw: line,
      parsed: null,
      valid: false,
      index: blockIndex++,
      lineNo,
    };

    try {
      block.parsed = JSON.parse(line);
      block.formatted = JSON.stringify(block.parsed, null, 2);
      block.valid = true;
      validCount++;
    } catch (e) {
      block.error = e instanceof Error ? e.message : '解析失败';
      invalidCount++;
    }

    results.push(block);
  }

  return { blocks: results, validCount, invalidCount };
}

// ─── 统一入口 ────────────────────────────────────────────────

const EMPTY: ParseResult = {
  blocks: [],
  format: 'unknown',
  validCount: 0,
  invalidCount: 0,
  signalCount: 0,
};

/**
 * 自动识别格式并解析。
 * 优先按 SSE 解析；不像 SSE 则按 JSONL 解析；都不像则返回空结果（format: 'unknown'）。
 * @param forceFormat 可选，强制以指定格式解析（跳过自动识别）
 */
export function parseStream(text: string, forceFormat?: 'sse' | 'ljson'): ParseResult {
  if (!text.trim()) return { ...EMPTY };

  const format = forceFormat ?? detectFormat(text);

  if (format === 'sse') {
    const { blocks, validCount, invalidCount, signalCount, trailingIncomplete } = parseSse(text);
    return { blocks, format, validCount, invalidCount, signalCount, trailingIncomplete };
  }

  if (format === 'ljson') {
    const { blocks, validCount, invalidCount } = parseLjson(text);
    return { blocks, format, validCount, invalidCount, signalCount: 0 };
  }

  // 都不像：明确返回空，让用户看到"无法识别"提示。
  return { ...EMPTY };
}
