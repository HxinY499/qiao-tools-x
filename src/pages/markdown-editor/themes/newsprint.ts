// Newsprint 主题 - 来自 Typora（报纸印刷风格）
export const style = `
.markdown-body {
  font-family: "PT Serif", 'Times New Roman', Times, Georgia, serif;
  color: #1f0909;
  line-height: 1.5em;
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
  font-weight: bold;
  color: #1f0909;
  margin-bottom: 1.5em;
}

.markdown-body h1 {
  font-size: 1.875em;
  line-height: 1.3em;
  font-weight: normal;
  margin-top: 2em;
  margin-bottom: 0.5em;
  border-bottom: 1px solid #c5c5c5;
  padding-bottom: 0.8125em;
}

.markdown-body h2,
.markdown-body h3 {
  font-size: 1.3125em;
  line-height: 1.15;
  margin-top: 2.285714em;
  margin-bottom: 0.75em;
}

.markdown-body h3 {
  font-weight: normal;
}

.markdown-body h4 {
  font-size: 1.125em;
  margin-top: 2.67em;
}

.markdown-body h5,
.markdown-body h6 {
  font-size: 1em;
}

.markdown-body p,
.markdown-body blockquote,
.markdown-body pre {
  margin-bottom: 1.5em;
}

.markdown-body a {
  text-decoration: none;
  color: #065588;
}

.markdown-body a:hover,
.markdown-body a:active {
  text-decoration: underline;
}

.markdown-body blockquote {
  font-style: italic;
  border-left: 5px solid #bababa;
  margin-left: 2em;
  padding-left: 1em;
  color: #656565;
}

.markdown-body ul,
.markdown-body ol {
  margin: 0 0 1.5em 1.5em;
  padding-left: 0;
}

.markdown-body ul {
  list-style-type: disc;
}

.markdown-body ol {
  list-style-type: decimal;
}

.markdown-body li ol > li {
  list-style-type: lower-alpha;
}

.markdown-body li li ol > li {
  list-style-type: lower-roman;
}

.markdown-body table {
  margin-bottom: 1.5em;
  font-size: 1em;
  border-collapse: collapse;
}

.markdown-body thead {
  background-color: #dadada;
}

.markdown-body tr:nth-child(even) {
  background: #e8e7e7;
}

.markdown-body th,
.markdown-body td {
  padding: 0.25em 0.4em;
  text-align: left;
  vertical-align: top;
}

.markdown-body th {
  text-transform: uppercase;
}

.markdown-body code,
.markdown-body tt {
  background-color: #dadada;
  padding: 2px 4px;
  font-size: 0.875em;
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  border-radius: 2px;
}

.markdown-body pre {
  background-color: #dadada;
  margin-left: 2em;
  padding: 1ch;
  overflow: auto;
}

.markdown-body pre code {
  background: transparent;
  padding: 0;
  font-size: 0.875em;
  line-height: 1.714285em;
}

.markdown-body hr {
  border: none;
  border-bottom: 1px solid #c5c5c5;
  margin: 1.5em 0;
}

.markdown-body img {
  max-width: 100%;
}

.markdown-body mark {
  background-color: #fff3cd;
  padding: 0.1em 0.2em;
}
`;
