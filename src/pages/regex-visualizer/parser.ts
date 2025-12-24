/**
 * 简易正则解析器
 * 将正则表达式解析为 AST，用于可视化渲染
 */

import type {
  AlternativeNode,
  AnchorNode,
  ASTNode,
  BackreferenceNode,
  CharacterClassNode,
  CharacterClassRangeNode,
  CharNode,
  DisjunctionNode,
  GroupNode,
  RegexNode,
  RepetitionNode,
} from './types';

class RegexParser {
  private source: string;
  private pos: number;
  private groupCount: number;

  constructor(source: string) {
    this.source = source;
    this.pos = 0;
    this.groupCount = 0;
  }

  parse(): RegexNode {
    const body = this.parseDisjunction();
    return {
      type: 'Regex',
      body,
      flags: '',
      raw: this.source,
    };
  }

  private parseDisjunction(): ASTNode {
    const alternatives: ASTNode[] = [];
    alternatives.push(this.parseAlternative());

    while (this.match('|')) {
      alternatives.push(this.parseAlternative());
    }

    if (alternatives.length === 1) {
      return alternatives[0];
    }

    return {
      type: 'Disjunction',
      alternatives,
      raw: alternatives.map((a) => a.raw).join('|'),
    } as DisjunctionNode;
  }

  private parseAlternative(): AlternativeNode {
    const elements: ASTNode[] = [];
    const startPos = this.pos;

    while (this.pos < this.source.length && !this.isSpecialChar(this.peek())) {
      const element = this.parseElement();
      if (!element) break;
      elements.push(element);
    }

    return {
      type: 'Alternative',
      elements,
      raw: this.source.slice(startPos, this.pos),
    };
  }

  private parseElement(): ASTNode | null {
    const char = this.peek();
    if (!char || char === '|' || char === ')') return null;

    let node: ASTNode;

    if (char === '(') {
      node = this.parseGroup();
    } else if (char === '[') {
      node = this.parseCharacterClass();
    } else if (char === '\\') {
      node = this.parseEscape();
    } else if (char === '^') {
      this.advance();
      node = { type: 'Anchor', kind: 'start', raw: '^' } as AnchorNode;
    } else if (char === '$') {
      this.advance();
      node = { type: 'Anchor', kind: 'end', raw: '$' } as AnchorNode;
    } else if (char === '.') {
      this.advance();
      node = { type: 'Char', value: '.', kind: 'meta', raw: '.' } as CharNode;
    } else {
      node = this.parseChar();
    }

    // 检查量词
    return this.parseQuantifier(node);
  }

  private parseGroup(): GroupNode {
    const startPos = this.pos;
    this.expect('(');

    let capturing = true;
    let name: string | undefined;

    // 检查特殊分组语法
    if (this.peek() === '?') {
      this.advance();
      const next = this.peek();

      if (next === ':') {
        // 非捕获组 (?:...)
        this.advance();
        capturing = false;
      } else if (next === '<') {
        // 命名捕获组 (?<name>...)
        this.advance();
        const nameStart = this.pos;
        while (this.peek() && this.peek() !== '>') {
          this.advance();
        }
        name = this.source.slice(nameStart, this.pos);
        this.expect('>');
      } else if (next === '=' || next === '!') {
        // 前瞻断言 (?=...) (?!...)
        this.advance();
        const body = this.parseDisjunction();
        this.expect(')');
        return {
          type: 'Group',
          capturing: false,
          body,
          raw: this.source.slice(startPos, this.pos),
        };
      }
    }

    const groupNumber = capturing ? ++this.groupCount : undefined;
    const body = this.parseDisjunction();
    this.expect(')');

    return {
      type: 'Group',
      capturing,
      name,
      body,
      number: groupNumber,
      raw: this.source.slice(startPos, this.pos),
    };
  }

  private parseCharacterClass(): CharacterClassNode {
    const startPos = this.pos;
    this.expect('[');

    const negative = this.match('^');
    const expressions: (CharNode | CharacterClassRangeNode)[] = [];

    while (this.peek() && this.peek() !== ']') {
      const char = this.parseCharInClass();

      // 检查是否是范围 a-z
      if (this.peek() === '-' && this.source[this.pos + 1] !== ']') {
        this.advance(); // 跳过 -
        const toChar = this.parseCharInClass();
        expressions.push({
          type: 'CharacterClassRange',
          from: char,
          to: toChar,
          raw: `${char.raw}-${toChar.raw}`,
        });
      } else {
        expressions.push(char);
      }
    }

    this.expect(']');

    return {
      type: 'CharacterClass',
      negative,
      expressions,
      raw: this.source.slice(startPos, this.pos),
    };
  }

