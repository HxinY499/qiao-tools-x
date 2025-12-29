---
name: typora-theme-migration
description: "用于将 Typora 主题（CSS）迁移到本项目的 markdown 编辑器（marked + Shiki），保持视觉还原、作用域隔离（markdown-body），并按需加载主题与字体。"
---

## 目的
提供一套完整流程，把任意 Typora 主题移植到本项目的 Markdown 预览（marked + Shiki），在不污染全局的前提下尽量 100% 还原视觉，并支持按需加载主题及自带字体。

## 何时使用
- 需要新增/移植 Typora 主题（含亮/暗版、可选字体）到 `src/pages/markdown-editor/themes/`。
- 需要说明或执行主题按需加载、Shiki 语法高亮映射、字体按需加载时。

## 核心思路（替代原 README）
- 作用域：所有样式仅作用于预览容器类名 `markdown-body`，避免全局污染。
- 视觉：尽量保留主题的背景、字体、间距、表格/列表/引用/代码等细节。
- 加载：主题 CSS 通过 `?raw` 动态导入和缓存；字体通过静态路径按需请求。
- 示例：`src/pages/markdown-editor/themes/github-light.css` / `github-dark.css` 是作用域化后的参考实现。

## 工作流
1) **收集输入（必要时用 fetcher 工具或 curl 读取用户提供的链接）**
   - 优先使用 fetcher 获取用户给出的 CSS / README / 文档链接内容。
   - **备选方案**：当 fetcher 无法使用或无法获取网页完整内容时，使用 curl 下载后查看：
     ```bash
     curl -sL "https://example.com/theme.css" -o /tmp/theme.css && echo "Downloaded successfully"
     ```
     然后使用 `read_file` 读取 `/tmp/theme.css` 查看内容。
   - Typora 源 CSS（亮/暗）。
   - 如果有字体，用户将字体放到 `public/themes/fonts/<主题名>/`，格式优先 `.woff2`。

2) **删掉 Typora 专属 UI**
   - 去除侧栏/文件树/搜索/大纲/tooltip/自动完成/CodeMirror gutter 等与本项目无关的规则。

3) **统一作用域到 `markdown-body`**
   - `:root` → `.markdown-body`
   - `html, body` → `.markdown-body html, .markdown-body body`
   - 所有标签与组件选择器（`img/table/code/blockquote/hr/ul/ol/li/a/p/h1~h6`、任务列表等）全部加 `.markdown-body` 前缀。

4) **变量与基础排版**
   - 保留/迁移变量：`--bg-color`, `--text-color`, `--border-color`, `--link-color`, `--code-bg-color`, `--code-block-bg-color`, `--code-color`, `--body-font`, `--monospace-font`, `--font-size`, `--h1/h2/h3`, `--line-height`, `--content-max-width`, `--content-padding-x`, `--code-border-radius`, `--monospace-font-size`，可选 `--mermaid-theme` 等。
   - 间距与排版：保持段落、标题、列表、引用、HR、图片、表格的间距和风格。
   - **背景铺满**：不要使用 `max-width` + `margin: 0 auto`，这会导致预览区域拉宽时左右留白。应使用动态 padding 实现内容居中且背景铺满：
     ```css
     .markdown-body {
       min-height: 100%;
       /* 使用 max() 函数：窄屏时用基础 padding，宽屏时自动增大 padding 使内容居中 */
       padding: var(--content-padding-y) max(var(--content-padding-x), calc((100% - var(--content-max-width)) / 2 + var(--content-padding-x)));
     }
     ```

