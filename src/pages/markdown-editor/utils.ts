import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
): { selectionStart: number; selectionEnd: number } {
  const start = textarea.selectionStart;

  insertTextNative(textarea, text);

  const newStart = selectStart !== undefined ? start + selectStart : start + text.length;
  const newEnd = selectEnd !== undefined ? start + selectEnd : newStart;

  return { selectionStart: newStart, selectionEnd: newEnd };
}

/**
 * 包裹选中文本（支持撤销）
 */
export function wrapSelection(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string = prefix,
): { selectionStart: number; selectionEnd: number } {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);

  const newText = prefix + selectedText + suffix;
  insertTextNative(textarea, newText);

  return {
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
): { selectionStart: number; selectionEnd: number } {
  const start = textarea.selectionStart;
  const value = textarea.value;

  // 找到当前行的开始位置
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;

  // 先移动光标到行首，再插入
  textarea.setSelectionRange(lineStart, lineStart);
  insertTextNative(textarea, prefix);

  return {
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

/**
 * 将 HTML 转换为 Markdown
 */
export function htmlToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 尝试找到主要内容区域
  const body = doc.body;

  return convertNodeToMarkdown(body).trim();
}

function convertNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const children = Array.from(el.childNodes).map(convertNodeToMarkdown).join('');

  switch (tag) {
    // 标题
    case 'h1':
      return `# ${children.trim()}\n\n`;
    case 'h2':
      return `## ${children.trim()}\n\n`;
    case 'h3':
      return `### ${children.trim()}\n\n`;
    case 'h4':
      return `#### ${children.trim()}\n\n`;
    case 'h5':
      return `##### ${children.trim()}\n\n`;
    case 'h6':
      return `###### ${children.trim()}\n\n`;

    // 段落和换行
    case 'p':
      return `${children.trim()}\n\n`;
    case 'br':
      return '\n';

    // 文本格式
    case 'strong':
    case 'b':
      return `**${children}**`;
    case 'em':
    case 'i':
      return `*${children}*`;
    case 'del':
    case 's':
    case 'strike':
      return `~~${children}~~`;
    case 'code':
      return `\`${children}\``;

    // 链接和图片
    case 'a': {
      const href = el.getAttribute('href') || '';
      return `[${children}](${href})`;
    }
    case 'img': {
      const src = el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || '';
      return `![${alt}](${src})`;
    }

    // 列表
    case 'ul':
      return (
        Array.from(el.children)
          .map((li) => `- ${convertNodeToMarkdown(li).trim()}`)
          .join('\n') + '\n\n'
      );
    case 'ol':
      return (
        Array.from(el.children)
          .map((li, i) => `${i + 1}. ${convertNodeToMarkdown(li).trim()}`)
          .join('\n') + '\n\n'
      );
    case 'li':
      return children;

    // 引用
    case 'blockquote':
      return (
        children
          .trim()
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n') + '\n\n'
      );

    // 代码块
    case 'pre': {
      const codeEl = el.querySelector('code');
      const code = codeEl ? codeEl.textContent : el.textContent;
      const lang = codeEl?.className.match(/language-(\w+)/)?.[1] || '';
      return `\`\`\`${lang}\n${code?.trim()}\n\`\`\`\n\n`;
    }

    // 水平线
    case 'hr':
      return '---\n\n';

    // 表格
    case 'table': {
      const rows = Array.from(el.querySelectorAll('tr'));
      if (rows.length === 0) return children;

      const headerRow = rows[0];
      const headerCells = Array.from(headerRow.querySelectorAll('th, td'));
      const headers = headerCells.map((cell) => cell.textContent?.trim() || '');

      const separator = headers.map(() => '---').join(' | ');
      const headerLine = headers.join(' | ');

      const bodyRows = rows.slice(1).map((row) => {
        const cells = Array.from(row.querySelectorAll('td'));
        return cells.map((cell) => cell.textContent?.trim() || '').join(' | ');
      });

      return `| ${headerLine} |\n| ${separator} |\n${bodyRows.map((r) => `| ${r} |`).join('\n')}\n\n`;
    }

    // 忽略的标签
    case 'script':
    case 'style':
    case 'head':
    case 'meta':
    case 'link':
      return '';

    // 块级元素
    case 'div':
    case 'section':
    case 'article':
    case 'main':
    case 'header':
    case 'footer':
    case 'nav':
    case 'aside':
      return children + '\n';

    // 其他内联元素
    case 'span':
    default:
      return children;
  }
}

/**
 * 下载文件
 */
function downloadFile(content: string | Blob, filename: string, type?: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: type || 'text/plain;charset=utf-8' });
  saveAs(blob, filename);
}

/**
 * 导出为 Markdown 文件
 */
export function exportToMarkdown(content: string, filename = 'document.md') {
  downloadFile(content, filename, 'text/markdown;charset=utf-8');
}

/**
 * 导出为 HTML 文件（带样式）
 */
