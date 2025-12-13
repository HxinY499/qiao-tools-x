import he from 'he';
import jsesc from 'jsesc';

export type EscapeType = 'html' | 'unicode' | 'js';

export function escapeHtml(text: string): string {
  return he.encode(text, { useNamedReferences: true });
}

export function unescapeHtml(text: string): string {
  return he.decode(text);
}

export function escapeUnicode(text: string): string {
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      return code > 127 ? '\\u' + code.toString(16).padStart(4, '0') : char;
    })
    .join('');
}

export function unescapeUnicode(text: string): string {
  return text.replace(/\\u[\dA-F]{4}/gi, (match) => {
    return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  });
}

export function escapeJs(text: string): string {
  return jsesc(text, { quotes: 'double', wrap: false });
}

export function unescapeJs(text: string): string {
  try {
    // 简单的 JSON.parse 处理
    // 注意：这不是完美的 JS 反转义，但能处理大多数常见情况
    if (text.startsWith('"') && text.endsWith('"')) {
      return JSON.parse(text);
    }
    return JSON.parse(`"${text}"`);
  } catch (e) {
    return text;
  }
}
