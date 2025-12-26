// Scrolls Light 主题
// 来源: https://theme.typora.io/theme/Scrolls/
// 作者: DaoDaoLee
// 基于羊皮卷色调的护眼主题，灵感来自 softgreen 和 techo

export const style = /* css */ `
/* ========== 基础样式 ========== */
.markdown-body {
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 16px;
  line-height: 1.8;
  color: #3f3f3f;
}

/* ========== 标题 ========== */
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  font-family: 'JetBrains Mono', 'Fira Code', sans-serif;
  font-weight: 600;
  color: #5a4a3a;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  line-height: 1.4;
}

.markdown-body h1 {
  font-size: 2em;
  border-bottom: 2px solid #d4c9b8;
  padding-bottom: 0.3em;
}

.markdown-body h2 {
  font-size: 1.6em;
  border-bottom: 1px solid #d4c9b8;
  padding-bottom: 0.25em;
}

.markdown-body h3 {
  font-size: 1.35em;
}

.markdown-body h4 {
  font-size: 1.15em;
}

.markdown-body h5 {
  font-size: 1em;
}

.markdown-body h6 {
  font-size: 0.9em;
  color: #7a6a5a;
}

/* ========== 段落与文本 ========== */
.markdown-body p {
  margin: 0.8em 0;
}

.markdown-body strong {
  font-weight: 700;
  color: #4a3a2a;
}

.markdown-body em {
  font-style: italic;
  color: #5a4a3a;
}

.markdown-body del {
  text-decoration: line-through;
  color: #8a7a6a;
}

/* ========== 链接 ========== */
.markdown-body a {
  color: #6b8e23;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}

.markdown-body a:hover {
  color: #556b2f;
  border-bottom-color: #6b8e23;
}

/* ========== 行内代码 ========== */
.markdown-body code,
.markdown-body tt {
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
  font-size: 0.9em;
  background-color: #e8e2d5;
  color: #c96a00;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #d4c9b8;
}

/* ========== 代码块 ========== */
.markdown-body pre {
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
  font-size: 0.9em;
  line-height: 1.6;
  background-color: #282c34;
  padding: 1em 1.2em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid #d4c9b8;
}

.markdown-body pre code {
  font-family: inherit;
  font-size: inherit;
  background: none;
  color: #abb2bf;
  padding: 0;
  border: none;
  border-radius: 0;
}

/* ========== 引用块 ========== */
.markdown-body blockquote {
  margin: 1em 0;
  padding: 0.8em 1.2em;
  background-color: #ebe6d9;
  border-left: 4px solid #8b7355;
  color: #5a4a3a;
  border-radius: 0 6px 6px 0;
}

.markdown-body blockquote p {
  margin: 0.4em 0;
}

/* ========== 列表 ========== */
.markdown-body ul,
.markdown-body ol {
  padding-left: 30px;
  margin: 0.8em 0;
}

.markdown-body li {
  margin: 0.3em 0;
}

.markdown-body li > ol,
.markdown-body li > ul {
  margin: 0;
}

/* ========== 表格 ========== */
.markdown-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.95em;
}

.markdown-body table tr {
  border: 1px solid #d4c9b8;
}

.markdown-body table th,
.markdown-body table td {
  border: 1px solid #d4c9b8;
  padding: 6px 13px;
  text-align: left;
}

.markdown-body table th {
  background-color: #e8e2d5;
  font-weight: 600;
  color: #4a3a2a;
}

.markdown-body table tr:nth-child(2n),
.markdown-body thead {
  background-color: #f0ebe0;
}

/* ========== 分割线 ========== */
.markdown-body hr {
  border: none;
  height: 2px;
  background: linear-gradient(to right, transparent, #c9b99a, transparent);
  margin: 16px 0;
  padding: 0;
  overflow: hidden;
}

/* ========== 图片 ========== */
.markdown-body img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(90, 74, 58, 0.15);
}

/* ========== 高亮 ========== */
.markdown-body mark {
  background-color: #f0e68c;
  color: #3f3f3f;
  padding: 0.1em 0.3em;
  border-radius: 3px;
}
`;
