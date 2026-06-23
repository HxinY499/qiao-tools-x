import { describe, expect, it } from 'vitest';

import { detectFormat, looksLikeLjson, looksLikeSse, looksLikeStream, parseStream } from './utils';

describe('detectFormat', () => {
  it('SSE 文本应识别为 sse', () => {
    expect(detectFormat('data: {"a":1}\n\ndata: {"b":2}\n\n')).toBe('sse');
  });

  it('JSONL 文本应识别为 ljson', () => {
    expect(detectFormat('{"a":1}\n{"b":2}\n{"c":3}')).toBe('ljson');
  });

  it('普通文本应识别为 unknown', () => {
    expect(detectFormat('hello\nworld')).toBe('unknown');
  });

  it('空文本应识别为 unknown', () => {
    expect(detectFormat('')).toBe('unknown');
  });

  it('SSE 与 JSONL 同时疑似时，应优先识别为 sse', () => {
    // 这种数据其实是 SSE，但每行去掉 data: 后也能当成 JSONL
    const text = 'data: {"a":1}\ndata: {"b":2}';
    expect(detectFormat(text)).toBe('sse');
  });
});

describe('looksLikeSse', () => {
  it('多条 data: 行应识别为 SSE', () => {
    expect(looksLikeSse('data: {}\ndata: {}')).toBe(true);
  });

  it('单条 data: 后跟 JSON 对象应识别为 SSE', () => {
    expect(looksLikeSse('data: {"key":"value"}')).toBe(true);
  });

  it('单条 data: 后跟 JSON 数组应识别为 SSE', () => {
    expect(looksLikeSse('data: [1,2,3]')).toBe(true);
  });

  it('无 data: 行应返回 false', () => {
    expect(looksLikeSse('hello world')).toBe(false);
  });

  it('单条 data: 后跟非 JSON 应返回 false', () => {
    expect(looksLikeSse('data: hello')).toBe(false);
  });
});

describe('looksLikeLjson', () => {
  it('多行合法 JSON 应识别为 ljson', () => {
    expect(looksLikeLjson('{"a":1}\n{"b":2}\n{"c":3}')).toBe(true);
  });

  it('包含数组的多行 JSON 应识别为 ljson', () => {
    expect(looksLikeLjson('[1,2]\n[3,4]\n[5,6]')).toBe(true);
  });

  it('单行 JSON 不应识别为 ljson', () => {
    expect(looksLikeLjson('{"a":1}')).toBe(false);
  });

  it('多行普通文本不应识别为 ljson', () => {
    expect(looksLikeLjson('hello\nworld\nfoo')).toBe(false);
  });
});

describe('looksLikeStream', () => {
  it('SSE 或 JSONL 任一命中即可', () => {
    expect(looksLikeStream('data: {"a":1}\ndata: {"b":2}')).toBe(true);
    expect(looksLikeStream('{"a":1}\n{"b":2}')).toBe(true);
    expect(looksLikeStream('hello world')).toBe(false);
  });
});

describe('parseStream - SSE 分支', () => {
  it('应按 SSE 协议解析', () => {
    const result = parseStream('data: {"msg":"hello"}\n\n');
    expect(result.format).toBe('sse');
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].kind).toBe('sse');
    expect(result.validCount).toBe(1);
  });

  it('应识别 [DONE] 信号', () => {
    const sse = `data: {"a":1}\n\ndata: [DONE]\n\n`;
    const result = parseStream(sse);
    expect(result.format).toBe('sse');
    expect(result.blocks).toHaveLength(2);
    expect(result.signalCount).toBe(1);
    const second = result.blocks[1];
    if (second.kind !== 'sse') throw new Error('expected sse block');
    expect(second.type).toBe('signal');
  });

  it('应解析 event/id/retry 字段', () => {
    const sse = `event: message\nid: 42\nretry: 3000\ndata: {"a":1}\n\n`;
    const result = parseStream(sse);
    const b = result.blocks[0];
    if (b.kind !== 'sse') throw new Error('expected sse block');
    expect(b.event).toBe('message');
    expect(b.id).toBe('42');
    expect(b.retry).toBe(3000);
  });

  it('应跳过注释行', () => {
    const sse = `: this is a comment\ndata: {"a":1}\n\n`;
    const result = parseStream(sse);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].parsed).toEqual({ a: 1 });
  });

  it('应支持多行 data 拼接', () => {
    const sse = `data: {"key":\ndata: "value"}\n\n`;
    const result = parseStream(sse);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].raw).toContain('\n');
  });

  it('SSE 流中应处理无法解析的 data 文本块（多条 data 行场景）', () => {
    // 至少 2 条 data: 行才会被识别为 SSE
    const sse = `data: not json\n\ndata: {"a":1}\n\n`;
    const result = parseStream(sse);
    expect(result.format).toBe('sse');
    expect(result.invalidCount).toBe(1);
    expect(result.validCount).toBe(1);
    const b = result.blocks[0];
    if (b.kind !== 'sse') throw new Error('expected sse block');
    expect(b.type).toBe('text');
  });
});

describe('parseStream - JSONL 分支', () => {
  it('应按行解析多行 JSON', () => {
    const result = parseStream('{"a":1}\n{"b":2}');
    expect(result.format).toBe('ljson');
    expect(result.blocks).toHaveLength(2);
    expect(result.validCount).toBe(2);
    expect(result.blocks[0].kind).toBe('ljson');
    expect(result.blocks[0].parsed).toEqual({ a: 1 });
  });

  it('空行应被跳过，不计入索引', () => {
    const result = parseStream('{"a":1}\n\n\n{"b":2}');
    expect(result.blocks).toHaveLength(2);
    const b0 = result.blocks[0];
    const b1 = result.blocks[1];
    if (b0.kind !== 'ljson' || b1.kind !== 'ljson') throw new Error('expected ljson blocks');
    expect(b0.lineNo).toBe(1);
    expect(b1.lineNo).toBe(2);
  });

  it('非法 JSON 行应标记为失败', () => {
    const result = parseStream('{"a":1}\nnot json\n{"b":2}');
    expect(result.format).toBe('ljson');
    expect(result.blocks).toHaveLength(3);
    expect(result.validCount).toBe(2);
    expect(result.invalidCount).toBe(1);
    expect(result.blocks[1].valid).toBe(false);
  });
});

describe('parseStream - 边界场景', () => {
  it('空文本应返回空结果', () => {
    const result = parseStream('');
    expect(result.blocks).toEqual([]);
    expect(result.format).toBe('unknown');
  });

  it('无法识别的文本应返回空结果且 format=unknown', () => {
    const result = parseStream('hello\nworld\nfoo');
    expect(result.blocks).toEqual([]);
    expect(result.format).toBe('unknown');
  });
});