  private parseCharInClass(): CharNode {
    if (this.peek() === '\\') {
      return this.parseEscape() as CharNode;
    }
    return this.parseChar();
  }

  private parseEscape(): CharNode | BackreferenceNode | AnchorNode {
    const startPos = this.pos;
    this.expect('\\');
    const char = this.advance();

    // 反向引用 \1, \2, ...
    if (/[1-9]/.test(char)) {
      let num = char;
      while (/\d/.test(this.peek() || '')) {
        num += this.advance();
      }
      return {
        type: 'Backreference',
        number: parseInt(num, 10),
        raw: this.source.slice(startPos, this.pos),
      };
    }

    // 单词边界
    if (char === 'b') {
      return { type: 'Anchor', kind: 'boundary', raw: '\\b' };
    }
    if (char === 'B') {
      return { type: 'Anchor', kind: 'non-boundary', raw: '\\B' };
    }

    // 元字符
    const metaChars: Record<string, string> = {
      'd': '\\d',
      'D': '\\D',
      'w': '\\w',
      'W': '\\W',
      's': '\\s',
      'S': '\\S',
      'n': '\n',
      'r': '\r',
      't': '\t',
      '0': '\0',
    };

    if (char in metaChars) {
      return {
        type: 'Char',
        value: metaChars[char],
        kind: 'meta',
        raw: `\\${char}`,
      };
    }

    // 普通转义字符
    return {
      type: 'Char',
      value: char,
      kind: 'escape',
      raw: `\\${char}`,
    };
  }

  private parseChar(): CharNode {
    const char = this.advance();
    return {
      type: 'Char',
      value: char,
      kind: 'simple',
      raw: char,
    };
  }

  private parseQuantifier(node: ASTNode): ASTNode {
    const char = this.peek();
    if (!char) return node;

    let min = 0;
    let max: number | null = null;
    let raw = '';
    const startPos = this.pos;

    if (char === '*') {
      this.advance();
      min = 0;
      max = null;
      raw = '*';
    } else if (char === '+') {
      this.advance();
      min = 1;
      max = null;
      raw = '+';
    } else if (char === '?') {
      this.advance();
      min = 0;
      max = 1;
      raw = '?';
    } else if (char === '{') {
      this.advance();
      const numStart = this.pos;

      // 解析 {n}, {n,}, {n,m}
      while (/\d/.test(this.peek() || '')) {
        this.advance();
      }
      min = parseInt(this.source.slice(numStart, this.pos), 10) || 0;
      max = min;

      if (this.peek() === ',') {
        this.advance();
        if (this.peek() === '}') {
          max = null; // {n,}
        } else {
          const maxStart = this.pos;
          while (/\d/.test(this.peek() || '')) {
            this.advance();
          }
          max = parseInt(this.source.slice(maxStart, this.pos), 10) || null;
        }
      }

      this.expect('}');
      raw = this.source.slice(startPos, this.pos);
    } else {
      return node;
    }

    // 检查非贪婪模式
    const greedy = !this.match('?');
    if (!greedy) {
      raw += '?';
    }

    return {
      type: 'Repetition',
      body: node,
      quantifier: { min, max, greedy },
      raw: node.raw + raw,
    } as RepetitionNode;
  }

  private peek(): string {
    return this.source[this.pos];
  }

  private advance(): string {
    return this.source[this.pos++];
  }

  private match(char: string): boolean {
    if (this.peek() === char) {
      this.advance();
      return true;
    }
    return false;
  }

  private expect(char: string): void {
    if (!this.match(char)) {
      // 容错处理，不抛出错误
    }
  }

  private isSpecialChar(char: string): boolean {
    return char === '|' || char === ')';
  }
}

/**
 * 解析正则表达式为 AST
 */
export function parseRegex(pattern: string): RegexNode | null {
  if (!pattern) return null;

  try {
    const parser = new RegexParser(pattern);
    return parser.parse();
  } catch {
    return null;
  }
}

/**
 * 验证正则表达式是否有效
 */
export function validateRegex(pattern: string, flags: string = ''): { valid: boolean; error?: string } {
  if (!pattern) {
    return { valid: true };
  }

  try {
    new RegExp(pattern, flags);
    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : '无效的正则表达式',
    };
  }
}
