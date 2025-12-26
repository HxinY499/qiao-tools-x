// Vercel 主题 - 来自 Typora (https://theme.typora.io/theme/Vercel/)
// 采用 Vercel 风格的简洁设计
export const style = `
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  color: #171717;
  line-height: 1.6;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  background-color: transparent;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.3;
  color: #171717;
}

.markdown-body h1 {
  font-size: 2.5rem;
  line-height: 3.5rem;
  border-bottom: none;
}

.markdown-body h2 {
  font-size: 2rem;
  line-height: 2.5rem;
  border-bottom: none;
}

.markdown-body h3 {
  font-size: 1.5em;
  line-height: 2rem;
}

.markdown-body h4 {
  font-size: 1.25em;
}

.markdown-body h5 {
  font-size: 1em;
}

.markdown-body h6 {
  font-size: 1em;
  color: #666666;
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
  font-weight: 500;
  color: #0072f5;
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 2em;
}

.markdown-body li > ol,
.markdown-body li > ul {
  margin: 0;
}

.markdown-body hr {
  margin: 1.5em 0;
  border: none;
  border-bottom: 1px solid #c9c9c9;
}

.markdown-body blockquote {
  position: relative;
  padding: 12px 12px 12px 40px;
  border: 1px solid #c9c9c9;
  border-radius: 8px;
  color: #666666;
  background-color: transparent;
}

.markdown-body blockquote::before {
  content: '"';
  position: absolute;
  left: 12px;
  top: 8px;
  font-size: 24px;
  color: #a8a8a8;
  font-family: Georgia, serif;
}

.markdown-body blockquote > p:first-child {
  margin-top: 0;
}

.markdown-body blockquote > p:last-child {
  margin-bottom: 0;
}

.markdown-body table {
  margin: 15px 0;
  font-size: 0.875rem;
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

.markdown-body table th,
.markdown-body table td {
  padding: 10px;
  text-align: left;
}

.markdown-body table th {
  font-weight: 400;
  color: #666666;
  background-color: #fafafa;
  border-top: 1px solid #eaeaea;
  border-bottom: 1px solid #eaeaea;
}

.markdown-body table th:first-child {
  border-left: 1px solid #eaeaea;
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

.markdown-body table th:last-child {
  border-right: 1px solid #eaeaea;
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}

.markdown-body table td {
  border-bottom: none;
}

.markdown-body table tbody tr:hover td {
  background-color: #fafafa;
}

.markdown-body code,
.markdown-body tt {
  padding: 2px 6px;
  font-family: "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.9em;
  background-color: #c9c9c9;
  border-radius: 4px;
  color: #171717;
}

.markdown-body pre {
  padding: 16px;
  padding-top: 40px;
  background-color: #282c34;
  border-radius: 8px;
  overflow: auto;
  position: relative;
}

.markdown-body pre::before {
  content: "";
  position: absolute;
  left: 12px;
  top: 12px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff5f56;
  box-shadow: 20px 0 #ffbd2e, 40px 0 #27c93f;
}

.markdown-body pre code {
  padding: 0;
  font-size: 0.875em;
  line-height: 1.5;
  background: transparent;
  border-radius: 0;
  color: #abb2bf;
}

.markdown-body img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.markdown-body mark {
  background-color: #52aeff;
  border-radius: 3px;
  padding: 0.1em 0.2em;
  color: #fff;
}

.markdown-body kbd {
  font-family: "SF Mono", Monaco, Consolas, monospace;
  padding: 2px 8px;
  font-size: 0.9em;
  color: #fff;
  background-color: #7d7d7d;
  border-radius: 4px;
  border: none;
}

.markdown-body strong,
.markdown-body b {
  font-weight: 600;
  color: #171717;
}

.markdown-body em,
.markdown-body i {
  font-style: italic;
}
`;
