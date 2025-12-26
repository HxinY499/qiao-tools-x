export interface JsonParseErrorInfo {
  message: string;
  position: number | null;
  errorLine: string | null;
  column: number | null;
}

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

    const errorInfo: JsonParseErrorInfo = {
      message: e.message,
      position: errIdx,
      errorLine: null,
      column: null,
    };

    if (errIdx != null) {
      const { errorLine, column } = getErrorLineAndColumn(txt, errIdx);
      errorInfo.errorLine = errorLine;
      errorInfo.column = column;
    }

    const error = new Error(e.message) as Error & { errorInfo: JsonParseErrorInfo };
    error.errorInfo = errorInfo;
    throw error;
  }
}

/**
 * 获取错误位置所在的行内容和列号
 */
function getErrorLineAndColumn(text: string, position: number) {
  const allLines = text.split('\n');
  let currentPos = 0;

  for (let i = 0; i < allLines.length; i++) {
    const lineLength = allLines[i].length;
    if (currentPos + lineLength >= position || i === allLines.length - 1) {
      const column = position - currentPos;
      return { errorLine: allLines[i], column };
    }
    currentPos += lineLength + 1;
  }

  return { errorLine: allLines[0] || '', column: position };
}
