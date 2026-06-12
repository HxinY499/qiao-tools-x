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
        label: 'markdownEditor.toolbar.heading',
        description: 'markdownEditor.toolbar.headingDesc',
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
        label: 'markdownEditor.toolbar.bold',
        description: 'markdownEditor.toolbar.boldDesc',
        keywords: ['bold', 'strong', '加粗'],
        shortcut: { key: 'b', ctrl: true },
      },
      {
        id: 'italic',
        icon: Italic,
        label: 'markdownEditor.toolbar.italic',
        description: 'markdownEditor.toolbar.italicDesc',
        keywords: ['italic', 'em', '斜体'],
        shortcut: { key: 'i', ctrl: true },
      },
      {
        id: 'strikethrough',
        icon: Strikethrough,
        label: 'markdownEditor.toolbar.strikethrough',
        description: 'markdownEditor.toolbar.strikethroughDesc',
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
        label: 'markdownEditor.toolbar.inlineCode',
        description: 'markdownEditor.toolbar.inlineCodeDesc',
        keywords: ['code', 'inline', '代码'],
        shortcut: { key: 'e', ctrl: true },
      },
      {
        id: 'codeBlock',
        icon: Code,
        label: 'markdownEditor.toolbar.codeBlock',
        description: 'markdownEditor.toolbar.codeBlockDesc',
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
        label: 'markdownEditor.toolbar.link',
        description: 'markdownEditor.toolbar.linkDesc',
        keywords: ['link', 'url', '链接'],
        shortcut: { key: 'k', ctrl: true },
      },
      {
        id: 'image',
        icon: Image,
        label: 'markdownEditor.toolbar.image',
        description: 'markdownEditor.toolbar.imageDesc',
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
        label: 'markdownEditor.toolbar.ul',
        description: 'markdownEditor.toolbar.ulDesc',
        keywords: ['list', 'ul', '列表', '无序'],
        shortcut: { key: 'u', ctrl: true },
      },
      {
        id: 'ol',
        icon: ListOrdered,
        label: 'markdownEditor.toolbar.ol',
        description: 'markdownEditor.toolbar.olDesc',
        keywords: ['list', 'ol', 'ordered', '列表', '有序'],
        shortcut: { key: 'o', ctrl: true, shift: true },
      },
      {
        id: 'quote',
        icon: Quote,
        label: 'markdownEditor.toolbar.quote',
        description: 'markdownEditor.toolbar.quoteDesc',
        keywords: ['quote', 'blockquote', '引用'],
        shortcut: { key: 'q', ctrl: true, shift: true },
      },
      {
        id: 'taskUnchecked',
        icon: Square,
        label: 'markdownEditor.toolbar.taskUnchecked',
        description: 'markdownEditor.toolbar.taskUncheckedDesc',
        keywords: ['task', 'todo', 'checkbox', '任务', '待办'],
        shortcut: { key: 'x', ctrl: true, shift: true },
      },
      {
        id: 'taskChecked',
        icon: CheckSquare,
        label: 'markdownEditor.toolbar.taskChecked',
        description: 'markdownEditor.toolbar.taskCheckedDesc',
        keywords: ['task', 'done', 'checked', '任务', '完成'],
      },
    ],
  },
  {
    items: [
      {
        id: 'inlineMath',
        icon: Sigma,
        label: 'markdownEditor.toolbar.inlineMath',
        description: 'markdownEditor.toolbar.inlineMathDesc',
        keywords: ['math', 'latex', 'katex', '公式', '数学'],
        shortcut: { key: 'm', ctrl: true },
      },
      {
        id: 'blockMath',
        icon: Sigma,
        label: 'markdownEditor.toolbar.blockMath',
        description: 'markdownEditor.toolbar.blockMathDesc',
        keywords: ['math', 'latex', 'katex', '公式', '数学'],
        isText: true,
        text: '∑',
        shortcut: { key: 'm', ctrl: true, shift: true },
      },
    ],
  },
  {
    items: [
      { id: 'table', icon: Table, label: 'markdownEditor.toolbar.table', description: 'markdownEditor.toolbar.tableDesc', keywords: ['table', '表格'], isTable: true },
      {
        id: 'hr',
        icon: Minus,
        label: 'markdownEditor.toolbar.hr',
        description: 'markdownEditor.toolbar.hrDesc',
        keywords: ['hr', 'horizontal', 'divider', '分隔', '横线'],
        shortcut: { key: '-', ctrl: true, shift: true },
      },
      {
        id: 'toc',
        icon: ListTree,
        label: 'markdownEditor.toolbar.toc',
        description: 'markdownEditor.toolbar.tocDesc',
        keywords: ['toc', 'table of contents', '目录'],
      },
      {
        id: 'chart',
        icon: Workflow,
        label: 'markdownEditor.toolbar.chart',
        description: 'markdownEditor.toolbar.chartDesc',
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
  { id: 'h1', icon: Heading1, label: 'markdownEditor.toolbar.h1', shortcut: { key: '1', ctrl: true } },
  { id: 'h2', icon: Heading2, label: 'markdownEditor.toolbar.h2', shortcut: { key: '2', ctrl: true } },
  { id: 'h3', icon: Heading3, label: 'markdownEditor.toolbar.h3', shortcut: { key: '3', ctrl: true } },
  { id: 'h4', icon: Heading4, label: 'markdownEditor.toolbar.h4', shortcut: { key: '4', ctrl: true } },
  { id: 'h5', icon: Heading5, label: 'markdownEditor.toolbar.h5', shortcut: { key: '5', ctrl: true } },
  { id: 'h6', icon: Heading6, label: 'markdownEditor.toolbar.h6', shortcut: { key: '6', ctrl: true } },
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
    label: 'markdownEditor.chart.flowchart',
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
    label: 'markdownEditor.chart.sequence',
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
    label: 'markdownEditor.chart.state',
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
    label: 'markdownEditor.chart.gantt',
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
    label: 'markdownEditor.chart.class',
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
    label: 'markdownEditor.chart.pie',
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
    label: 'markdownEditor.chart.mindmap',
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
