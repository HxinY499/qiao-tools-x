import { diffChars, diffLines } from 'diff';

import type { DiffLine, DiffLineType, DiffSegment, TextDiffStats } from './types';

const LINE_BREAK_REGEX = /\r\n/g;

function splitIntoLines(text: string): string[] {
  if (!text) {
    return [];
  }

  return text.replace(LINE_BREAK_REGEX, '\n').split('\n');
}

function createCharSegments(
  leftLine: string,
  rightLine: string,
): {
  left: DiffSegment[];
  right: DiffSegment[];
} {
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

function shouldSkipLastEmptyLine(lines: string[], rawValue: string, lineIndex: number): boolean {
  const isLast = lineIndex === lines.length - 1;
  const isEmpty = lines[lineIndex] === '';
  const hasTrailingNewline = rawValue.endsWith('\n');

  return isLast && isEmpty && hasTrailingNewline;
}

export function buildDiffLines(leftText: string, rightText: string): DiffLine[] {
  const diffParts = diffLines(leftText ?? '', rightText ?? '');
  const result: DiffLine[] = [];

  let leftLineNumber = 1;
  let rightLineNumber = 1;
  let globalIndex = 0;
  let index = 0;

  while (index < diffParts.length) {
    const part = diffParts[index];

    if (!part.added && !part.removed) {
      const lines = splitIntoLines(part.value);

      lines.forEach((line, lineIndex) => {
        if (shouldSkipLastEmptyLine(lines, part.value, lineIndex)) {
          return;
        }

        const currentLeft = leftLineNumber;
        const currentRight = rightLineNumber;

        result.push({
          index: globalIndex,
          leftLineNumber: currentLeft,
          rightLineNumber: currentRight,
          type: 'unchanged',
          leftSegments: [{ value: line, type: 'unchanged' }],
          rightSegments: [{ value: line, type: 'unchanged' }],
        });

        leftLineNumber += 1;
        rightLineNumber += 1;
        globalIndex += 1;
      });

      index += 1;
      continue;
    }

    if (part.removed) {
      const next = diffParts[index + 1];
      const removedLines = splitIntoLines(part.value);
      const cleanedRemoved = removedLines.filter((line, lineIndex) => {
        void line;
        return !shouldSkipLastEmptyLine(removedLines, part.value, lineIndex);
      });

      if (next && next.added) {
        const addedLines = splitIntoLines(next.value);
        const cleanedAdded = addedLines.filter((line, lineIndex) => {
          void line;
          return !shouldSkipLastEmptyLine(addedLines, next.value, lineIndex);
        });

        const maxLen = Math.max(cleanedRemoved.length, cleanedAdded.length);

        for (let i = 0; i < maxLen; i += 1) {
          const leftLine = cleanedRemoved[i] ?? '';
          const rightLine = cleanedAdded[i] ?? '';
          const hasLeft = i < cleanedRemoved.length;
          const hasRight = i < cleanedAdded.length;

          let currentType: DiffLineType;

          if (hasLeft && hasRight) {
            currentType = leftLine === rightLine ? 'unchanged' : 'modified';
          } else if (hasLeft) {
            currentType = 'removed';
          } else {
            currentType = 'added';
          }

          const currentLeftNumber = hasLeft ? leftLineNumber : null;
          const currentRightNumber = hasRight ? rightLineNumber : null;

          let leftSegments: DiffSegment[] = [];
          let rightSegments: DiffSegment[] = [];

          if (hasLeft && hasRight) {
            const charSegments = createCharSegments(leftLine, rightLine);
            leftSegments = charSegments.left;
            rightSegments = charSegments.right;
          } else if (hasLeft) {
            if (leftLine) {
              leftSegments = [{ value: leftLine, type: 'removed' }];
            }
          } else if (hasRight) {
            if (rightLine) {
              rightSegments = [{ value: rightLine, type: 'added' }];
            }
          }

          result.push({
            index: globalIndex,
            leftLineNumber: currentLeftNumber,
            rightLineNumber: currentRightNumber,
            type: currentType,
            leftSegments,
            rightSegments,
          });

          if (hasLeft) {
            leftLineNumber += 1;
          }

          if (hasRight) {
            rightLineNumber += 1;
          }

          globalIndex += 1;
        }

        index += 2;
        continue;
      }

      cleanedRemoved.forEach((line) => {
        const currentLeftNumber = leftLineNumber;

        result.push({
          index: globalIndex,
          leftLineNumber: currentLeftNumber,
          rightLineNumber: null,
          type: 'removed',
          leftSegments: line ? [{ value: line, type: 'removed' }] : [],
          rightSegments: [],
        });

        leftLineNumber += 1;
        globalIndex += 1;
      });

      index += 1;
      continue;
    }

    if (part.added) {
      const addedLines = splitIntoLines(part.value);
      const cleanedAdded = addedLines.filter((line, lineIndex) => {
        void line;
        return !shouldSkipLastEmptyLine(addedLines, part.value, lineIndex);
      });

      cleanedAdded.forEach((line) => {
        const currentRightNumber = rightLineNumber;

        result.push({
          index: globalIndex,
          leftLineNumber: null,
          rightLineNumber: currentRightNumber,
          type: 'added',
          leftSegments: [],
          rightSegments: line ? [{ value: line, type: 'added' }] : [],
        });

        rightLineNumber += 1;
        globalIndex += 1;
      });

      index += 1;
      continue;
    }

    index += 1;
  }

  return result;
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
