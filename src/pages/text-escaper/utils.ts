import he from 'he';
import jsesc from 'jsesc';

export type EscapeType = 'html' | 'unicode' | 'js';

export function escapeHtml(text: string): string {
  // 先用 he 转义 HTML 特殊字符，再把空格转成 &nbsp; 以保留多个连续空格
  const encoded = he.encode(text, { useNamedReferences: true });
  return encoded.replace(/ /g, '&nbsp;');
}

export function unescapeHtml(text: string): string {
  return he.decode(text);
}

export function escapeUnicode(text: string): string {
  const result: string[] = [];
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (code > 127) {
      // 对于 BMP 内的字符使用 \uXXXX，超出 BMP 的使用 \u{XXXXX}
      if (code <= 0xffff) {
        result.push('\\u' + code.toString(16).padStart(4, '0'));
      } else {
        result.push('\\u{' + code.toString(16) + '}');
      }
    } else {
      result.push(char);
    }
  }
  return result.join('');
}

export function unescapeUnicode(text: string): string {
  // 先处理 \u{XXXXX} 格式（ES6），再处理 \uXXXX 格式
  return text
    .replace(/\\u\{([\dA-F]+)\}/gi, (_, hex) => {
      return String.fromCodePoint(parseInt(hex, 16));
    })
    .replace(/\\u([\dA-F]{4})/gi, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
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
