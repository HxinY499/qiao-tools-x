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
1) **收集输入（必要时用 fetcher 工具读取用户提供的链接）**
   - 使用 fetcher 获取用户给出的 CSS / README / 文档链接内容。
   - Typora 源 CSS（亮/暗）。
   - 如果有字体，用户将字体放到 `public/themes/fonts/<主题名>/`，格式优先 `.woff2`。

2) **删掉 Typora 专属 UI**
   - 去除侧栏/文件树/搜索/大纲/tooltip/自动完成/CodeMirror gutter 等与本项目无关的规则。

3) **统一作用域到 `markdown-body`**
   - `:root` → `.markdown-body`
   - `html, body` → `.markdown-body html, .markdown-body body`
   - 所有标签与组件选择器（`img/table/code/blockquote/hr/ul/ol/li/a/p/h1~h6`、任务列表等）全部加 `.markdown-body` 前缀。

4) **变量与基础排版**
   - 保留/迁移变量：`--bg-color`, `--text-color`, `--border-color`, `--link-color`, `--code-bg-color`, `--code-block-bg-color`, `--code-color`, `--body-font`, `--monospace-font`, `--font-size`, `--h1/h2/h3`, `--line-height`, `--main-content-max-width`, `--document-padding-x`, `--code-border-radius`, `--monospace-font-size`，可选 `--mermaid-theme` 等。
   - 间距与排版：保持段落、标题、列表、引用、HR、图片、表格的间距和风格。

5) **代码块映射（Shiki，务必用 `!important` 防止被 Shiki 覆盖）**
   - 将 Typora CodeMirror 颜色映射到 Shiki token：
     - `.cm-keyword`→`.token.keyword`
     - `.cm-string/.cm-string-2`→`.token.string`
     - `.cm-number/.cm-atom`→`.token.number` 或 `.token.constant`
     - `.cm-comment`→`.token.comment`
     - `.cm-operator`→`.token.operator`
     - `.cm-tag/.cm-attribute`→`.token.tag/.token.attr-name`
     - `.cm-def/.cm-variable-2`→`.token.function/.token.variable`
     - 其他按相近颜色映射。
   - **代码相关样式一律加 `!important`**，包括 `.markdown-body .shiki .token.*` 颜色、`pre/code/.shiki` 的背景/圆角/内边距/字体，防止被 Shiki 默认样式覆盖。
   - 容器样式：`.markdown-body pre`、`.markdown-body code`、`.markdown-body .shiki` 使用主题变量设置背景、圆角、内边距、等宽字体，并加 `!important`。
   - 行内代码：`.markdown-body p code`（或排除 `.shiki .token`）避免覆盖语法 token，必要时为颜色/背景加 `!important`。
   - Typora 的行号/gutter/tooltip/自动完成，如无必要可删除。

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
