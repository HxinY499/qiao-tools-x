import { describe, expect, it } from 'vitest';

import { parseJsonWithBetterError } from './utils';

describe('parseJsonWithBetterError', () => {
  it('应该成功解析合法的 JSON 字符串', () => {
    expect(parseJsonWithBetterError('{"name":"test"}')).toEqual({ name: 'test' });
    expect(parseJsonWithBetterError('[1,2,3]')).toEqual([1, 2, 3]);
    expect(parseJsonWithBetterError('"hello"')).toBe('hello');
    expect(parseJsonWithBetterError('123')).toBe(123);
    expect(parseJsonWithBetterError('true')).toBe(true);
    expect(parseJsonWithBetterError('null')).toBe(null);
  });

  it('应该支持 reviver 参数', () => {
    const result = parseJsonWithBetterError('{"a":1,"b":2}', (_key, value) => {
      if (typeof value === 'number') return value * 2;
      return value;
    });
    expect(result).toEqual({ a: 2, b: 4 });
  });

  it('应该在解析失败时抛出带有 errorInfo 的错误', () => {
    try {
      parseJsonWithBetterError('{"name": invalid}');
      expect.unreachable('应该抛出错误');
    } catch (error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.errorInfo).toBeDefined();
      expect(error.errorInfo.message).toBeDefined();
    }
  });

  it('应该在解析失败时提供 position 信息（如果引擎支持）', () => {
    try {
      parseJsonWithBetterError('{"name": "test",}');
      expect.unreachable('应该抛出错误');
    } catch (error: any) {
      expect(error.errorInfo).toBeDefined();
      // position 可能为 number 或 null，取决于 JS 引擎的错误信息格式
      expect(error.errorInfo.position === null || typeof error.errorInfo.position === 'number').toBe(true);
    }
  });

  it('应该在多行 JSON 解析失败时提供 errorLine 和 column', () => {
    const multiLineJson = `{
  "name": "test",
  "age": invalid
}`;
    try {
      parseJsonWithBetterError(multiLineJson);
      expect.unreachable('应该抛出错误');
    } catch (error: any) {
      expect(error.errorInfo).toBeDefined();
      if (error.errorInfo.position !== null) {
        expect(error.errorInfo.errorLine).toBeTypeOf('string');
        expect(error.errorInfo.column).toBeTypeOf('number');
      }
    }
  });

  it('应该在传入非字符串时抛出 TypeError', () => {
    expect(() => parseJsonWithBetterError([] as any)).toThrow(TypeError);
    expect(() => parseJsonWithBetterError([] as any)).toThrow('Cannot parse an empty array');
  });

  it('应该在传入非空数组时抛出 TypeError', () => {
    expect(() => parseJsonWithBetterError([1, 2] as any)).toThrow(TypeError);
  });

  it('应该处理空字符串', () => {
    expect(() => parseJsonWithBetterError('')).toThrow();
  });

  it('应该正确解析嵌套对象', () => {
    const json = '{"a":{"b":{"c":1}}}';
    expect(parseJsonWithBetterError(json)).toEqual({ a: { b: { c: 1 } } });
  });
});
