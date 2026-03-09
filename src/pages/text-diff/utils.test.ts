import { describe, expect, it } from 'vitest';

import { buildDiffLines, buildDiffSummaryText, calculateStats } from './utils';

describe('buildDiffLines', () => {
  it('两个相同文本应全为 unchanged', () => {
    const lines = buildDiffLines('hello\nworld', 'hello\nworld');
    expect(lines.length).toBeGreaterThan(0);
    lines.forEach((l) => expect(l.type).toBe('unchanged'));
  });

  it('应该检测新增行', () => {
    const lines = buildDiffLines('a\nb', 'a\nb\nc');
    expect(lines.some((l) => l.type === 'added')).toBe(true);
  });

  it('应该检测删除行', () => {
    const lines = buildDiffLines('a\nb\nc', 'a\nb');
    expect(lines.some((l) => l.type === 'removed')).toBe(true);
  });

  it('应该检测修改行', () => {
    const lines = buildDiffLines('a\nhello\nc', 'a\nworld\nc');
    expect(lines.some((l) => l.type === 'modified')).toBe(true);
  });

  it('应该正确编号', () => {
    const lines = buildDiffLines('a\nb', 'a\nb');
    expect(lines[0].leftLineNumber).toBe(1);
    expect(lines[0].rightLineNumber).toBe(1);
    expect(lines[1].leftLineNumber).toBe(2);
  });

  it('空字符串应返回空数组', () => {
    expect(buildDiffLines('', '')).toEqual([]);
  });

  it('左空右有内容应有 added', () => {
    const lines = buildDiffLines('', 'hello');
    expect(lines.some((l) => l.type === 'added')).toBe(true);
  });

  it('左有内容右空应有 removed', () => {
    const lines = buildDiffLines('hello', '');
    expect(lines.some((l) => l.type === 'removed')).toBe(true);
  });

  it('修改行应包含字符级 segments', () => {
    const lines = buildDiffLines('abc', 'axc');
    const modified = lines.find((l) => l.type === 'modified');
    if (modified) {
      expect(modified.leftSegments.length).toBeGreaterThan(0);
      expect(modified.rightSegments.length).toBeGreaterThan(0);
    }
  });
});

describe('calculateStats', () => {
  it('应该正确统计行数和字符数', () => {
    const stats = calculateStats('line1\nline2', 'a\nb\nc');
    expect(stats.leftLineCount).toBe(2);
    expect(stats.rightLineCount).toBe(3);
    expect(stats.leftCharCount).toBe(11);
    expect(stats.rightCharCount).toBe(5);
  });

  it('空字符串应返回 0', () => {
    const stats = calculateStats('', '');
    expect(stats.leftLineCount).toBe(0);
    expect(stats.rightLineCount).toBe(0);
    expect(stats.leftCharCount).toBe(0);
    expect(stats.rightCharCount).toBe(0);
  });
});

describe('buildDiffSummaryText', () => {
  it('空数组应返回空字符串', () => {
    expect(buildDiffSummaryText([])).toBe('');
  });

  it('应该生成带标记的摘要', () => {
    const lines = buildDiffLines('hello', 'world');
    const summary = buildDiffSummaryText(lines);
    expect(summary).toBeTruthy();
    // 应包含行号和内容标记
    expect(summary).toContain('L');
    expect(summary).toContain('R');
  });

  it('modified 行应包含 => 符号', () => {
    const lines = buildDiffLines('hello\nfoo', 'hello\nbar');
    const summary = buildDiffSummaryText(lines);
    expect(summary).toContain('=>');
  });
});
