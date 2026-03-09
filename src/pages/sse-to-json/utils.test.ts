import { describe, expect, it } from 'vitest';

import { looksLikeSse, parseSseToJson } from './utils';

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

describe('parseSseToJson', () => {
  it('空文本应返回空结果', () => {
    const result = parseSseToJson('');
    expect(result.blocks).toEqual([]);
    expect(result.validCount).toBe(0);
    expect(result.invalidCount).toBe(0);
    expect(result.signalCount).toBe(0);
  });

  it('应解析单个 JSON data 块', () => {
    const result = parseSseToJson('data: {"msg":"hello"}\n\n');
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].type).toBe('json');
    expect(result.blocks[0].parsed).toEqual({ msg: 'hello' });
    expect(result.validCount).toBe(1);
  });

  it('应解析多个 JSON data 块', () => {
    const sse = `data: {"a":1}\n\ndata: {"b":2}\n\n`;
    const result = parseSseToJson(sse);
    expect(result.blocks).toHaveLength(2);
    expect(result.validCount).toBe(2);
  });

  it('应识别 [DONE] 信号', () => {
    const sse = `data: {"a":1}\n\ndata: [DONE]\n\n`;
    const result = parseSseToJson(sse);
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[1].type).toBe('signal');
    expect(result.signalCount).toBe(1);
  });

  it('应处理无法解析的文本块', () => {
    const sse = `data: not json\n\n`;
    const result = parseSseToJson(sse);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].type).toBe('text');
    expect(result.blocks[0].valid).toBe(false);
    expect(result.invalidCount).toBe(1);
  });

  it('应解析 event 字段', () => {
    const sse = `event: message\ndata: {"a":1}\n\n`;
    const result = parseSseToJson(sse);
    expect(result.blocks[0].event).toBe('message');
  });

  it('应解析 id 字段', () => {
    const sse = `id: 42\ndata: {"a":1}\n\n`;
    const result = parseSseToJson(sse);
    expect(result.blocks[0].id).toBe('42');
  });

  it('应解析 retry 字段', () => {
    const sse = `retry: 3000\ndata: {"a":1}\n\n`;
    const result = parseSseToJson(sse);
    expect(result.blocks[0].retry).toBe(3000);
  });

  it('应跳过注释行', () => {
    const sse = `: this is a comment\ndata: {"a":1}\n\n`;
    const result = parseSseToJson(sse);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].parsed).toEqual({ a: 1 });
  });

  it('应支持多行 data 拼接', () => {
    // 多行 data 应拼接为一个 JSON
    const sse = `data: {"key":\ndata: "value"}\n\n`;
    const result = parseSseToJson(sse);
    expect(result.blocks).toHaveLength(1);
    // 多行拼接后 raw 应该包含换行
    expect(result.blocks[0].raw).toContain('\n');
  });

  it('应处理末尾无空行的情况', () => {
    const sse = `data: {"a":1}`;
    const result = parseSseToJson(sse);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].parsed).toEqual({ a: 1 });
  });

  it('应识别 [END] 和 [COMPLETE] 信号', () => {
    const sse = `data: [END]\n\ndata: [COMPLETE]\n\n`;
    const result = parseSseToJson(sse);
    expect(result.signalCount).toBe(2);
    result.blocks.forEach((b) => expect(b.type).toBe('signal'));
  });

  it('应正确设置 block index', () => {
    const sse = `data: {"a":1}\n\ndata: {"b":2}\n\ndata: {"c":3}\n\n`;
    const result = parseSseToJson(sse);
    expect(result.blocks[0].index).toBe(0);
    expect(result.blocks[1].index).toBe(1);
    expect(result.blocks[2].index).toBe(2);
  });
});
