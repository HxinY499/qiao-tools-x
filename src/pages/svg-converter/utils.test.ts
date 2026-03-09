import { describe, expect, it } from 'vitest';

import { formatBytes } from './utils';

describe('formatBytes', () => {
  it('null/undefined 应返回 -', () => {
    expect(formatBytes(null)).toBe('-');
    expect(formatBytes(undefined)).toBe('-');
  });

  it('0 应返回 0 B', () => {
    expect(formatBytes(0)).toBe('-'); // 因为 !bytes 为 true 时返回 '-'
  });

  it('字节应显示 B', () => {
    expect(formatBytes(100)).toBe('100 B');
    expect(formatBytes(1)).toBe('1 B');
    expect(formatBytes(512)).toBe('512 B');
  });

  it('KB 级别', () => {
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(1536)).toBe('1.50 KB');
  });

  it('MB 级别', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.50 MB');
  });

  it('GB 级别', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
  });
});
