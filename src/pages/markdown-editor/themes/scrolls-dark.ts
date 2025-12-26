// Scrolls Dark 主题
// 来源: https://theme.typora.io/theme/Scrolls/
// 作者: DaoDaoLee
// 基于羊皮卷色调的护眼暗色主题

export const style = /* css */ `
/* ========== 基础样式 ========== */
.markdown-body {
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 16px;
  line-height: 1.8;
  color: #c8c2b6;
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
  color: #e8dcc8;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  line-height: 1.4;
}

.markdown-body h1 {
  font-size: 2em;
  border-bottom: 2px solid #4a4538;
  padding-bottom: 0.3em;
}

.markdown-body h2 {
  font-size: 1.6em;
  border-bottom: 1px solid #4a4538;
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
  color: #9a9488;
}

/* ========== 段落与文本 ========== */
.markdown-body p {
  margin: 0.8em 0;
}

.markdown-body strong {
  font-weight: 700;
  color: #e8dcc8;
}

.markdown-body em {
  font-style: italic;
  color: #d8ccb8;
}

.markdown-body del {
  text-decoration: line-through;
  color: #7a7468;
}

/* ========== 链接 ========== */
.markdown-body a {
  color: #9acd32;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}

.markdown-body a:hover {
  color: #b8e648;
  border-bottom-color: #9acd32;
}

/* ========== 行内代码 ========== */
.markdown-body code,
.markdown-body tt {
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
  font-size: 0.9em;
  background-color: #3a3a32;
  color: #e5c07b;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #4a4538;
}

/* ========== 代码块 ========== */
.markdown-body pre {
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
  font-size: 0.9em;
  line-height: 1.6;
  background-color: #1e1e1a;
  padding: 1em 1.2em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid #3a3a32;
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
  background-color: #333328;
  border-left: 4px solid #8b7355;
  color: #b8b2a6;
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
  border: 1px solid #4a4538;
}

.markdown-body table th,
.markdown-body table td {
  border: 1px solid #4a4538;
  padding: 6px 13px;
  text-align: left;
}

.markdown-body table th {
  background-color: #3a3a32;
  font-weight: 600;
  color: #e8dcc8;
}

.markdown-body table tr:nth-child(2n),
.markdown-body thead {
  background-color: #32322c;
}

/* ========== 分割线 ========== */
.markdown-body hr {
  border: none;
  height: 2px;
  background: linear-gradient(to right, transparent, #5a5448, transparent);
  margin: 16px 0;
  padding: 0;
  overflow: hidden;
}

/* ========== 图片 ========== */
.markdown-body img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* ========== 高亮 ========== */
.markdown-body mark {
  background-color: #5a5030;
  color: #e8dcc8;
  padding: 0.1em 0.3em;
  border-radius: 3px;
}
`;
