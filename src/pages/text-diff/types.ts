export type DiffViewMode = 'all' | 'changes';

export type DiffLineType = 'unchanged' | 'added' | 'removed' | 'modified';

export type DiffSegmentType = 'unchanged' | 'added' | 'removed';

export interface DiffSegment {
  value: string;
  type: DiffSegmentType;
}

export interface DiffLine {
  index: number;
  leftLineNumber: number | null;
  rightLineNumber: number | null;
  type: DiffLineType;
  leftSegments: DiffSegment[];
  rightSegments: DiffSegment[];
}

export interface TextDiffStats {
  leftLineCount: number;
  rightLineCount: number;
  leftCharCount: number;
  rightCharCount: number;
}
