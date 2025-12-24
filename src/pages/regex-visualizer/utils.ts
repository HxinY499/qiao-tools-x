/**
 * 正则可视化工具函数
 */

import { META_CHAR_EXPLANATIONS } from './constants';
import type { ASTNode, ExplanationItem, MatchResult, RegexFlags } from './types';

/**
 * 将 flags 对象转换为字符串
 */
export function flagsToString(flags: RegexFlags): string {
  let result = '';
  if (flags.global) result += 'g';
  if (flags.ignoreCase) result += 'i';
  if (flags.multiline) result += 'm';
  if (flags.dotAll) result += 's';
  if (flags.unicode) result += 'u';
  if (flags.sticky) result += 'y';
  return result;
}

/**
 * 创建正则表达式对象
 */
export function createRegex(pattern: string, flags: RegexFlags): RegExp | null {
  if (!pattern) return null;

  try {
    return new RegExp(pattern, flagsToString(flags));
  } catch {
    return null;
  }
}

/**
 * 执行匹配并返回所有结果
 */
export function executeMatch(pattern: string, flags: RegexFlags, testText: string): MatchResult[] {
  const regex = createRegex(pattern, flags);
  if (!regex || !testText) return [];

  const results: MatchResult[] = [];

  if (flags.global) {
    let match: RegExpExecArray | null;
    const seen = new Set<number>();

    while ((match = regex.exec(testText)) !== null) {
      // 防止无限循环（空匹配）
      if (seen.has(match.index)) {
        regex.lastIndex++;
        continue;
      }
      seen.add(match.index);

      results.push({
        index: results.length,
        match: match[0],
        groups: match.groups || {},
        captures: match.slice(1),
        start: match.index,
        end: match.index + match[0].length,
      });

      // 防止无限循环
      if (match[0].length === 0) {
        regex.lastIndex++;
      }
    }
  } else {
    const match = regex.exec(testText);
    if (match) {
      results.push({
        index: 0,
        match: match[0],
        groups: match.groups || {},
        captures: match.slice(1),
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return results;
}

/**
 * 执行替换预览
 */
export function executeReplace(
  pattern: string,
  flags: RegexFlags,
  testText: string,
  replacePattern: string,
): string | null {
  const regex = createRegex(pattern, flags);
  if (!regex || !testText) return null;

  try {
    return testText.replace(regex, replacePattern);
  } catch {
    return null;
  }
}

/**
 * 生成正则解释
 */
export function generateExplanation(pattern: string): ExplanationItem[] {
  if (!pattern) return [];

  const items: ExplanationItem[] = [];
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];

    // 转义序列
    if (char === '\\' && i + 1 < pattern.length) {
      const escaped = pattern.slice(i, i + 2);
      const explanation = META_CHAR_EXPLANATIONS[escaped];

      if (explanation) {
        items.push({ raw: escaped, description: explanation, type: 'meta' });
      } else {
        items.push({
          raw: escaped,
          description: `转义字符 "${pattern[i + 1]}"`,
          type: 'escape',
        });
      }
      i += 2;
      continue;
    }

    // 字符类
    if (char === '[') {
      const start = i;
      let depth = 1;
      i++;
      while (i < pattern.length && depth > 0) {
        if (pattern[i] === '[' && pattern[i - 1] !== '\\') depth++;
        if (pattern[i] === ']' && pattern[i - 1] !== '\\') depth--;
        i++;
      }
      const charClass = pattern.slice(start, i);
      const negative = charClass[1] === '^';
      items.push({
        raw: charClass,
        description: negative ? `不匹配字符集 ${charClass}` : `匹配字符集 ${charClass}`,
        type: 'class',
      });
      continue;
    }

    // 分组
    if (char === '(') {
      const start = i;
      let depth = 1;
      i++;
      while (i < pattern.length && depth > 0) {
        if (pattern[i] === '(' && pattern[i - 1] !== '\\') depth++;
        if (pattern[i] === ')' && pattern[i - 1] !== '\\') depth--;
        i++;
      }
      const group = pattern.slice(start, i);

      let description = '捕获组';
      if (group.startsWith('(?:')) {
        description = '非捕获组';
      } else if (group.startsWith('(?=')) {
        description = '正向前瞻断言';
      } else if (group.startsWith('(?!')) {
        description = '负向前瞻断言';
      } else if (group.startsWith('(?<=')) {
        description = '正向后瞻断言';
      } else if (group.startsWith('(?<!')) {
        description = '负向后瞻断言';
      } else if (group.startsWith('(?<')) {
        const nameMatch = group.match(/\(\?<(\w+)>/);
        if (nameMatch) {
          description = `命名捕获组 "${nameMatch[1]}"`;
        }
      }

      items.push({ raw: group, description, type: 'group' });
      continue;
    }

    // 量词
    if (char === '{') {
      const start = i;
      while (i < pattern.length && pattern[i] !== '}') {
        i++;
      }
      i++; // 跳过 }
      const quantifier = pattern.slice(start, i);
      const match = quantifier.match(/\{(\d+)(?:,(\d*))?\}/);

      if (match) {
        const min = match[1];
        const max = match[2];
        let description = '';

        if (max === undefined) {
          description = `精确匹配 ${min} 次`;
        } else if (max === '') {
          description = `匹配至少 ${min} 次`;
        } else {
          description = `匹配 ${min} 到 ${max} 次`;
        }

        items.push({ raw: quantifier, description, type: 'quantifier' });
      }
      continue;
    }

    // 单字符元字符
    const singleMeta = META_CHAR_EXPLANATIONS[char];
    if (singleMeta) {
      items.push({ raw: char, description: singleMeta, type: 'meta' });
      i++;
      continue;
    }

    // 普通字符
    items.push({
      raw: char,
      description: `匹配字符 "${char}"`,
      type: 'literal',
    });
    i++;
  }

  return items;
}

/**
 * 获取 AST 节点的描述
 */
export function getNodeDescription(node: ASTNode): string {
  switch (node.type) {
    case 'Regex':
      return '正则表达式';
    case 'Alternative':
      return '序列';
    case 'Disjunction':
      return '或运算';
    case 'Group':
      if ('capturing' in node) {
        if (node.name) return `命名捕获组 <${node.name}>`;
        if (node.capturing) return `捕获组 #${node.number}`;
        return '非捕获组';
      }
      return '分组';
    case 'Repetition':
      if ('quantifier' in node) {
        const { min, max, greedy } = node.quantifier;
        const mode = greedy ? '' : '（非贪婪）';
        if (max === null) {
          if (min === 0) return `零次或多次${mode}`;
          if (min === 1) return `一次或多次${mode}`;
          return `至少 ${min} 次${mode}`;
        }
        if (min === max) return `精确 ${min} 次${mode}`;
        if (min === 0 && max === 1) return `可选${mode}`;
        return `${min} 到 ${max} 次${mode}`;
      }
      return '重复';
    case 'Char':
      if ('kind' in node) {
        if (node.kind === 'meta') {
          return META_CHAR_EXPLANATIONS[node.raw] || node.raw;
        }
        if (node.kind === 'escape') {
          return `转义字符 ${node.value}`;
        }
      }
      return `字符 "${node.raw}"`;
    case 'CharacterClass':
      if ('negative' in node) {
        return node.negative ? '排除字符集' : '字符集';
      }
      return '字符集';
    case 'CharacterClassRange':
      return `范围 ${node.raw}`;
    case 'Anchor':
      if ('kind' in node) {
        switch (node.kind) {
          case 'start':
            return '字符串开头';
          case 'end':
            return '字符串结尾';
          case 'boundary':
            return '单词边界';
          case 'non-boundary':
            return '非单词边界';
        }
      }
      return '锚点';
    case 'Backreference':
      if ('number' in node && node.number) {
        return `反向引用 #${node.number}`;
      }
      if ('name' in node && node.name) {
        return `反向引用 <${node.name}>`;
      }
      return '反向引用';
    default:
      return node.type;
  }
}

/**
 * 高亮文本中的匹配结果
 */
export interface HighlightSegment {
  text: string;
  isMatch: boolean;
  matchIndex?: number;
}

export function highlightMatches(text: string, matches: MatchResult[]): HighlightSegment[] {
  if (!matches.length) {
    return [{ text, isMatch: false }];
  }

  const segments: HighlightSegment[] = [];
  let lastEnd = 0;

  // 按位置排序
  const sortedMatches = [...matches].sort((a, b) => a.start - b.start);

  for (const match of sortedMatches) {
    // 添加匹配前的文本
    if (match.start > lastEnd) {
      segments.push({
        text: text.slice(lastEnd, match.start),
        isMatch: false,
      });
    }

    // 添加匹配的文本
    segments.push({
      text: match.match,
      isMatch: true,
      matchIndex: match.index,
    });

    lastEnd = match.end;
  }

  // 添加最后的文本
  if (lastEnd < text.length) {
    segments.push({
      text: text.slice(lastEnd),
      isMatch: false,
    });
  }

  return segments;
}
