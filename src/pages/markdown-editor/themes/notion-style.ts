// Notion Style 主题 - 来自 Typora (https://theme.typora.io/theme/Notion-Style/)
// 精确复刻 Notion 美学的简洁现代亮色主题
export const style = `
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif;
  color: #37352f;
  line-height: 1.6;
  font-size: 16px;
  background-color: transparent;
  -webkit-font-smoothing: antialiased;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  font-weight: 600;
  color: #37352f;
  margin-top: 1.5em;
  margin-bottom: 0.25em;
  line-height: 1.3;
}

.markdown-body h1 {
  font-size: 1.875em;
  margin-top: 2em;
  border-bottom: none;
}

.markdown-body h2 {
  font-size: 1.5em;
  border-bottom: none;
}

.markdown-body h3 {
  font-size: 1.25em;
}

.markdown-body h4 {
  font-size: 1em;
}

.markdown-body h5 {
  font-size: 0.875em;
}

.markdown-body h6 {
  font-size: 0.875em;
  color: #9b9a97;
}

.markdown-body p,
.markdown-body blockquote,
.markdown-body ul,
.markdown-body ol,
.markdown-body dl,
.markdown-body table,
.markdown-body pre {
  margin: 0.5em 0;
}

.markdown-body a {
  color: #37352f;
  text-decoration: underline;
  text-decoration-color: rgba(55, 53, 47, 0.4);
  text-underline-offset: 2px;
}

.markdown-body a:hover {
  text-decoration-color: #37352f;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 1.7em;
}

.markdown-body ul {
  list-style-type: disc;
}

.markdown-body ol {
  list-style-type: decimal;
}

.markdown-body li {
  margin: 0.25em 0;
}

.markdown-body li > ul,
.markdown-body li > ol {
  margin: 0;
}

.markdown-body hr {
  margin: 1.5em 0;
  border: none;
  border-top: 1px solid #e9e9e7;
}

.markdown-body blockquote {
  padding: 0 0 0 14px;
  margin: 0.5em 0;
  border-left: 3px solid #37352f;
  color: #37352f;
}

.markdown-body blockquote > p:first-child {
  margin-top: 0;
}

.markdown-body blockquote > p:last-child {
  margin-bottom: 0;
}

.markdown-body table {
  margin: 0.5em 0;
  border-collapse: collapse;
  width: 100%;
  font-size: 0.9em;
}

.markdown-body table th,
.markdown-body table td {
  padding: 7px 10px;
  border: 1px solid #e9e9e7;
  min-width: 100px;
}

.markdown-body table th {
  font-weight: 600;
  color: #37352f;
  background-color: #f7f6f3;
  text-align: left;
}

.markdown-body table td {
  background-color: transparent;
}

.markdown-body table tbody tr:hover td {
  background-color: #f7f6f3;
}

.markdown-body code,
.markdown-body tt {
  font-family: "SFMono-Regular", Menlo, Consolas, "PT Mono", "Liberation Mono", Courier, monospace;
  font-size: 0.9em;
  padding: 2px 5px;
  background-color: rgba(135, 131, 120, 0.15);
  border-radius: 3px;
  color: #eb5757;
}

.markdown-body pre {
  padding: 16px;
  background-color: #f7f6f3;
  border-radius: 4px;
  overflow: auto;
}

.markdown-body pre code {
  font-family: "SFMono-Regular", Menlo, Consolas, "PT Mono", "Liberation Mono", Courier, monospace;
  font-size: 0.875em;
  line-height: 1.5;
  padding: 0;
  background: transparent;
  border-radius: 0;
  color: #37352f;
}

.markdown-body img {
  max-width: 100%;
  border-radius: 2px;
}

.markdown-body mark {
  background-color: #fdecc8;
  color: #37352f;
  padding: 0.1em 0.2em;
  border-radius: 3px;
}

.markdown-body kbd {
  font-family: "SFMono-Regular", Menlo, Consolas, monospace;
  font-size: 0.85em;
  padding: 2px 6px;
  background-color: #f7f6f3;
  border: 1px solid #e9e9e7;
  border-radius: 3px;
  color: #37352f;
  box-shadow: 0 1px 0 #e9e9e7;
}

.markdown-body strong,
.markdown-body b {
  font-weight: 600;
  color: #37352f;
}

.markdown-body em,
.markdown-body i {
  font-style: italic;
}

.markdown-body del,
.markdown-body s {
  color: #9b9a97;
  text-decoration: line-through;
}

/* Notion 风格高亮色块 */
.markdown-body .highlight-default {
  background-color: rgba(206, 205, 202, 0.5);
}

.markdown-body .highlight-gray {
  background-color: rgba(155, 154, 151, 0.4);
}

.markdown-body .highlight-brown {
  background-color: rgba(140, 46, 0, 0.2);
}

.markdown-body .highlight-orange {
  background-color: rgba(245, 93, 0, 0.2);
}

.markdown-body .highlight-yellow {
  background-color: rgba(233, 168, 0, 0.2);
}

.markdown-body .highlight-green {
  background-color: rgba(0, 135, 107, 0.2);
}

.markdown-body .highlight-blue {
  background-color: rgba(0, 120, 223, 0.2);
}

.markdown-body .highlight-purple {
  background-color: rgba(103, 36, 222, 0.2);
}

.markdown-body .highlight-pink {
  background-color: rgba(221, 0, 129, 0.2);
}

.markdown-body .highlight-red {
  background-color: rgba(255, 0, 26, 0.2);
}

/* 任务列表样式 */
.markdown-body input[type="checkbox"] {
  margin-right: 0.5em;
}

/* 脚注样式 */
.markdown-body .footnotes {
  font-size: 0.85em;
  color: #9b9a97;
  border-top: 1px solid #e9e9e7;
  margin-top: 2em;
  padding-top: 1em;
}

/* Callout 样式 - Notion 风格 */
.markdown-body .callout {
  padding: 16px 16px 16px 12px;
  border-radius: 4px;
  margin: 0.5em 0;
  display: flex;
  align-items: flex-start;
}

.markdown-body .callout-icon {
  margin-right: 8px;
  font-size: 1.2em;
}

.markdown-body .callout-default {
  background-color: rgba(241, 241, 239, 1);
}

.markdown-body .callout-info {
  background-color: rgba(231, 243, 248, 1);
}

.markdown-body .callout-warning {
  background-color: rgba(251, 243, 219, 1);
}

.markdown-body .callout-danger {
  background-color: rgba(253, 235, 236, 1);
}

.markdown-body .callout-success {
  background-color: rgba(237, 243, 236, 1);
}
`;
