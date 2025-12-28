import { Marked } from 'marked';
import { codeToHtml } from 'shiki';

// 配置 marked（不带代码高亮，后续用 shiki 处理）
const marked = new Marked();

marked.setOptions({
  gfm: true,
  breaks: true,
});

// 解码 HTML 实体
export function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

// 生成只包含字母和数字的唯一 ID
export function generateMermaidId(): string {
  return `mermaid${Date.now().toString(36)}${Math.random().toString(36).substring(2, 11)}`;
}

// 使用 shiki 高亮代码块（跳过 mermaid）
export async function highlightCodeBlocks(html: string): Promise<string> {
  const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
  const codeBlockNoLangRegex = /<pre><code>([\s\S]*?)<\/code><\/pre>/g;

  const matches: { full: string; lang: string; code: string }[] = [];

  // 收集带语言标记的代码块（排除 mermaid）
  let match;
  while ((match = codeBlockRegex.exec(html)) !== null) {
    if (match[1] === 'mermaid') {
      continue; // 跳过 mermaid，后续单独处理
    }
    matches.push({
      full: match[0],
      lang: match[1],
      code: decodeHtmlEntities(match[2]),
    });
  }

  // 收集不带语言标记的代码块
  while ((match = codeBlockNoLangRegex.exec(html)) !== null) {
    matches.push({
      full: match[0],
      lang: 'text',
      code: decodeHtmlEntities(match[1]),
    });
  }

  // 并行高亮所有代码块
  const highlightedBlocks = await Promise.all(
    matches.map(async ({ full, lang, code }) => {
      try {
        const html = await codeToHtml(code, {
          lang: lang || 'text',
          theme: 'github-dark',
        });
        return { full, html };
      } catch {
        // 如果语言不支持，使用 text
        const html = await codeToHtml(code, {
          lang: 'text',
          theme: 'github-dark',
        });
        return { full, html };
      }
    }),
  );

  // 替换原始代码块
  let result = html;
  for (const { full, html: highlightedHtml } of highlightedBlocks) {
    result = result.replace(full, highlightedHtml);
  }

  return result;
}

// 渲染 mermaid 图表
export async function renderMermaidBlocks(html: string): Promise<string> {
  const mermaidRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;
  const mermaidBlocks: { full: string; code: string }[] = [];

  let match;
  while ((match = mermaidRegex.exec(html)) !== null) {
    mermaidBlocks.push({
      full: match[0],
      code: decodeHtmlEntities(match[1]),
    });
  }

  if (mermaidBlocks.length === 0) {
    return html;
  }

  // 动态导入 mermaid
  const mermaid = (await import('mermaid')).default;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  });

  // 渲染所有 mermaid 代码块（使用顺序执行确保 ID 唯一）
  const renderedBlocks = [];
  for (const { full, code } of mermaidBlocks) {
    try {
      const id = generateMermaidId();
      const { svg } = await mermaid.render(id, code.trim());
      renderedBlocks.push({ full, html: `<div class="mermaid-container">${svg}</div>` });
    } catch (error) {
      console.error('Mermaid render error:', error);
      renderedBlocks.push({ full, html: `<pre><code>${decodeHtmlEntities(code)}</code></pre>` });
    }
  }

  // 替换原始 mermaid 代码块
  let result = html;
  for (const { full, html: renderedHtml } of renderedBlocks) {
    result = result.replace(full, renderedHtml);
  }

  return result;
}

// 解析 Markdown 并渲染为完整 HTML
export async function parseMarkdown(content: string): Promise<string> {
  if (!content) {
    return '<p><em>开始输入以查看预览...</em></p>';
  }

  const rawHtml = marked.parse(content) as string;

  // 先用 shiki 高亮普通代码块
  const highlightedHtml = await highlightCodeBlocks(rawHtml);

  // 再处理 mermaid 图表
  const finalHtml = await renderMermaidBlocks(highlightedHtml);

  return finalHtml;
}

export { marked };
