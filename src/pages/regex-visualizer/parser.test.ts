import { describe, expect, it } from 'vitest';

import { parseRegex, validateRegex } from './parser';

describe('parseRegex', () => {
  it('空 pattern 应返回 null', () => {
    expect(parseRegex('')).toBeNull();
  });

  it('应解析简单字符', () => {
    const ast = parseRegex('abc');
    expect(ast).not.toBeNull();
    expect(ast!.type).toBe('Regex');
    expect(ast!.body.type).toBe('Alternative');
  });

  it('应解析转义字符 \\d', () => {
    const ast = parseRegex('\\d');
    expect(ast).not.toBeNull();
    const body = ast!.body;
    if (body.type === 'Alternative') {
      expect(body.elements).toHaveLength(1);
      const char = body.elements[0];
      expect(char.type).toBe('Char');
      if (char.type === 'Char') {
        expect(char.kind).toBe('meta');
        expect(char.raw).toBe('\\d');
      }
    }
  });

  it('应解析 . 元字符', () => {
    const ast = parseRegex('.');
    const body = ast!.body;
    if (body.type === 'Alternative') {
      expect(body.elements[0].type).toBe('Char');
    }
  });

  it('应解析字符类 [a-z]', () => {
    const ast = parseRegex('[a-z]');
    const body = ast!.body;
    if (body.type === 'Alternative') {
      const cls = body.elements[0];
      expect(cls.type).toBe('CharacterClass');
      if (cls.type === 'CharacterClass') {
        expect(cls.negative).toBe(false);
        expect(cls.expressions).toHaveLength(1);
        expect(cls.expressions[0].type).toBe('CharacterClassRange');
      }
    }
  });

  it('应解析否定字符类 [^0-9]', () => {
    const ast = parseRegex('[^0-9]');
    const body = ast!.body;
    if (body.type === 'Alternative') {
      const cls = body.elements[0];
      if (cls.type === 'CharacterClass') {
        expect(cls.negative).toBe(true);
      }
    }
  });

  it('应解析捕获组 (abc)', () => {
    const ast = parseRegex('(abc)');
    const body = ast!.body;
    if (body.type === 'Alternative') {
      const group = body.elements[0];
      expect(group.type).toBe('Group');
      if (group.type === 'Group') {
        expect(group.capturing).toBe(true);
        expect(group.number).toBe(1);
      }
    }
  });

  it('应解析非捕获组 (?:abc)', () => {
    const ast = parseRegex('(?:abc)');
    const body = ast!.body;
    if (body.type === 'Alternative') {
      const group = body.elements[0];
      if (group.type === 'Group') {
        expect(group.capturing).toBe(false);
      }
    }
  });

  it('应解析命名捕获组 (?<name>abc)', () => {
    const ast = parseRegex('(?<name>abc)');
    const body = ast!.body;
    if (body.type === 'Alternative') {
      const group = body.elements[0];
      if (group.type === 'Group') {
        expect(group.capturing).toBe(true);
        expect(group.name).toBe('name');
      }
    }
  });

  it('应解析或运算 a|b', () => {
    const ast = parseRegex('a|b');
    expect(ast!.body.type).toBe('Disjunction');
    if (ast!.body.type === 'Disjunction') {
      expect(ast!.body.alternatives).toHaveLength(2);
    }
  });

  it('应解析量词 *', () => {
    const ast = parseRegex('a*');
    const body = ast!.body;
    if (body.type === 'Alternative') {
      expect(body.elements[0].type).toBe('Repetition');
      if (body.elements[0].type === 'Repetition') {
        expect(body.elements[0].quantifier.min).toBe(0);
        expect(body.elements[0].quantifier.max).toBeNull();
        expect(body.elements[0].quantifier.greedy).toBe(true);
      }
    }
  });

  it('应解析量词 +', () => {
    const ast = parseRegex('a+');
    const body = ast!.body;
    if (body.type === 'Alternative') {
      if (body.elements[0].type === 'Repetition') {
        expect(body.elements[0].quantifier.min).toBe(1);
        expect(body.elements[0].quantifier.max).toBeNull();
      }
    }
  });

  it('应解析量词 ?', () => {
    const ast = parseRegex('a?');
    const body = ast!.body;
    if (body.type === 'Alternative') {
      if (body.elements[0].type === 'Repetition') {
        expect(body.elements[0].quantifier.min).toBe(0);
        expect(body.elements[0].quantifier.max).toBe(1);
      }
    }
  });

  it('应解析量词 {2,5}', () => {
    const ast = parseRegex('a{2,5}');
    const body = ast!.body;
    if (body.type === 'Alternative') {
      if (body.elements[0].type === 'Repetition') {
        expect(body.elements[0].quantifier.min).toBe(2);
        expect(body.elements[0].quantifier.max).toBe(5);
      }
    }
  });

  it('应解析精确量词 {3}', () => {
    const ast = parseRegex('a{3}');
    const body = ast!.body;
    if (body.type === 'Alternative') {
      if (body.elements[0].type === 'Repetition') {
        expect(body.elements[0].quantifier.min).toBe(3);
        expect(body.elements[0].quantifier.max).toBe(3);
      }
    }
  });

  it('应解析非贪婪量词 *?', () => {
    const ast = parseRegex('a*?');
    const body = ast!.body;
    if (body.type === 'Alternative') {
      if (body.elements[0].type === 'Repetition') {
        expect(body.elements[0].quantifier.greedy).toBe(false);
      }
    }
  });

  it('应解析锚点 ^ 和 $', () => {
    const ast = parseRegex('^a$');
    const body = ast!.body;
    if (body.type === 'Alternative') {
      expect(body.elements[0].type).toBe('Anchor');
      expect(body.elements[2].type).toBe('Anchor');
      if (body.elements[0].type === 'Anchor') {
        expect(body.elements[0].kind).toBe('start');
      }
      if (body.elements[2].type === 'Anchor') {
        expect(body.elements[2].kind).toBe('end');
      }
    }
  });

  it('应解析单词边界 \\b', () => {
    const ast = parseRegex('\\b');
    const body = ast!.body;
    if (body.type === 'Alternative') {
      expect(body.elements[0].type).toBe('Anchor');
      if (body.elements[0].type === 'Anchor') {
        expect(body.elements[0].kind).toBe('boundary');
      }
    }
  });

  it('应解析反向引用 \\1', () => {
    const ast = parseRegex('(a)\\1');
    const body = ast!.body;
    if (body.type === 'Alternative') {
      expect(body.elements[1].type).toBe('Backreference');
      if (body.elements[1].type === 'Backreference') {
        expect(body.elements[1].number).toBe(1);
      }
    }
  });

  it('应解析复杂正则', () => {
    const ast = parseRegex('^[a-zA-Z]\\w{2,15}$');
    expect(ast).not.toBeNull();
    expect(ast!.type).toBe('Regex');
  });
});

describe('validateRegex', () => {
  it('合法正则应返回 valid', () => {
    expect(validateRegex('\\d+')).toEqual({ valid: true });
    expect(validateRegex('[a-z]')).toEqual({ valid: true });
    expect(validateRegex('(abc|def)')).toEqual({ valid: true });
  });

  it('空 pattern 应返回 valid', () => {
    expect(validateRegex('')).toEqual({ valid: true });
  });

  it('非法正则应返回 error', () => {
    const result = validateRegex('[');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('非法 flags 应返回 error', () => {
    const result = validateRegex('abc', 'xyz');
    expect(result.valid).toBe(false);
  });
});
