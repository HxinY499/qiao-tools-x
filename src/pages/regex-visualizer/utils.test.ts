import { describe, expect, it } from 'vitest';

import type { RegexFlags } from './types';
import {
  createRegex,
  executeMatch,
  executeReplace,
  flagsToString,
  generateExplanation,
  highlightMatches,
} from './utils';

const defaultFlags: RegexFlags = {
  global: false,
  ignoreCase: false,
  multiline: false,
  dotAll: false,
  unicode: false,
  sticky: false,
};

describe('flagsToString', () => {
  it('所有 flag 都为 false 时应返回空字符串', () => {
    expect(flagsToString(defaultFlags)).toBe('');
  });

  it('应正确拼接 flag', () => {
    expect(flagsToString({ ...defaultFlags, global: true, ignoreCase: true })).toBe('gi');
  });

  it('应按 gimsuy 顺序输出', () => {
    const all: RegexFlags = {
      global: true,
      ignoreCase: true,
      multiline: true,
      dotAll: true,
      unicode: true,
      sticky: true,
    };
    expect(flagsToString(all)).toBe('gimsuy');
  });
});

describe('createRegex', () => {
  it('应创建正则', () => {
    const regex = createRegex('\\d+', defaultFlags);
    expect(regex).toBeInstanceOf(RegExp);
    expect(regex!.source).toBe('\\d+');
  });

  it('空 pattern 应返回 null', () => {
    expect(createRegex('', defaultFlags)).toBeNull();
  });

  it('非法 pattern 应返回 null', () => {
    expect(createRegex('[', defaultFlags)).toBeNull();
  });
});

describe('executeMatch', () => {
  it('非全局模式应返回第一个匹配', () => {
    const results = executeMatch('\\d+', defaultFlags, 'abc 123 def 456');
    expect(results).toHaveLength(1);
    expect(results[0].match).toBe('123');
  });

  it('全局模式应返回所有匹配', () => {
    const results = executeMatch('\\d+', { ...defaultFlags, global: true }, 'abc 123 def 456');
    expect(results).toHaveLength(2);
    expect(results[0].match).toBe('123');
    expect(results[1].match).toBe('456');
  });

  it('无匹配应返回空数组', () => {
    expect(executeMatch('\\d+', defaultFlags, 'abc')).toEqual([]);
  });

  it('空 pattern 应返回空数组', () => {
    expect(executeMatch('', defaultFlags, 'test')).toEqual([]);
  });

  it('应包含 start/end 位置', () => {
    const results = executeMatch('world', defaultFlags, 'hello world');
    expect(results[0].start).toBe(6);
    expect(results[0].end).toBe(11);
  });

  it('应支持命名组', () => {
    const results = executeMatch('(?<name>\\w+)', defaultFlags, 'hello');
    expect(results[0].groups.name).toBe('hello');
  });

  it('应支持捕获组', () => {
    const results = executeMatch('(\\d+)-(\\d+)', defaultFlags, '123-456');
    expect(results[0].captures).toEqual(['123', '456']);
  });
});

describe('executeReplace', () => {
  it('应替换匹配内容', () => {
    const result = executeReplace('world', defaultFlags, 'hello world', 'vitest');
    expect(result).toBe('hello vitest');
  });

  it('全局替换应替换所有', () => {
    const result = executeReplace('o', { ...defaultFlags, global: true }, 'foo boo', 'x');
    expect(result).toBe('fxx bxx');
  });

  it('空 pattern 应返回 null', () => {
    expect(executeReplace('', defaultFlags, 'test', 'x')).toBeNull();
  });

  it('无匹配应返回原文', () => {
    expect(executeReplace('xyz', defaultFlags, 'hello', 'x')).toBe('hello');
  });
});

describe('generateExplanation', () => {
  it('空 pattern 应返回空数组', () => {
    expect(generateExplanation('')).toEqual([]);
  });

  it('应解释普通字符', () => {
    const items = generateExplanation('a');
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('literal');
  });

  it('应解释转义序列 \\d', () => {
    const items = generateExplanation('\\d');
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('meta');
    expect(items[0].description).toContain('数字');
  });

  it('应解释字符类 [a-z]', () => {
    const items = generateExplanation('[a-z]');
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('class');
  });

  it('应解释否定字符类 [^0-9]', () => {
    const items = generateExplanation('[^0-9]');
    expect(items[0].description).toContain('不匹配');
  });

  it('应解释分组 (abc)', () => {
    const items = generateExplanation('(abc)');
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('group');
    expect(items[0].description).toContain('捕获组');
  });

  it('应解释非捕获组 (?:abc)', () => {
    const items = generateExplanation('(?:abc)');
    expect(items[0].description).toContain('非捕获组');
  });

  it('应解释正向前瞻 (?=abc)', () => {
    const items = generateExplanation('(?=abc)');
    expect(items[0].description).toContain('正向前瞻');
  });

  it('应解释量词 {2,5}', () => {
    const items = generateExplanation('a{2,5}');
    const quantifier = items.find((i) => i.type === 'quantifier');
    expect(quantifier).toBeDefined();
    expect(quantifier!.description).toContain('2');
    expect(quantifier!.description).toContain('5');
  });

  it('应解释精确量词 {3}', () => {
    const items = generateExplanation('a{3}');
    const quantifier = items.find((i) => i.type === 'quantifier');
    expect(quantifier!.description).toContain('精确匹配 3 次');
  });

  it('应解释 . * + ?', () => {
    const items = generateExplanation('.*+?');
    expect(items.filter((i) => i.type === 'meta')).toHaveLength(4);
  });
});

describe('highlightMatches', () => {
  it('无匹配应返回整个文本为非匹配', () => {
    const segments = highlightMatches('hello', []);
    expect(segments).toEqual([{ text: 'hello', isMatch: false }]);
  });

  it('应正确分割匹配和非匹配段', () => {
    const segments = highlightMatches('hello world', [
      { index: 0, match: 'world', groups: {}, captures: [], start: 6, end: 11 },
    ]);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toEqual({ text: 'hello ', isMatch: false });
    expect(segments[1]).toEqual({ text: 'world', isMatch: true, matchIndex: 0 });
  });

  it('应处理多个匹配', () => {
    const segments = highlightMatches('abcabc', [
      { index: 0, match: 'a', groups: {}, captures: [], start: 0, end: 1 },
      { index: 1, match: 'a', groups: {}, captures: [], start: 3, end: 4 },
    ]);
    expect(segments.filter((s) => s.isMatch)).toHaveLength(2);
  });
});
