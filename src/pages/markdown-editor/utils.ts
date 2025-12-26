import { TableConfig } from './types';

/**
 * 生成 Markdown 表格
 */
export function generateMarkdownTable(config: TableConfig): string {
  const { headers, data, alignments } = config;

  // 表头行
  const headerRow = '| ' + headers.join(' | ') + ' |';

  // 分隔行（带对齐）
  const separatorRow =
    '| ' +
    alignments
      .map((align) => {
        switch (align) {
          case 'left':
            return ':---';
          case 'center':
            return ':---:';
          case 'right':
            return '---:';
          default:
            return '---';
        }
      })
      .join(' | ') +
    ' |';

  // 数据行
  const dataRows = data.map((row) => '| ' + row.join(' | ') + ' |');

  return [headerRow, separatorRow, ...dataRows].join('\n');
}

/**
 * 创建默认表格配置
 */
export function createDefaultTableConfig(rows: number, cols: number): TableConfig {
  return {
    rows,
    cols,
    headers: Array(cols)
      .fill('')
      .map((_, i) => `标题 ${i + 1}`),
    data: Array(rows)
      .fill(null)
      .map(() => Array(cols).fill('')),
    alignments: Array(cols).fill('left') as ('left' | 'center' | 'right')[],
  };
}

/**
 * 使用原生方法插入文本（支持撤销）
 * 通过 execCommand 或 setRangeText 插入，浏览器会记录到撤销栈
 */
function insertTextNative(textarea: HTMLTextAreaElement, text: string): void {
  textarea.focus();
  // execCommand 已废弃但仍广泛支持，且能正确记录撤销历史
  const success = document.execCommand('insertText', false, text);
  if (!success) {
    // 降级方案：使用 setRangeText（部分浏览器可能不支持撤销）
    textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, 'end');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/**
 * 在光标位置插入文本（支持撤销）
 */
export function insertTextAtCursor(
  textarea: HTMLTextAreaElement,
  text: string,
  selectStart?: number,
  selectEnd?: number,
): { value: string; selectionStart: number; selectionEnd: number } {
  const start = textarea.selectionStart;

  insertTextNative(textarea, text);

  const newStart = selectStart !== undefined ? start + selectStart : start + text.length;
  const newEnd = selectEnd !== undefined ? start + selectEnd : newStart;

  return { value: textarea.value, selectionStart: newStart, selectionEnd: newEnd };
}

/**
 * 包裹选中文本（支持撤销）
 */
export function wrapSelection(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string = prefix,
): { value: string; selectionStart: number; selectionEnd: number } {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);

  const newText = prefix + selectedText + suffix;
  insertTextNative(textarea, newText);

  return {
    value: textarea.value,
    selectionStart: start + prefix.length,
    selectionEnd: start + prefix.length + selectedText.length,
  };
}

/**
 * 在行首插入文本（支持撤销）
 */
export function insertAtLineStart(
  textarea: HTMLTextAreaElement,
  prefix: string,
): { value: string; selectionStart: number; selectionEnd: number } {
  const start = textarea.selectionStart;
  const value = textarea.value;

  // 找到当前行的开始位置
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;

  // 先移动光标到行首，再插入
  textarea.setSelectionRange(lineStart, lineStart);
  insertTextNative(textarea, prefix);

  return {
    value: textarea.value,
    selectionStart: start + prefix.length,
    selectionEnd: start + prefix.length,
  };
}

/**
 * 从 Markdown 内容生成目录（TOC）
 */
export function generateToc(content: string): string {
  const lines = content.split('\n');
  const headings: { level: number; text: string; anchor: string }[] = [];

  for (const line of lines) {
    // 匹配 Markdown 标题（# ## ### 等）
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      // 生成锚点：小写、空格转短横线、移除特殊字符
      const anchor = text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u4e00-\u9fa5-]/g, '');
      headings.push({ level, text, anchor });
    }
  }

  if (headings.length === 0) {
    return '';
  }

  // 找到最小层级作为基准
  const minLevel = Math.min(...headings.map((h) => h.level));

  // 生成目录
  const tocLines = headings.map((h) => {
    const indent = '  '.repeat(h.level - minLevel);
    return `${indent}- [${h.text}](#${h.anchor})`;
  });

  return '## 目录\n\n' + tocLines.join('\n');
}
