// JetBrains Dark 主题 - 来自 Typora (https://theme.typora.io/theme/JetBrains-Dark/)
// 模仿 JetBrains IDE（IDEA / WebStorm / GoLand）风格的暗色主题
export const style = `
.markdown-body {
  font-family: "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #a9b7c6;
  line-height: 1.8;
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
  font-family: "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 600;
  color: #ffc66d;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  line-height: 1.4;
}

.markdown-body h1 {
  font-size: 2.2em;
  border-bottom: 2px solid #3c3f41;
  padding-bottom: 0.3em;
}

.markdown-body h2 {
  font-size: 1.8em;
  border-bottom: 1px solid #3c3f41;
  padding-bottom: 0.25em;
}

.markdown-body h3 {
  font-size: 1.5em;
  color: #cc7832;
}

.markdown-body h4 {
  font-size: 1.25em;
  color: #cc7832;
}

.markdown-body h5 {
  font-size: 1.1em;
  color: #9876aa;
}

.markdown-body h6 {
  font-size: 1em;
  color: #808080;
}

.markdown-body p,
.markdown-body blockquote,
.markdown-body ul,
.markdown-body ol,
.markdown-body dl,
.markdown-body table,
.markdown-body pre {
  margin: 0.8em 0;
}

.markdown-body a {
  color: #287bde;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}

.markdown-body a:hover {
  color: #589df6;
  border-bottom-color: #589df6;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 2em;
}

.markdown-body ul {
  list-style-type: disc;
}

.markdown-body ol {
  list-style-type: decimal;
}

.markdown-body li {
  margin: 0.3em 0;
}

.markdown-body li > ul,
.markdown-body li > ol {
  margin: 0.2em 0;
}

.markdown-body hr {
  margin: 1.5em 0;
  border: none;
  border-top: 1px solid #3c3f41;
}

.markdown-body blockquote {
  padding: 0.5em 1em;
  margin: 1em 0;
  border-left: 4px solid #629755;
  background-color: rgba(98, 151, 85, 0.1);
  color: #808080;
  border-radius: 0 4px 4px 0;
}

.markdown-body blockquote > p:first-child {
  margin-top: 0;
}

.markdown-body blockquote > p:last-child {
  margin-bottom: 0;
}

.markdown-body table {
  margin: 1em 0;
  border-collapse: collapse;
  width: 100%;
  font-size: 0.9em;
}

.markdown-body table th,
.markdown-body table td {
  padding: 8px 12px;
  border: 1px solid #3c3f41;
}

.markdown-body table th {
  font-weight: 600;
  color: #ffc66d;
  background-color: rgba(60, 63, 65, 0.6);
  text-align: left;
}

.markdown-body table td {
  background-color: transparent;
}

.markdown-body table tbody tr:hover td {
  background-color: rgba(60, 63, 65, 0.3);
}

.markdown-body code,
.markdown-body tt {
  font-family: "JetBrains Mono", "Fira Code", "SF Mono", Monaco, Consolas, monospace;
  font-size: 0.9em;
  padding: 2px 6px;
  background-color: rgba(60, 63, 65, 0.8);
  border-radius: 4px;
  color: #a5c261;
}

.markdown-body pre {
  padding: 16px;
  background-color: #2b2b2b;
  border: 1px solid #3c3f41;
  border-radius: 6px;
  overflow: auto;
}

.markdown-body pre code {
  font-family: "JetBrains Mono", "Fira Code", "SF Mono", Monaco, Consolas, monospace;
  font-size: 0.875em;
  line-height: 1.6;
  padding: 0;
  background: transparent;
  border-radius: 0;
  color: #a9b7c6;
}

.markdown-body img {
  max-width: 100%;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.markdown-body mark {
  background-color: #52503a;
  color: #a9b7c6;
  padding: 0.1em 0.3em;
  border-radius: 3px;
}

.markdown-body kbd {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.85em;
  padding: 3px 8px;
  background-color: #3c3f41;
  border: 1px solid #555555;
  border-radius: 4px;
  color: #a9b7c6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.markdown-body strong,
.markdown-body b {
  font-weight: 600;
  color: #cc7832;
}

.markdown-body em,
.markdown-body i {
  font-style: italic;
  color: #808080;
}

.markdown-body del,
.markdown-body s {
  color: #808080;
  text-decoration: line-through;
}

/* 任务列表样式 */
.markdown-body input[type="checkbox"] {
  margin-right: 0.5em;
}

/* 脚注样式 */
.markdown-body .footnotes {
  font-size: 0.85em;
  color: #808080;
  border-top: 1px solid #3c3f41;
  margin-top: 2em;
  padding-top: 1em;
}
`;
