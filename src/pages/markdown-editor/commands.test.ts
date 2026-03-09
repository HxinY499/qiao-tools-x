import { describe, expect, it } from 'vitest';

import { ALL_COMMANDS, filterCommands, formatShortcut, getCommandExecutor } from './commands';

describe('filterCommands', () => {
  it('空 filter 应返回全部命令', () => {
    expect(filterCommands(ALL_COMMANDS, '')).toEqual(ALL_COMMANDS);
  });

  it('应按 label 过滤', () => {
    const result = filterCommands(ALL_COMMANDS, '粗体');
    expect(result.some((c) => c.id === 'bold')).toBe(true);
  });

  it('应按 keywords 过滤', () => {
    const result = filterCommands(ALL_COMMANDS, 'bold');
    expect(result.some((c) => c.id === 'bold')).toBe(true);
  });

  it('应按 description 过滤', () => {
    const result = filterCommands(ALL_COMMANDS, '加粗');
    expect(result.some((c) => c.id === 'bold')).toBe(true);
  });

  it('大小写不敏感', () => {
    const result = filterCommands(ALL_COMMANDS, 'BOLD');
    expect(result.some((c) => c.id === 'bold')).toBe(true);
  });

  it('无匹配应返回空数组', () => {
    expect(filterCommands(ALL_COMMANDS, 'zzzzzzzzz')).toEqual([]);
  });
});

describe('formatShortcut', () => {
  it('应格式化简单快捷键', () => {
    const result = formatShortcut({ key: 'b', ctrl: true });
    // 不同平台输出不同，但一定包含 B
    expect(result).toContain('B');
  });

  it('应格式化 Shift 组合键', () => {
    const result = formatShortcut({ key: 's', ctrl: true, shift: true });
    expect(result).toContain('S');
  });

  it('只有 key 时应只输出大写字母', () => {
    const result = formatShortcut({ key: 'a' });
    expect(result).toBe('A');
  });
});

describe('getCommandExecutor', () => {
  it('已知命令应返回函数', () => {
    expect(getCommandExecutor('bold')).toBeTypeOf('function');
    expect(getCommandExecutor('italic')).toBeTypeOf('function');
    expect(getCommandExecutor('h1')).toBeTypeOf('function');
    expect(getCommandExecutor('link')).toBeTypeOf('function');
    expect(getCommandExecutor('hr')).toBeTypeOf('function');
  });

  it('未知命令应返回 null', () => {
    expect(getCommandExecutor('nonexistent')).toBeNull();
  });

  it('所有标题级别命令都应返回 executor', () => {
    for (let i = 1; i <= 6; i++) {
      expect(getCommandExecutor(`h${i}`)).toBeTypeOf('function');
    }
  });
});