export function exportToHtml(htmlContent: string, themeStyle: string, filename = 'document.html') {
  const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Document</title>
  <style>
    body {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
    }
    ${themeStyle}
  </style>
</head>
<body>
  <article class="markdown-body">
    ${htmlContent}
  </article>
</body>
</html>`;
  downloadFile(fullHtml, filename, 'text/html;charset=utf-8');
}

/**
 * 创建用于截图的克隆元素（展开完整内容）
 */
async function createScreenshotElement(
  previewElement: HTMLElement,
): Promise<{ container: HTMLDivElement; cleanup: () => void }> {
  // 获取 markdown-body 内容
  const markdownBody = previewElement.querySelector('.markdown-body');
  if (!markdownBody) {
    throw new Error('未找到内容');
  }

  // 创建临时容器
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 800px;
    padding: 40px;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  `;

  // 复制样式
  const styleEl = previewElement.querySelector('style');
  if (styleEl) {
    const clonedStyle = styleEl.cloneNode(true);
    container.appendChild(clonedStyle);
  }

  // 复制内容
  const clonedContent = markdownBody.cloneNode(true) as HTMLElement;
  clonedContent.style.cssText = 'background: transparent;';
  container.appendChild(clonedContent);

  document.body.appendChild(container);

  // 等待图片加载
  const images = container.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) resolve(null);
          else {
            img.onload = () => resolve(null);
            img.onerror = () => resolve(null);
          }
        }),
    ),
  );

  return {
    container,
    cleanup: () => document.body.removeChild(container),
  };
}

/**
 * 导出为 PDF
 */
export async function exportToPdf(previewElement: HTMLElement, filename = 'document.pdf') {
  const { container, cleanup } = await createScreenshotElement(previewElement);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // 计算需要多少页
    const contentHeight = pageHeight - margin * 2;
    const totalPages = Math.ceil(imgHeight / contentHeight);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      // 计算当前页应该显示图片的哪个部分
      const srcY = (page * contentHeight * canvas.width) / imgWidth;
      const srcHeight = Math.min((contentHeight * canvas.width) / imgWidth, canvas.height - srcY);

      // 创建当前页的 canvas 切片
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = srcHeight;
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);
        const pageImgData = pageCanvas.toDataURL('image/png');
        const pageImgHeight = (srcHeight * imgWidth) / canvas.width;
        pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, pageImgHeight);
      }
    }

    pdf.save(filename);
  } finally {
    cleanup();
  }
}

/**
 * 导出为 DOCX
 */
export async function exportToDocx(content: string, filename = 'document.docx') {
  const lines = content.split('\n');
  const children: Paragraph[] = [];

  for (const line of lines) {
    // 标题
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);
    const h4Match = line.match(/^####\s+(.+)$/);

    if (h1Match) {
      children.push(
        new Paragraph({
          text: h1Match[1],
          heading: HeadingLevel.HEADING_1,
        }),
      );
    } else if (h2Match) {
      children.push(
        new Paragraph({
          text: h2Match[1],
          heading: HeadingLevel.HEADING_2,
        }),
      );
    } else if (h3Match) {
      children.push(
        new Paragraph({
          text: h3Match[1],
          heading: HeadingLevel.HEADING_3,
        }),
      );
    } else if (h4Match) {
      children.push(
        new Paragraph({
          text: h4Match[1],
          heading: HeadingLevel.HEADING_4,
        }),
      );
    } else if (line.trim() === '') {
      // 空行
      children.push(new Paragraph({}));
    } else {
      // 处理行内格式
      const textRuns = parseInlineMarkdown(line);
      children.push(new Paragraph({ children: textRuns }));
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

/**
 * 解析行内 Markdown 格式
 */
function parseInlineMarkdown(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // 粗体
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      runs.push(new TextRun({ text: boldMatch[1], bold: true }));
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 斜体
    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      runs.push(new TextRun({ text: italicMatch[1], italics: true }));
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 行内代码
    const codeMatch = remaining.match(/^`(.+?)`/);
    if (codeMatch) {
      runs.push(
        new TextRun({
          text: codeMatch[1],
          font: 'Courier New',
        }),
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 普通文本（取到下一个特殊字符或结束）
    const nextSpecial = remaining.search(/[*`]/);
    if (nextSpecial === -1) {
      runs.push(new TextRun({ text: remaining }));
      break;
    } else if (nextSpecial === 0) {
      // 特殊字符但不匹配格式，作为普通文本
      runs.push(new TextRun({ text: remaining[0] }));
      remaining = remaining.slice(1);
    } else {
      runs.push(new TextRun({ text: remaining.slice(0, nextSpecial) }));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text: '' })];
}

/**
 * 导出为图片 (JPG)
 */
export async function exportToImage(previewElement: HTMLElement, filename = 'document.jpg') {
  const { container, cleanup } = await createScreenshotElement(previewElement);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
    });

    canvas.toBlob(
      (blob) => {
        if (blob) {
          saveAs(blob, filename);
        }
      },
      'image/jpeg',
      0.95,
    );
  } finally {
    // 延迟清理，确保 blob 生成完成
    setTimeout(cleanup, 100);
  }
}