5) **代码块配色（Shiki CSS 变量方案）**
   - 本项目使用 Shiki 的 `css-variables` 主题，通过 CSS 变量控制语法高亮颜色。
   - **必须在每个主题的 `.markdown-body` 中定义以下 Shiki 变量**：
     ```css
     .markdown-body {
       /* Shiki Code Highlight Variables */
       --shiki-foreground: #333333;        /* 默认代码文字颜色 */
       --shiki-background: #f8f8f8;        /* 代码块背景色 */
       --shiki-token-constant: #0086b3;    /* 常量（数字、布尔值等） */
       --shiki-token-string: #183691;      /* 字符串 */
       --shiki-token-comment: #969896;     /* 注释 */
       --shiki-token-keyword: #a71d5d;     /* 关键字（if、const、function 等） */
       --shiki-token-parameter: #333333;   /* 函数参数 */
       --shiki-token-function: #795da3;    /* 函数名 */
       --shiki-token-string-expression: #183691; /* 模板字符串 */
       --shiki-token-punctuation: #333333; /* 标点符号 */
       --shiki-token-link: #4183c4;        /* 链接 */
     }
     ```
   - **Typora CodeMirror 颜色映射到 Shiki 变量**：
     | Typora (CodeMirror) | Shiki 变量 |
     |---------------------|-----------|
     | `.cm-keyword` | `--shiki-token-keyword` |
     | `.cm-string`, `.cm-string-2` | `--shiki-token-string` |
     | `.cm-number`, `.cm-atom` | `--shiki-token-constant` |
     | `.cm-comment` | `--shiki-token-comment` |
     | `.cm-def`, `.cm-variable-2` | `--shiki-token-function` |
     | `.cm-tag`, `.cm-attribute` | `--shiki-token-keyword` / `--shiki-token-parameter` |
     | `.cm-operator` | `--shiki-token-punctuation` |
   - **亮色主题**：使用深色文字 + 浅色背景，关键字/函数名用饱和色。
   - **暗色主题**：使用浅色文字 + 深色背景，颜色适当提亮以保证对比度。
   - 代码块容器样式（`pre`, `code`, `.shiki`）仍需设置背景、圆角、内边距等，可引用 `--shiki-background`：
     ```css
     .markdown-body pre,
     .markdown-body .shiki {
       background: var(--shiki-background) !important;
       border-radius: 6px;
       padding: 1em;
     }
     ```
   - 行内代码样式单独处理，避免与 Shiki 语法高亮冲突。

6) **列表 / 任务列表 / 表格 / 引用 / 链接**
   - 列表缩进/间距：加前缀。
   - 任务列表 checkbox：加前缀，修正 `vat(--link-color)` 为 `var(--link-color)`（若出现）。
   - 表格：边框/内边距/宽度限制加前缀。
   - 引用、HR、段落间距：加前缀。
   - 链接：使用 `--link-color`，加前缀。

7) **字体（如有）**
   - 字体放置：`public/themes/fonts/<主题名>/*.woff2`（用户自行下载/放入）。
   - CSS 使用绝对路径按需加载，例如：
     ```css
     @font-face {
       font-family: 'Scrolls';
       font-style: normal;
       font-weight: 400;
       font-display: swap;
       src: url('/themes/fonts/scrolls/Scrolls-Regular.woff2') format('woff2');
     }
     ```
   - 使用时带兜底：`font-family: 'Scrolls', var(--body-font), system-ui, sans-serif;`。
   - 仅当主题 CSS 注入时浏览器才会请求字体。

8) **注册主题（`themes/index.ts`）**
   - 扩展 `ThemeName`，在 `THEME_LIST` 写入 `label`、`isDark`。
   - 添加 loader：`'<name>': () => import('./<file>.css?raw')`。
   - 使用现有 `loadThemeStyle` 完成缓存与按需加载。

9) **验证**
   - 亮/暗切换是否正常；
   - 表格/列表/引用/行内与块级代码/图片的间距与风格是否还原；
   - 背景、字体是否只作用于预览区域；
   - Shiki 语法色是否接近原主题；
   - 是否移除多余 UI 块、文件体积是否合理。

## 提示
- 始终加 `.markdown-body` 前缀，防止全局污染。
- 代码配色/容器相关规则务必加 `!important`，优先级压过 Shiki 默认样式。
- 变量缺失（如 `--header-color`）可用 `--text-color` 替代或显式声明。
- 删除无用的 Typora UI 样式以减小体积、避免冲突。
- 保留源主题的许可证与版权声明。

## 输出物
- 作用域化的主题 CSS（放在 `src/pages/markdown-editor/themes/`）。
- 更新后的 `themes/index.ts`（loader 与元数据）。
- 如有字体：CSS 中以 `/themes/fonts/<主题名>/...` 引用，文件位于 `public/themes/fonts/<主题名>/`。
