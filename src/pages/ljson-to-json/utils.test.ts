import { describe, expect, it } from 'vitest';

import { looksLikeLjson, parseLjsonToJson } from './utils';

describe('looksLikeLjson', () => {
  it('多行合法 JSON 应识别为 ljson', () => {
    const text = '{"a":1}\n{"b":2}\n{"c":3}';
    expect(looksLikeLjson(text)).toBe(true);
  });

  it('包含数组的多行 JSON 应识别为 ljson', () => {
    const text = '[1,2]\n[3,4]\n[5,6]';
    expect(looksLikeLjson(text)).toBe(true);
  });

  it('单行文本不应识别为 ljson', () => {
    expect(looksLikeLjson('{"a":1}')).toBe(false);
  });

  it('多行普通文本不应识别为 ljson', () => {
    expect(looksLikeLjson('hello\nworld\nfoo')).toBe(false);
  });

  it('空文本应返回 false', () => {
    expect(looksLikeLjson('')).toBe(false);
  });
});

describe('parseLjsonToJson', () => {
  it('空文本应返回空结果', () => {
    const result = parseLjsonToJson('');
    expect(result.blocks).toEqual([]);
    expect(result.validCount).toBe(0);
    expect(result.invalidCount).toBe(0);
  });

  it('多行合法 JSON 应全部解析成功', () => {
    const text = '{"a":1}\n{"b":2}';
    const result = parseLjsonToJson(text);
    expect(result.blocks).toHaveLength(2);
    expect(result.validCount).toBe(2);
    expect(result.invalidCount).toBe(0);
    expect(result.blocks[0].parsed).toEqual({ a: 1 });
    expect(result.blocks[1].parsed).toEqual({ b: 2 });
  });

  it('空行应被跳过，不计入索引', () => {
    const text = '{"a":1}\n\n\n{"b":2}';
    const result = parseLjsonToJson(text);
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].lineNo).toBe(1);
    expect(result.blocks[1].lineNo).toBe(2);
  });

  it('非法 JSON 应标记为失败', () => {
    const text = '{"a":1}\nnot json\n{"b":2}';
    const result = parseLjsonToJson(text);
    expect(result.blocks).toHaveLength(3);
    expect(result.validCount).toBe(2);
    expect(result.invalidCount).toBe(1);
    expect(result.blocks[1].valid).toBe(false);
    expect(result.blocks[1].error).toBeTruthy();
  });

  it('每个 block 都应有 formatted 字符串', () => {
    const result = parseLjsonToJson('{"a":1}');
    expect(result.blocks[0].formatted).toContain('"a": 1');
  });
});
