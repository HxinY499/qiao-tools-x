/** 纯文本块展示（关闭语法高亮时使用，避免大数据量下 shiki 高亮卡顿） */
export function PlainCodeBlock({ code }: { code: string }) {
  return (
    <pre className="code-area custom-scrollbar text-[11px] font-mono border rounded-md bg-background/80 dark:bg-[#1E1E1E] px-3 py-2 overflow-auto whitespace-pre-wrap break-words max-w-full">
      {code}
    </pre>
  );
}
