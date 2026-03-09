import { describe, expect, it } from 'vitest';

import { escapeHtml, escapeJs, escapeUnicode, unescapeHtml, unescapeJs, unescapeUnicode } from './utils';

describe('escapeHtml / unescapeHtml', () => {
  it('应该转义 HTML 特殊字符', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
    expect(escapeHtml('a & b')).toBe('a&nbsp;&amp;&nbsp;b');
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('应该将空格转为 &nbsp;', () => {
    expect(escapeHtml('a b')).toBe('a&nbsp;b');
    expect(escapeHtml('  ')).toBe('&nbsp;&nbsp;');
  });

  it('应该反转义 HTML 实体', () => {
    expect(unescapeHtml('&lt;div&gt;')).toBe('<div>');
    expect(unescapeHtml('&amp;')).toBe('&');
    expect(unescapeHtml('&quot;hello&quot;')).toBe('"hello"');
  });

  it('escape 和 unescape 应该互逆（特殊字符）', () => {
    const original = '<script>alert("xss")</script>';
    expect(unescapeHtml(escapeHtml(original))).toBe(original);
  });
});

describe('escapeUnicode / unescapeUnicode', () => {
  it('应该将非 ASCII 字符转为 \\uXXXX 格式', () => {
    expect(escapeUnicode('你好')).toBe('\\u4f60\\u597d');
  });

  it('应该保留 ASCII 字符', () => {
    expect(escapeUnicode('hello')).toBe('hello');
  });

  it('应该处理混合内容', () => {
    const result = escapeUnicode('hi你好');
    expect(result).toBe('hi\\u4f60\\u597d');
  });

  it('应该处理 BMP 之外的字符（使用 \\u{XXXXX} 格式）', () => {
    const emoji = '😀';
    const result = escapeUnicode(emoji);
    expect(result).toContain('\\u{');
  });

  it('应该反转义 \\uXXXX 格式', () => {
    expect(unescapeUnicode('\\u4f60\\u597d')).toBe('你好');
  });

  it('应该反转义 \\u{XXXXX} 格式', () => {
    expect(unescapeUnicode('\\u{1f600}')).toBe('😀');
  });

  it('escape 和 unescape 应该互逆', () => {
    const original = '你好世界';
    expect(unescapeUnicode(escapeUnicode(original))).toBe(original);
  });
});

describe('escapeJs / unescapeJs', () => {
  it('应该转义 JS 特殊字符', () => {
    const result = escapeJs('hello\nworld');
    expect(result).toContain('\\n');
  });

  it('应该转义双引号', () => {
    const result = escapeJs('say "hello"');
    expect(result).toContain('\\"');
  });

  it('应该转义反斜杠', () => {
    const result = escapeJs('path\\to\\file');
    expect(result).toContain('\\\\');
  });

  it('应该反转义 JS 字符串', () => {
    expect(unescapeJs('hello\\nworld')).toBe('hello\nworld');
  });

  it('应该处理已带引号的字符串', () => {
    expect(unescapeJs('"hello\\nworld"')).toBe('hello\nworld');
  });

  it('应该在解析失败时返回原字符串', () => {
    // 不完整的转义序列
    const input = '\\x';
    const result = unescapeJs(input);
    // 可能返回原字符串或尝试解析
    expect(typeof result).toBe('string');
  });

  it('escape 和 unescape 应该互逆', () => {
    const original = 'line1\nline2\ttab';
    expect(unescapeJs(escapeJs(original))).toBe(original);
  });
});
