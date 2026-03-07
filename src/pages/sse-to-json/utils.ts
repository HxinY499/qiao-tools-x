export interface SseDataBlock {
  /** 原始 data 行内容 */
  raw: string;
  /** 解析后的 JSON 对象（解析失败为 null） */
  parsed: unknown | null;
  /** 是否解析成功 */
  valid: boolean;
  /** 解析失败时的错误信息 */
  error?: string;
  /** 块索引 */
  index: number;
  /** 该 data 所属的 event 类型 */
  event?: string;
}

/**
 * 粗略判断文本是否像 SSE 数据（至少包含一行 data: 开头）
 */
export function looksLikeSse(text: string): boolean {
  return /^data:\s*\S/m.test(text);
}

/**
 * 从 SSE 文本中提取所有 data: 行并逐一解析为 JSON
 */
export function parseSseToJson(sseText: string): SseDataBlock[] {
  if (!sseText.trim()) return [];

  const results: SseDataBlock[] = [];
  const lines = sseText.split('\n');
  let index = 0;
  let currentEvent: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();

    // 追踪 event: 行
    if (trimmed.startsWith('event:')) {
      currentEvent = trimmed.slice(6).trim() || undefined;
      continue;
    }

    // 匹配 data: 开头的行
    if (!trimmed.startsWith('data:')) continue;

    const raw = trimmed.slice(5).trim();
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      results.push({ raw, parsed, valid: true, index, event: currentEvent });
    } catch (e) {
      results.push({
        raw,
        parsed: null,
        valid: false,
        error: e instanceof Error ? e.message : '解析失败',
        index,
        event: currentEvent,
      });
    }
    index++;
    // data 消费后重置 event
    currentEvent = undefined;
  }

  return results;
}
