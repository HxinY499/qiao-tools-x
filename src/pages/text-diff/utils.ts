import { diffChars, diffLines } from 'diff';

import type { DiffLine, DiffLineType, DiffSegment, TextDiffStats } from './types';

const LINE_BREAK_REGEX = /\r\n/g;

/**
 * 单行长度超过该阈值时，跳过字符级 diff（diffChars 是 O(n*m)，超长行会卡死主线程），
 * 直接整行标记为 modified。
 */
export const MAX_CHAR_DIFF_LINE_LENGTH = 2000;

function splitIntoLines(text: string): string[] {
  if (!text) {
    return [];
  }

  return text.replace(LINE_BREAK_REGEX, '\n').split('\n');
}

/**
 * 将一段 diff part 的原始字符串切成行，并剔除「以换行结尾导致的尾部空行」。
 * 例如 "a\nb\n" 会被 split 成 ['a', 'b', '']，最后的 '' 是换行产生的，需要去掉。
 */
function cleanLines(rawValue: string): string[] {
  const lines = splitIntoLines(rawValue);
  const hasTrailingNewline = rawValue.endsWith('\n');

  if (hasTrailingNewline && lines.length > 0 && lines[lines.length - 1] === '') {
    return lines.slice(0, -1);
  }

  return lines;
}

function createCharSegments(
  leftLine: string,
  rightLine: string,
): {
  left: DiffSegment[];
  right: DiffSegment[];
} {
  // 超长行跳过字符级 diff，直接整行标记，避免 O(n*m) 卡顿
  if (leftLine.length > MAX_CHAR_DIFF_LINE_LENGTH || rightLine.length > MAX_CHAR_DIFF_LINE_LENGTH) {
    return {
      left: leftLine ? [{ value: leftLine, type: 'removed' }] : [],
      right: rightLine ? [{ value: rightLine, type: 'added' }] : [],
    };
  }

  const rawDiff = diffChars(leftLine, rightLine);
  const leftSegments: DiffSegment[] = [];
  const rightSegments: DiffSegment[] = [];

  rawDiff.forEach((part) => {
    if (part.added) {
      if (part.value) {
        rightSegments.push({ value: part.value, type: 'added' });
      }
      return;
    }

    if (part.removed) {
      if (part.value) {
        leftSegments.push({ value: part.value, type: 'removed' });
      }
      return;
    }

    if (part.value) {
      leftSegments.push({ value: part.value, type: 'unchanged' });
      rightSegments.push({ value: part.value, type: 'unchanged' });
    }
  });

  return { left: leftSegments, right: rightSegments };
}

/**
 * 用最长公共子序列（LCS）找出删除块与新增块中「内容完全相同」的行的配对下标。
 * 返回的配对中 left[k] 对应 removed 块第 left[k] 行，right[k] 对应 added 块第 right[k] 行。
 *
 * 这些相同的锚点把两块切成若干区间，区间内的剩余行才两两做字符级 diff，
 * 从而避免「删 1 行 + 加 3 行」这种数量不对等时按下标硬配对导致的高亮失真。
 */
