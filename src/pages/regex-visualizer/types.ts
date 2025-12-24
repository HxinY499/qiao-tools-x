/**
 * 正则可视化工具类型定义
 */

// 正则 Flag 类型
export interface RegexFlags {
  global: boolean; // g
  ignoreCase: boolean; // i
  multiline: boolean; // m
  dotAll: boolean; // s
  unicode: boolean; // u
  sticky: boolean; // y
}

// 匹配结果
export interface MatchResult {
  index: number;
  match: string;
  groups: Record<string, string | undefined>;
  captures: string[];
  start: number;
  end: number;
}

// AST 节点类型
export type ASTNodeType =
  | 'Regex'
  | 'Alternative'
  | 'Disjunction'
  | 'Group'
  | 'Assertion'
  | 'Repetition'
  | 'Char'
  | 'CharacterClass'
  | 'CharacterClassRange'
  | 'Backreference'
  | 'Anchor';

// 基础 AST 节点
export interface BaseASTNode {
  type: ASTNodeType;
  raw: string;
}

// 正则根节点
export interface RegexNode extends BaseASTNode {
  type: 'Regex';
  body: ASTNode;
  flags: string;
}

// 选择分支 (|)
export interface DisjunctionNode extends BaseASTNode {
  type: 'Disjunction';
  alternatives: ASTNode[];
}

// 序列
export interface AlternativeNode extends BaseASTNode {
  type: 'Alternative';
  elements: ASTNode[];
}

// 分组
export interface GroupNode extends BaseASTNode {
  type: 'Group';
  capturing: boolean;
  name?: string;
  body: ASTNode;
  number?: number;
}

// 断言
export interface AssertionNode extends BaseASTNode {
  type: 'Assertion';
  kind: 'lookahead' | 'lookbehind';
  negative: boolean;
  body: ASTNode;
}

// 重复
export interface RepetitionNode extends BaseASTNode {
  type: 'Repetition';
  body: ASTNode;
  quantifier: {
    min: number;
    max: number | null; // null 表示无限
    greedy: boolean;
  };
}

// 字符
export interface CharNode extends BaseASTNode {
  type: 'Char';
  value: string;
  kind: 'simple' | 'escape' | 'meta';
  codePoint?: number;
}

// 字符类 [...]
export interface CharacterClassNode extends BaseASTNode {
  type: 'CharacterClass';
  negative: boolean;
  expressions: (CharNode | CharacterClassRangeNode)[];
}

// 字符范围 a-z
export interface CharacterClassRangeNode extends BaseASTNode {
  type: 'CharacterClassRange';
  from: CharNode;
  to: CharNode;
}

// 反向引用
export interface BackreferenceNode extends BaseASTNode {
  type: 'Backreference';
  number?: number;
  name?: string;
}

// 锚点
export interface AnchorNode extends BaseASTNode {
  type: 'Anchor';
  kind: 'start' | 'end' | 'boundary' | 'non-boundary';
}

// 联合类型
export type ASTNode =
  | RegexNode
  | DisjunctionNode
  | AlternativeNode
  | GroupNode
  | AssertionNode
  | RepetitionNode
  | CharNode
  | CharacterClassNode
  | CharacterClassRangeNode
  | BackreferenceNode
  | AnchorNode;

// 正则解释项
export interface ExplanationItem {
  raw: string;
  description: string;
  type: string;
}

// 常用正则模板
export interface RegexTemplate {
  name: string;
  pattern: string;
  description: string;
  testText?: string;
}

// Store 状态
export interface RegexVisualizerState {
  pattern: string;
  testText: string;
  replacePattern: string;
  flags: RegexFlags;
  setPattern: (pattern: string) => void;
  setTestText: (text: string) => void;
  setReplacePattern: (pattern: string) => void;
  setFlags: (flags: Partial<RegexFlags>) => void;
  toggleFlag: (flag: keyof RegexFlags) => void;
  reset: () => void;
  applyTemplate: (template: RegexTemplate) => void;
}
