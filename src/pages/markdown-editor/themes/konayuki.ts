// Konayuki 主题 - 来自 Typora (https://theme.typora.io/theme/Konayuki/)
// 灵感来自北海道雪景的清新现代主题，支持亮色模式
export const style = `
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
  color: #3d4451;
  line-height: 1.75;
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
  color: #2c3e50;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  line-height: 1.4;
}

.markdown-body h1 {
  font-size: 2.25em;
  border-bottom: 2px solid #e8f4fc;
  padding-bottom: 0.3em;
  color: #1a73e8;
}

.markdown-body h2 {
  font-size: 1.75em;
  border-bottom: 1px solid #e8f4fc;
  padding-bottom: 0.25em;
  color: #2196f3;
}

.markdown-body h3 {
  font-size: 1.5em;
  color: #42a5f5;
}

.markdown-body h4 {
  font-size: 1.25em;
  color: #5c6bc0;
}

.markdown-body h5 {
  font-size: 1.1em;
  color: #7986cb;
}

.markdown-body h6 {
  font-size: 1em;
  color: #9fa8da;
}

.markdown-body p,
.markdown-body blockquote,
.markdown-body ul,
.markdown-body ol,
.markdown-body dl,
.markdown-body table,
.markdown-body pre {
  margin: 0.85em 0;
}

.markdown-body a {
  color: #1a73e8;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}

.markdown-body a:hover {
  color: #1557b0;
  border-bottom-color: #1557b0;
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
  margin: 0.35em 0;
}

.markdown-body li > ul,
.markdown-body li > ol {
  margin: 0.2em 0;
}

.markdown-body hr {
  margin: 1.5em 0;
  border: none;
  border-top: 1px solid #e0e6ed;
}

.markdown-body blockquote {
  padding: 0.75em 1.25em;
  margin: 1em 0;
  border-left: 4px solid #90caf9;
  background: linear-gradient(135deg, #f5faff 0%, #e8f4fc 100%);
  color: #546e7a;
  border-radius: 0 8px 8px 0;
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
  border-radius: 8px;
  overflow: hidden;
}

.markdown-body table th,
.markdown-body table td {
  padding: 10px 14px;
  border: 1px solid #e0e6ed;
}

.markdown-body table th {
  font-weight: 600;
  color: #2c3e50;
  background: linear-gradient(135deg, #f5faff 0%, #e8f4fc 100%);
  text-align: left;
}

.markdown-body table td {
  background-color: transparent;
}

.markdown-body table tbody tr:hover td {
  background-color: #f5faff;
}

.markdown-body table tbody tr:nth-child(even) td {
  background-color: #fafcfe;
}

.markdown-body code,
.markdown-body tt {
  font-family: "Maple Mono NF CN", "SF Mono", Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 0.9em;
  padding: 2px 8px;
  background-color: #e8f4fc;
  border-radius: 6px;
  color: #1a73e8;
}

.markdown-body pre {
  padding: 16px;
  background-color: #1e2a3a;
  border-radius: 10px;
  overflow: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.markdown-body pre code {
  font-family: "Maple Mono NF CN", "SF Mono", Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 0.875em;
  line-height: 1.6;
  padding: 0;
  background: transparent;
  border-radius: 0;
  color: #d4d4d4;
}

.markdown-body img {
  max-width: 100%;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.markdown-body mark {
  background: linear-gradient(120deg, #fff3cd 0%, #ffeaa7 100%);
  color: #3d4451;
  padding: 0.1em 0.4em;
  border-radius: 4px;
}

.markdown-body kbd {
  font-family: "Maple Mono NF CN", "SF Mono", Monaco, monospace;
  font-size: 0.85em;
  padding: 3px 8px;
  background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 6px;
  color: #495057;
  box-shadow: 0 2px 0 #dee2e6;
}

.markdown-body strong,
.markdown-body b {
  font-weight: 600;
  color: #2c3e50;
}

.markdown-body em,
.markdown-body i {
  font-style: italic;
  color: #5c6bc0;
}

.markdown-body del,
.markdown-body s {
  color: #adb5bd;
  text-decoration: line-through;
}

/* 任务列表样式 */
.markdown-body input[type="checkbox"] {
  margin-right: 0.5em;
  accent-color: #1a73e8;
}

/* 脚注样式 */
.markdown-body .footnotes {
  font-size: 0.85em;
  color: #6c757d;
  border-top: 1px solid #e0e6ed;
  margin-top: 2em;
  padding-top: 1em;
}

/* Callout 样式 - 参考 Mdmdt 主题 */
.markdown-body .callout {
  padding: 1em;
  border-radius: 8px;
  margin: 1em 0;
}

.markdown-body .callout-info {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.markdown-body .callout-warning {
  background-color: #fff3e0;
  border-left: 4px solid #ff9800;
}

.markdown-body .callout-danger {
  background-color: #ffebee;
  border-left: 4px solid #f44336;
}

.markdown-body .callout-success {
  background-color: #e8f5e9;
  border-left: 4px solid #4caf50;
}
`;