function findCommonLinePairs(removed: string[], added: string[]): Array<{ left: number; right: number }> {
  const m = removed.length;
  const n = added.length;

  // dp[i][j]：removed[i..] 与 added[j..] 的 LCS 长度
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (removed[i] === added[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const pairs: Array<{ left: number; right: number }> = [];
  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (removed[i] === added[j]) {
      pairs.push({ left: i, right: j });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }

  return pairs;
}

interface DiffBuilderState {
  result: DiffLine[];
  leftLineNumber: number;
  rightLineNumber: number;
  globalIndex: number;
}

/** 向结果追加一行，并推进对应的行号与全局下标 */
function pushLine(
  state: DiffBuilderState,
  params: {
    type: DiffLineType;
    hasLeft: boolean;
    hasRight: boolean;
    leftSegments: DiffSegment[];
    rightSegments: DiffSegment[];
  },
): void {
  state.result.push({
    index: state.globalIndex,
    leftLineNumber: params.hasLeft ? state.leftLineNumber : null,
    rightLineNumber: params.hasRight ? state.rightLineNumber : null,
    type: params.type,
    leftSegments: params.leftSegments,
    rightSegments: params.rightSegments,
  });

  if (params.hasLeft) {
    state.leftLineNumber += 1;
  }
  if (params.hasRight) {
    state.rightLineNumber += 1;
  }
  state.globalIndex += 1;
}

/** 处理纯删除行（无对应新增） */
function emitRemovedLine(state: DiffBuilderState, line: string): void {
  pushLine(state, {
    type: 'removed',
    hasLeft: true,
    hasRight: false,
    leftSegments: line ? [{ value: line, type: 'removed' }] : [],
    rightSegments: [],
  });
}

/** 处理纯新增行（无对应删除） */
function emitAddedLine(state: DiffBuilderState, line: string): void {
  pushLine(state, {
    type: 'added',
    hasLeft: false,
    hasRight: true,
    leftSegments: [],
    rightSegments: line ? [{ value: line, type: 'added' }] : [],
  });
}

/**
 * 处理一对「删除块 + 新增块」相邻出现的情况。
 * 先用 LCS 找出两块中内容相同的锚点行（标 unchanged），
 * 锚点之间的剩余行再两两配对做字符级 diff（modified），配不上的整行标 added/removed。
 */
function emitReplacedBlock(state: DiffBuilderState, removed: string[], added: string[]): void {
  const pairs = findCommonLinePairs(removed, added);

  let leftCursor = 0;
  let rightCursor = 0;

  const emitGap = (leftEnd: number, rightEnd: number): void => {
    const gapLeft = removed.slice(leftCursor, leftEnd);
    const gapRight = added.slice(rightCursor, rightEnd);
    const maxLen = Math.max(gapLeft.length, gapRight.length);

    for (let k = 0; k < maxLen; k += 1) {
      const hasLeft = k < gapLeft.length;
      const hasRight = k < gapRight.length;

      if (hasLeft && hasRight) {
        const leftLine = gapLeft[k];
        const rightLine = gapRight[k];
        const charSegments = createCharSegments(leftLine, rightLine);
        pushLine(state, {
          type: leftLine === rightLine ? 'unchanged' : 'modified',
          hasLeft: true,
          hasRight: true,
          leftSegments: charSegments.left,
          rightSegments: charSegments.right,
        });
      } else if (hasLeft) {
        emitRemovedLine(state, gapLeft[k]);
      } else {
        emitAddedLine(state, gapRight[k]);
      }
    }
  };

  for (const pair of pairs) {
    emitGap(pair.left, pair.right);

    // 锚点行：两侧内容完全相同，标 unchanged
    const anchorLine = removed[pair.left];
    pushLine(state, {
      type: 'unchanged',
      hasLeft: true,
      hasRight: true,
      leftSegments: [{ value: anchorLine, type: 'unchanged' }],
      rightSegments: [{ value: anchorLine, type: 'unchanged' }],
    });

    leftCursor = pair.left + 1;
    rightCursor = pair.right + 1;
  }

  // 处理最后一个锚点之后的剩余行
  emitGap(removed.length, added.length);
}

export function buildDiffLines(leftText: string, rightText: string): DiffLine[] {
  const diffParts = diffLines(leftText ?? '', rightText ?? '');

  const state: DiffBuilderState = {
    result: [],
    leftLineNumber: 1,
    rightLineNumber: 1,
    globalIndex: 0,
  };

  let index = 0;

  while (index < diffParts.length) {
    const part = diffParts[index];

    if (!part.added && !part.removed) {
      cleanLines(part.value).forEach((line) => {
        pushLine(state, {
          type: 'unchanged',
          hasLeft: true,
          hasRight: true,
          leftSegments: [{ value: line, type: 'unchanged' }],
          rightSegments: [{ value: line, type: 'unchanged' }],
        });
      });

      index += 1;
      continue;
    }

    if (part.removed) {
      const removed = cleanLines(part.value);
      const next = diffParts[index + 1];

      if (next && next.added) {
        emitReplacedBlock(state, removed, cleanLines(next.value));
        index += 2;
        continue;
      }

      removed.forEach((line) => emitRemovedLine(state, line));
      index += 1;
      continue;
    }

    // part.added（前面没有相邻的 removed）
    cleanLines(part.value).forEach((line) => emitAddedLine(state, line));
    index += 1;
  }

  return state.result;
}

function countLines(text: string): number {
  if (!text) {
    return 0;
  }

  return text.replace(LINE_BREAK_REGEX, '\n').split('\n').length;
}

export function calculateStats(leftText: string, rightText: string): TextDiffStats {
  return {
    leftLineCount: countLines(leftText),
    rightLineCount: countLines(rightText),
    leftCharCount: leftText.length,
    rightCharCount: rightText.length,
  };
}

export function buildDiffSummaryText(lines: DiffLine[]): string {
  if (!lines.length) {
    return '';
  }

  const typeLabelMap: Record<DiffLineType, string> = {
    unchanged: '=',
    added: '+',
    removed: '-',
    modified: '~',
  };

  return lines
    .map((line) => {
      const marker = typeLabelMap[line.type] ?? '?';
      const leftNo = line.leftLineNumber ?? '-';
      const rightNo = line.rightLineNumber ?? '-';
      const leftText = line.leftSegments.map((segment) => segment.value).join('');
      const rightText = line.rightSegments.map((segment) => segment.value).join('');

      if (line.type === 'modified') {
        return `[${marker}] L${leftNo} / R${rightNo} | ${leftText} => ${rightText}`;
      }

      const content = rightText || leftText;
      return `[${marker}] L${leftNo} / R${rightNo} | ${content}`;
    })
    .join('\n');
}
