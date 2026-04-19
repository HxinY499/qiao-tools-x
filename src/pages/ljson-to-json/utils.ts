export interface LjsonLineBlock {
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

export interface ParseResult {
  blocks: LjsonLineBlock[];
  validCount: number;
  invalidCount: number;
}

/**
 * 判断当前平台是否为 macOS
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /mac|iphone|ipad|ipod/i.test(navigator.userAgent);
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

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;

  const sample = lines.slice(0, 10);
  let validCount = 0;
  for (const line of sample) {
    // 快速排除明显不是 JSON 的内容
    if (!(line.startsWith('{') || line.startsWith('['))) continue;
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
 * 按行解析 ljson 文本。每个非空行视作一条独立 JSON。
 */
export function parseLjsonToJson(ljsonText: string): ParseResult {
  if (!ljsonText.trim()) {
    return { blocks: [], validCount: 0, invalidCount: 0 };
  }

  const results: LjsonLineBlock[] = [];
  let validCount = 0;
  let invalidCount = 0;
  let blockIndex = 0;
  let lineNo = 0;

  const lines = ljsonText.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    lineNo++;

    const block: LjsonLineBlock = {
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
