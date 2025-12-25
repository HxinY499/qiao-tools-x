/**
 * 更好的 JSON 解析函数，提供详细的错误信息
 */
export function parseJsonWithBetterError(txt: string, reviver?: (key: string, value: any) => any) {
  try {
    return JSON.parse(txt, reviver);
  } catch (e: any) {
    if (typeof txt !== 'string') {
      const txtStr = String(txt);
      const isEmptyArray = Array.isArray(txt) && (txt as any[]).length === 0;
      const errorMessage = 'Cannot parse ' + (isEmptyArray ? 'an empty array' : txtStr);
      throw new TypeError(errorMessage);
    }

    // 解析错误位置
    const syntaxErr = e.message.match(/position\s+(\d+)/i);
    const errIdx = syntaxErr ? +syntaxErr[1] : null;

    if (errIdx != null) {
      const { line, column, lineStart, lineEnd, lines } = getLineAndColumnWithContext(txt, errIdx);
      const errorLine = txt.slice(lineStart, lineEnd);

      // 构建更直观的错误信息
      const locationInfo = '错误位置: 第 ' + line + ' 行，第 ' + column + ' 列';
      const arrow = ' '.repeat(column - 1) + '^';
      e.message += '\n\n' + locationInfo + '\n\n';
      e.message += '错误行:\n' + errorLine + '\n';
      e.message += arrow + '\n\n';
      e.message += '上下文:\n' + lines.join('\n');
    } else {
      e.message += '\n\n上下文:\n' + txt.slice(0, 500);
    }
    throw e;
  }
}

/**
 * 获取错误位置的行号、列号和行的起止位置，以及前后行内容
 */
function getLineAndColumnWithContext(text: string, position: number) {
  // 分割所有行
  const allLines = text.split('\n');
  const totalLines = allLines.length;

  // 计算错误在哪一行
  let currentPos = 0;
  let errorLineIndex = 0;
  let column = 0;

  for (let i = 0; i < totalLines; i++) {
    const lineLength = allLines[i].length + 1; // +1 for \n
    if (currentPos + lineLength > position) {
      errorLineIndex = i;
      column = position - currentPos + 1;
      break;
    }
    currentPos += lineLength;
  }

  const line = errorLineIndex + 1;
  const lineStart = currentPos;
  const lineEnd = errorLineIndex < totalLines - 1 ? currentPos + allLines[errorLineIndex].length : text.length;

  // 获取前后 2 行的上下文
  const contextLines = 2;
  const startLine = Math.max(0, errorLineIndex - contextLines);
  const endLine = Math.min(totalLines, errorLineIndex + contextLines + 1);
  const lines = allLines.slice(startLine, endLine).map((l, idx) => {
    const lineNum = startLine + idx + 1;
    const prefix = lineNum === line ? '>' : ' ';
    return prefix + ' ' + lineNum + ': ' + l;
  });

  return { line, column, lineStart, lineEnd, lines };
}
