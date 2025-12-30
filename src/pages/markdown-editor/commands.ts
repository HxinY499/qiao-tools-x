import {
  Bold,
  CheckSquare,
  Code,
  GitBranch,
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  ListTree,
  LucideIcon,
  Minus,
  Quote,
  Sigma,
  Square,
  Strikethrough,
  Table,
  Workflow,
} from 'lucide-react';

import { generateToc, insertAtLineStart, insertTextAtCursor, wrapSelection } from './utils';

export interface CommandShortcut {
  key: string; // 主键（如 'b', '1', 'k'）
  ctrl?: boolean; // Ctrl (Windows/Linux) 或 ⌘ (Mac)
  shift?: boolean;
  alt?: boolean;
}

export interface CommandItem {
  id: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  keywords?: string[];
  isTable?: boolean;
  isChart?: boolean; // 图表下拉菜单
  isHeading?: boolean; // 标题下拉菜单
  isText?: boolean;
  text?: string;
  shortcut?: CommandShortcut;
}

export interface CommandGroup {
  items: CommandItem[];
}

// 命令定义（不含 action）
export const COMMAND_GROUPS: CommandGroup[] = [
  {
    items: [
      {
        id: 'heading',
        icon: Heading,
        label: '标题',
        description: '插入标题',
        keywords: ['heading', 'title', '标题', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        isHeading: true,
      },
    ],
  },
  {
    items: [
      {
        id: 'bold',
        icon: Bold,
        label: '粗体',
        description: '加粗文字',
        keywords: ['bold', 'strong', '加粗'],
        shortcut: { key: 'b', ctrl: true },
      },
      {
        id: 'italic',
        icon: Italic,
        label: '斜体',
        description: '倾斜文字',
        keywords: ['italic', 'em', '斜体'],
        shortcut: { key: 'i', ctrl: true },
      },
      {
        id: 'strikethrough',
        icon: Strikethrough,
        label: '删除线',
        description: '划掉文字',
        keywords: ['strikethrough', 'del', '删除'],
        shortcut: { key: 's', ctrl: true, shift: true },
      },
    ],
  },
  {
    items: [
      {
        id: 'inlineCode',
        icon: Code,
        label: '行内代码',
        description: '内联代码',
        keywords: ['code', 'inline', '代码'],
        shortcut: { key: 'e', ctrl: true },
      },
      {
        id: 'codeBlock',
        icon: Code,
        label: '代码块',
        description: '多行代码',
        keywords: ['code', 'block', '代码块'],
        isText: true,
        text: '</>',
        shortcut: { key: 'k', ctrl: true, shift: true },
      },
    ],
  },
  {
    items: [
      {
        id: 'link',
        icon: Link,
        label: '链接',
        description: '插入链接',
        keywords: ['link', 'url', '链接'],
        shortcut: { key: 'k', ctrl: true },
      },
      {
        id: 'image',
        icon: Image,
        label: '图片',
        description: '插入图片',
        keywords: ['image', 'img', '图片'],
        shortcut: { key: 'i', ctrl: true, shift: true },
      },
    ],
  },
  {
    items: [
      {
        id: 'ul',
        icon: List,
        label: '无序列表',
        description: '项目符号列表',
        keywords: ['list', 'ul', '列表', '无序'],
        shortcut: { key: 'u', ctrl: true },
      },
      {
        id: 'ol',
        icon: ListOrdered,
        label: '有序列表',
        description: '数字编号列表',
        keywords: ['list', 'ol', 'ordered', '列表', '有序'],
        shortcut: { key: 'o', ctrl: true, shift: true },
      },
      {
        id: 'quote',
        icon: Quote,
        label: '引用',
        description: '引用块',
        keywords: ['quote', 'blockquote', '引用'],
        shortcut: { key: 'q', ctrl: true, shift: true },
      },
      {
        id: 'taskUnchecked',
        icon: Square,
        label: '任务列表',
        description: '未完成任务',
        keywords: ['task', 'todo', 'checkbox', '任务', '待办'],
        shortcut: { key: 'x', ctrl: true, shift: true },
      },
      {
        id: 'taskChecked',
        icon: CheckSquare,
        label: '已完成任务',
        description: '已完成任务',
        keywords: ['task', 'done', 'checked', '任务', '完成'],
      },
    ],
  },
  {
    items: [
      {
        id: 'inlineMath',
        icon: Sigma,
        label: '行内公式',
        description: '行内数学公式',
        keywords: ['math', 'latex', 'katex', '公式', '数学'],
        shortcut: { key: 'm', ctrl: true },
      },
      {
        id: 'blockMath',
        icon: Sigma,
        label: '公式块',
        description: '块级数学公式',
        keywords: ['math', 'latex', 'katex', '公式', '数学'],
        isText: true,
        text: '∑',
        shortcut: { key: 'm', ctrl: true, shift: true },
      },
    ],
  },
  {
    items: [
      { id: 'table', icon: Table, label: '表格', description: '插入表格', keywords: ['table', '表格'], isTable: true },
      {
        id: 'hr',
        icon: Minus,
        label: '分隔线',
        description: '水平分隔线',
        keywords: ['hr', 'horizontal', 'divider', '分隔', '横线'],
        shortcut: { key: '-', ctrl: true, shift: true },
      },
      {
        id: 'toc',
        icon: ListTree,
        label: '目录',
        description: '生成文档目录',
        keywords: ['toc', 'table of contents', '目录'],
      },
      {
        id: 'chart',
        icon: Workflow,
        label: '图表',
        description: '插入 Mermaid 图表',
        keywords: ['chart', 'mermaid', 'diagram', '图表', '流程图'],
        isChart: true,
      },
    ],
  },
];

// 扁平化所有命令
export const ALL_COMMANDS: CommandItem[] = COMMAND_GROUPS.flatMap((group) => group.items);

// 扁平化所有项目（包括分隔符，用于 Toolbar）
export type FlatItem = CommandItem | 'separator';
export const FLAT_ITEMS_WITH_SEPARATOR: FlatItem[] = COMMAND_GROUPS.flatMap((group, index) =>
  index < COMMAND_GROUPS.length - 1 ? [...group.items, 'separator' as const] : group.items,
);

// 默认表格模板
export const DEFAULT_TABLE = `| 标题 1 | 标题 2 | 标题 3 |
| :--- | :---: | ---: |
|  |  |  |
|  |  |  |`;

// 标题级别命令
export const HEADING_ITEMS: CommandItem[] = [
  { id: 'h1', icon: Heading1, label: '一级标题', shortcut: { key: '1', ctrl: true } },
  { id: 'h2', icon: Heading2, label: '二级标题', shortcut: { key: '2', ctrl: true } },
  { id: 'h3', icon: Heading3, label: '三级标题', shortcut: { key: '3', ctrl: true } },
  { id: 'h4', icon: Heading4, label: '四级标题', shortcut: { key: '4', ctrl: true } },
  { id: 'h5', icon: Heading5, label: '五级标题', shortcut: { key: '5', ctrl: true } },
  { id: 'h6', icon: Heading6, label: '六级标题', shortcut: { key: '6', ctrl: true } },
];

// Mermaid 图表模板
export interface ChartTemplate {
  id: string;
  icon: LucideIcon;
  label: string;
  template: string;
}

export const CHART_TEMPLATES: ChartTemplate[] = [
  {
    id: 'flowchart',
    icon: Workflow,
    label: '流程图',
    template: `\`\`\`mermaid
flowchart TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作]
    B -->|否| D[其他操作]
    C --> E[结束]
    D --> E
\`\`\``,
  },
  {
    id: 'sequence',
    icon: GitBranch,
    label: '时序图',
    template: `\`\`\`mermaid
sequenceDiagram
    participant A as 用户
    participant B as 系统
    A->>B: 发送请求
    B-->>A: 返回响应
\`\`\``,
  },
  {
    id: 'state',
    icon: GitBranch,
    label: '状态图',
    template: `\`\`\`mermaid
stateDiagram-v2
    [*] --> 待处理
    待处理 --> 处理中: 开始处理
    处理中 --> 已完成: 处理完成
    处理中 --> 失败: 处理失败
    失败 --> 待处理: 重试
    已完成 --> [*]
\`\`\``,
  },
  {
    id: 'gantt',
    icon: GitBranch,
    label: '甘特图',
    template: `\`\`\`mermaid
gantt
    title 项目计划
    dateFormat YYYY-MM-DD
    section 阶段一
        任务1: a1, 2024-01-01, 7d
        任务2: a2, after a1, 5d
    section 阶段二
        任务3: b1, after a2, 6d
        任务4: b2, after b1, 4d
\`\`\``,
  },
  {
    id: 'class',
    icon: GitBranch,
    label: '类图',
    template: `\`\`\`mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +bark()
    }
    class Cat {
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat
\`\`\``,
  },
  {
    id: 'pie',
    icon: GitBranch,
    label: '饼图',
    template: `\`\`\`mermaid
pie title 数据分布
    "类别A": 40
    "类别B": 30
    "类别C": 20
    "类别D": 10
\`\`\``,
  },
  {
    id: 'mindmap',
    icon: GitBranch,
    label: '脑图',
    template: `\`\`\`mermaid
mindmap
  root((项目规划))
    需求分析
      用户调研
      竞品分析
      需求文档
    设计阶段
      原型设计
      UI设计
      技术方案
    开发实现
      前端开发
        页面开发
        组件封装
      后端开发
        接口开发
        数据库设计
    测试上线
      单元测试
      集成测试
      部署发布
\`\`\``,
  },
];

// 命令执行器类型
export type CommandExecutor = (
  textarea: HTMLTextAreaElement,
) => { selectionStart: number; selectionEnd: number } | void;

// 获取命令执行器
export function getCommandExecutor(
  commandId: string,
  options: {
    content?: string;
    onTableInsert?: (markdown: string) => void;
  } = {},
): CommandExecutor | null {
  const { content = '', onTableInsert } = options;

  switch (commandId) {
    case 'h1':
      return (ta) => insertAtLineStart(ta, '# ');
    case 'h2':
      return (ta) => insertAtLineStart(ta, '## ');
    case 'h3':
      return (ta) => insertAtLineStart(ta, '### ');
    case 'h4':
      return (ta) => insertAtLineStart(ta, '#### ');
    case 'h5':
      return (ta) => insertAtLineStart(ta, '##### ');
    case 'h6':
      return (ta) => insertAtLineStart(ta, '###### ');
    case 'bold':
      return (ta) => wrapSelection(ta, '**');
    case 'italic':
      return (ta) => wrapSelection(ta, '*');
    case 'strikethrough':
      return (ta) => wrapSelection(ta, '~~');
    case 'inlineCode':
      return (ta) => wrapSelection(ta, '`');
    case 'codeBlock':
      return (ta) => insertTextAtCursor(ta, '```\n\n```', 4, 4);
    case 'link':
      return (ta) => {
        const start = ta.selectionStart;
        const selectedText = ta.value.substring(start, ta.selectionEnd);
        if (selectedText) {
          const text = `[${selectedText}](url)`;
          return {
            ...insertTextAtCursor(ta, text),
            selectionStart: start + selectedText.length + 3,
            selectionEnd: start + selectedText.length + 6,
          };
        }
        return insertTextAtCursor(ta, '[链接文本](url)', 1, 5);
      };
    case 'image':
      return (ta) => insertTextAtCursor(ta, '![图片描述](url)', 2, 6);
    case 'ul':
      return (ta) => insertAtLineStart(ta, '- ');
    case 'ol':
      return (ta) => insertAtLineStart(ta, '1. ');
    case 'quote':
      return (ta) => insertAtLineStart(ta, '> ');
    case 'taskUnchecked':
      return (ta) => insertAtLineStart(ta, '- [ ] 待办');
    case 'taskChecked':
      return (ta) => insertAtLineStart(ta, '- [x] 已完成');
    case 'hr':
      return (ta) => insertTextAtCursor(ta, '\n---\n');
    case 'inlineMath':
      return (ta) => wrapSelection(ta, '$');
    case 'blockMath':
      return (ta) => insertTextAtCursor(ta, '$$\n\n$$', 3, 3);
    case 'table':
      return () => {
        onTableInsert?.('\n' + DEFAULT_TABLE + '\n');
      };
    case 'toc':
      return (ta) => {
        const toc = generateToc(content);
        if (!toc) return { selectionStart: ta.selectionStart, selectionEnd: ta.selectionEnd };
        return insertTextAtCursor(ta, toc + '\n\n');
      };
    default:
      return null;
  }
}

// 过滤命令
export function filterCommands(commands: CommandItem[], filter: string): CommandItem[] {
  if (!filter) return commands;
  const lowerFilter = filter.toLowerCase();
  return commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(lowerFilter) ||
      cmd.description?.toLowerCase().includes(lowerFilter) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(lowerFilter)),
  );
}

// 检测是否为 Mac 系统
export const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

// 格式化快捷键显示文本
export function formatShortcut(shortcut: CommandShortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push(isMac ? '⌘' : 'Ctrl');
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
  parts.push(shortcut.key.toUpperCase());
  return parts.join(isMac ? '' : '+');
}

// 检查键盘事件是否匹配快捷键
export function matchShortcut(e: KeyboardEvent, shortcut: CommandShortcut): boolean {
  const ctrlOrMeta = isMac ? e.metaKey : e.ctrlKey;
  return (
    e.key.toLowerCase() === shortcut.key.toLowerCase() &&
    ctrlOrMeta === !!shortcut.ctrl &&
    e.shiftKey === !!shortcut.shift &&
    e.altKey === !!shortcut.alt
  );
}

// 根据快捷键查找命令
export function findCommandByShortcut(e: KeyboardEvent): CommandItem | undefined {
  // 先检查标题快捷键
  const headingMatch = HEADING_ITEMS.find((h) => h.shortcut && matchShortcut(e, h.shortcut));
  if (headingMatch) return headingMatch;

  return ALL_COMMANDS.find((cmd) => cmd.shortcut && matchShortcut(e, cmd.shortcut));
}
