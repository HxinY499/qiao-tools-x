import { describe, expect, it } from 'vitest';

import { compileMatcher, createEmptyCondition, type FindCondition } from './query-matcher';

const cond = (op: 'include' | 'exclude', value: string): FindCondition => ({
  id: `${op}-${value}`,
  op,
  value,
});

describe('createEmptyCondition', () => {
  it('默认创建一个空的 include 条件', () => {
    const c = createEmptyCondition();
    expect(c.op).toBe('include');
    expect(c.value).toBe('');
    expect(c.id).toBeTruthy();
  });

  it('可以指定 op 为 exclude', () => {
    const c = createEmptyCondition('exclude');
    expect(c.op).toBe('exclude');
  });

  it('多次创建的 id 应当不同', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createEmptyCondition().id));
    expect(ids.size).toBe(50);
  });
});

describe('compileMatcher - 普通模式', () => {
  it('空条件数组：isEmpty 为 true，test 恒为 true', () => {
    const m = compileMatcher({ conditions: [], caseSensitive: false, regexMode: false });
    expect(m.isEmpty).toBe(true);
    expect(m.test('anything')).toBe(true);
  });

  it('全是空 value 的条件应视为未搜索', () => {
    const m = compileMatcher({
      conditions: [cond('include', ''), cond('exclude', '')],
      caseSensitive: false,
      regexMode: false,
    });
    expect(m.isEmpty).toBe(true);
    expect(m.test('anything')).toBe(true);
  });

  it('单个 include 条件', () => {
    const m = compileMatcher({
      conditions: [cond('include', 'error')],
      caseSensitive: false,
      regexMode: false,
    });
    expect(m.test('this is an error')).toBe(true);
    expect(m.test('all good')).toBe(false);
  });

  it('大小写不敏感（默认）', () => {
    const m = compileMatcher({
      conditions: [cond('include', 'Error')],
      caseSensitive: false,
      regexMode: false,
    });
    expect(m.test('ERROR')).toBe(true);
    expect(m.test('error')).toBe(true);
  });

  it('大小写敏感', () => {
    const m = compileMatcher({
      conditions: [cond('include', 'Error')],
      caseSensitive: true,
      regexMode: false,
    });
    expect(m.test('Error')).toBe(true);
    expect(m.test('ERROR')).toBe(false);
  });

  it('多个 include AND 关系', () => {
    const m = compileMatcher({
      conditions: [cond('include', 'error'), cond('include', 'timeout')],
      caseSensitive: false,
      regexMode: false,
    });
    expect(m.test('error: connection timeout')).toBe(true);
    expect(m.test('error: parse failed')).toBe(false);
    expect(m.test('timeout only')).toBe(false);
  });

  it('include + exclude 混合', () => {
    const m = compileMatcher({
      conditions: [cond('include', 'error'), cond('exclude', 'timeout')],
      caseSensitive: false,
      regexMode: false,
    });
    expect(m.test('error: connection refused')).toBe(true);
    expect(m.test('error: connection timeout')).toBe(false);
    expect(m.test('warning: timeout')).toBe(false);
  });

  it('多个 exclude 之间也是 AND（都不能命中）', () => {
    const m = compileMatcher({
      conditions: [cond('exclude', 'debug'), cond('exclude', 'trace')],
      caseSensitive: false,
      regexMode: false,
    });
    expect(m.test('error message')).toBe(true);
    expect(m.test('debug log')).toBe(false);
    expect(m.test('trace info')).toBe(false);
  });

  it('关键词原样作为字面值（不解析 - 前缀）', () => {
    const m = compileMatcher({
      conditions: [cond('include', '-foo')],
      caseSensitive: false,
      regexMode: false,
    });
    expect(m.test('this -foo bar')).toBe(true);
    expect(m.test('foo')).toBe(false);
  });

  it('关键词中的空格按字面值处理', () => {
    const m = compileMatcher({
      conditions: [cond('include', 'connection refused')],
      caseSensitive: false,
      regexMode: false,
    });
    expect(m.test('error: connection refused')).toBe(true);
    expect(m.test('connection: refused')).toBe(false);
  });

  it('空 value 的条件应被跳过，不影响其他条件', () => {
    const m = compileMatcher({
      conditions: [cond('include', 'error'), cond('include', '')],
      caseSensitive: false,
      regexMode: false,
    });
    expect(m.test('error message')).toBe(true);
    expect(m.test('warning')).toBe(false);
  });
});

describe('compileMatcher - 正则模式', () => {
  it('合法正则', () => {
    const m = compileMatcher({
      conditions: [cond('include', 'err\\d+')],
      caseSensitive: false,
      regexMode: true,
    });
    expect(m.error).toBeNull();
    expect(m.test('err404')).toBe(true);
    expect(m.test('error')).toBe(false);
  });

  it('多个正则条件 AND', () => {
    const m = compileMatcher({
      conditions: [cond('include', '^err'), cond('exclude', '\\d+$')],
      caseSensitive: false,
      regexMode: true,
    });
    expect(m.test('err: text')).toBe(true);
    expect(m.test('err404')).toBe(false);
    expect(m.test('warning')).toBe(false);
  });

  it('正则 + 大小写不敏感（自动加 i flag）', () => {
    const m = compileMatcher({
      conditions: [cond('include', 'ERROR')],
      caseSensitive: false,
      regexMode: true,
    });
    expect(m.test('error message')).toBe(true);
  });

  it('正则 + 大小写敏感', () => {
    const m = compileMatcher({
      conditions: [cond('include', 'ERROR')],
      caseSensitive: true,
      regexMode: true,
    });
    expect(m.test('error message')).toBe(false);
    expect(m.test('ERROR')).toBe(true);
  });

  it('非法正则不应抛错，返回 error 字段并使 test 恒为 false', () => {
    const m = compileMatcher({
      conditions: [cond('include', '[invalid(')],
      caseSensitive: false,
      regexMode: true,
    });
    expect(m.error).toBeTruthy();
    expect(m.test('anything')).toBe(false);
  });
});
