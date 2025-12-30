import { Marked, type Tokens } from 'marked';
import markedKatex from 'marked-katex-extension';
import { createHighlighter, type Highlighter } from 'shiki';
import { createCssVariablesTheme } from 'shiki/core';

// 配置 marked（不带代码高亮，后续用 shiki 处理）
const marked = new Marked();

// 添加 KaTeX 数学公式支持
marked.use(
  markedKatex({
    throwOnError: false, // 公式错误时不抛异常
    output: 'htmlAndMathml', // 同时输出 HTML 和 MathML（提高可访问性）
  }),
);

marked.use({
  renderer: {
    listitem(item: Tokens.ListItem): string {
      const content = this.parser.parse(item.tokens);
      if (item.task) {
        return `<li class="task-list-item">${content}</li>\n`;
      }
      return `<li>${content}</li>\n`;
    },
    checkbox({ checked }: Tokens.Checkbox): string {
      return `<input type="checkbox" class="task-list-item-checkbox" ${checked ? 'checked=""' : ''} disabled="" /> `;
    },
  },
});

marked.setOptions({
  gfm: true,
  breaks: true,
});

// 创建 CSS 变量主题
const cssVarsTheme = createCssVariablesTheme({
  name: 'css-variables',
  variablePrefix: '--shiki-',
  variableDefaults: {},
  fontStyle: true,
});

// Shiki highlighter 单例
let highlighter: Highlighter | null = null;

// 常用语言列表
const COMMON_LANGS = [
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'json',
  'html',
  'css',
  'scss',
  'markdown',
  'python',
  'java',
  'c',
  'cpp',
  'csharp',
  'go',
  'rust',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'sql',
  'bash',
  'shell',
  'yaml',
  'xml',
  'diff',
  'text',
];

// 初始化 highlighter
async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: [cssVarsTheme],
      langs: COMMON_LANGS,
    });
  }
  return highlighter;
}

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
  const shiki = await getHighlighter();
  const highlightedBlocks = await Promise.all(
    matches.map(async ({ full, lang, code }) => {
      try {
        // 检查语言是否已加载，如果没有则动态加载
        const loadedLangs = shiki.getLoadedLanguages();
        if (!loadedLangs.includes(lang as never) && lang !== 'text') {
          try {
            await shiki.loadLanguage(lang as never);
          } catch {
            // 语言不支持，使用 text
            lang = 'text';
          }
        }
        const html = shiki.codeToHtml(code, {
          lang: lang || 'text',
          theme: 'css-variables',
        });
        return { full, html };
      } catch {
        // 如果语言不支持，使用 text
        const html = shiki.codeToHtml(code, {
          lang: 'text',
          theme: 'css-variables',
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

// 从 DOM 中读取 Mermaid CSS 变量
function getMermaidThemeVariables(): Record<string, string | boolean> {
  const markdownBody = document.querySelector('.markdown-body');
  if (!markdownBody) {
    return {};
  }

  const styles = getComputedStyle(markdownBody);
  const getVar = (name: string) => styles.getPropertyValue(name).trim();

  // 检测是否为暗色模式
  const colorScheme = styles.getPropertyValue('color-scheme').trim();
  const isDarkMode = colorScheme === 'dark';

  // 只设置核心变量，让 mermaid 自动派生其他颜色
  // 参考: https://mermaid.js.org/config/theming.html#theme-variables
  return {
    darkMode: isDarkMode,
    background: getVar('--mermaid-background') || (isDarkMode ? '#1a1a1a' : '#ffffff'),
    primaryColor: getVar('--mermaid-primaryColor') || (isDarkMode ? '#1f3a5f' : '#dce8f5'),
    primaryTextColor: getVar('--mermaid-primaryTextColor') || (isDarkMode ? '#f0f6fc' : '#1f2328'),
    primaryBorderColor: getVar('--mermaid-primaryBorderColor') || (isDarkMode ? '#4493f8' : '#0969da'),
    lineColor: getVar('--mermaid-lineColor') || (isDarkMode ? '#8b949e' : '#57606a'),
    textColor: getVar('--mermaid-textColor') || (isDarkMode ? '#f0f6fc' : '#1f2328'),
  };
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

  // 获取当前主题的 CSS 变量
  const themeVariables = getMermaidThemeVariables();

  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables,
    securityLevel: 'loose',
    suppressErrorRendering: true, // 禁止渲染错误 SVG 到 DOM
  });

  // 渲染所有 mermaid 代码块（使用顺序执行确保 ID 唯一）
  // 渲染期间锁定 body 滚动，防止临时元素导致滚动条闪烁
  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

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

  // 清理 mermaid 在 body 下创建的临时/错误元素
  document.querySelectorAll('body > svg[id^="mermaid"], body > #d, body > .mermaid-error').forEach((el) => el.remove());

  // 恢复 body 滚动
  document.body.style.overflow = originalOverflow;

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
