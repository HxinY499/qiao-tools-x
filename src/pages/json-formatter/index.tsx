import { defaultTheme, githubDarkTheme, JsonEditor } from 'json-edit-react';
import { Braces, Eraser, FileJson, Maximize2, Minimize2, Trash2, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CodeArea } from '@/components/code-area';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useThemeStore } from '@/store/theme';
import { cn } from '@/utils';

import { HistoryDialog } from './history-dialog';
import { SaveJsonDialog } from './save-dialog';
import { JsonSettings } from './settings';
import { useJsonFormatterStore } from './store';

export default function JsonFormatterPage() {
  const [input, setInput] = useState('');
  const [jsonData, setJsonData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { effectiveTheme } = useThemeStore();
  const settings = useJsonFormatterStore();

  // 派生状态：是否有输入内容
  const hasInput = useMemo(() => input.trim().length > 0, [input]);

  const processJson = (minify: boolean) => {
    if (!input.trim()) {
      setJsonData(null);
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      setJsonData(parsed);
      setInput(JSON.stringify(parsed, null, minify ? 0 : 2));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleTreeUpdate = (newData: any) => {
    setJsonData(newData);
    // Optional: sync back to input text
    // setInput(JSON.stringify(newData, null, 2));
  };

  // 简易模式下，使用当前 jsonData 重新格式化为字符串，如果没有 jsonData 则尝试使用 input
  // 为了保证显示的一致性，优先使用 jsonData 序列化
  const getDisplayCode = () => {
    if (jsonData !== null) {
      return JSON.stringify(jsonData, null, settings.indent);
    }
    return input;
  };

  // 加载历史记录
  const handleLoadHistory = (content: string) => {
    setInput(content);
    try {
      const parsed = JSON.parse(content);
      setJsonData(parsed);
      setError(null);
    } catch (e) {
      setJsonData(null);
      setError((e as Error).message);
    }
  };

  // 去除转义符
  const removeEscapes = () => {
    if (!input) return;
    // 去除常见转义符：\' -> ', \" -> ", \\ -> \, \/ -> /
    // 保留 \n, \t, \r, \uXXXX 等特殊转义
    const controlChars = ['n', 't', 'r', 'b', 'f', 'v', '0', 'u', 'x'];
    const newText = input.replace(/\\(.)/g, (match, char) => {
      if (controlChars.includes(char)) return match;
      return char;
    });

    if (newText === input) {
      toast.info('未找到可去除的转义符');
    } else {
      setInput(newText);
      toast.success('已去除转义符');
      // 尝试解析去除转义后的 JSON
      try {
        const parsed = JSON.parse(newText);
        setJsonData(parsed);
        setError(null);
      } catch (e) {
        setJsonData(null);
        setError((e as Error).message);
      }
    }
  };

  return (
    <div className="container mx-auto p-2 lg:p-4 lg:h-[calc(100vh-4rem)] flex flex-col gap-2 lg:gap-4">
      <div
        className={cn(
          'grid gap-2 lg:gap-4 lg:h-full transition-all duration-300',
          isExpanded ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2',
        )}
      >
        {/* Input Section */}
        <Card
          className={cn(
            'flex flex-col p-3 lg:p-4 gap-3 lg:gap-4 transition-all duration-300',
            // 移动端给固定高度，方便输入；桌面端撑满
            'h-[400px] lg:h-full',
            isExpanded ? 'hidden' : 'flex',
          )}
        >
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wider hidden md:block">
                输入 JSON
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <SaveJsonDialog content={input} disabled={!hasInput || !!error} />
              <HistoryDialog onLoad={handleLoadHistory} />
              <div className="w-px h-4 bg-border mx-1" />
              <Button
                size="sm"
                variant="secondary"
                onClick={removeEscapes}
                disabled={!hasInput}
                className="h-8 px-2 xl:px-3"
                title="去除转义符"
              >
                <Eraser className="h-3.5 w-3.5 xl:hidden" />
                <span className="hidden xl:inline">去除转义</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setInput('');
                  setJsonData(null);
                  setError(null);
                }}
                disabled={!hasInput}
                className="h-8 px-2 xl:px-3"
                title="清空"
              >
                <Trash2 className="h-3.5 w-3.5 xl:hidden" />
                <span className="hidden xl:inline">清空</span>
              </Button>
              <Button
                size="sm"
                onClick={() => processJson(true)}
                disabled={!hasInput}
                className="h-8 gap-2 px-2 xl:px-3"
                title="压缩"
              >
                <Minimize2 className="h-3.5 w-3.5 xl:hidden" />
                <span className="hidden xl:inline">压缩</span>
              </Button>
              <Button
                size="sm"
                onClick={() => processJson(false)}
                disabled={!hasInput}
                className="h-8 gap-2 px-2 xl:px-3"
                title="格式化"
              >
                <Braces className="h-3.5 w-3.5 xl:hidden" />
                <span className="hidden xl:inline">格式化</span>
              </Button>
            </div>
          </header>

          <div className="flex-1 relative min-h-0">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="在此粘贴 JSON 代码..."
              className="h-full font-mono !text-xs resize-none p-3 lg:p-4 leading-relaxed"
              spellCheck={false}
            />
            {error && (
              <div className="absolute bottom-4 left-4 right-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3 flex items-start gap-2 text-xs animate-in slide-in-from-bottom-2">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold mb-1">解析错误</p>
                  <p className="font-mono break-all opacity-90">{error}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Output Section */}
        <Card className="flex flex-col p-3 lg:p-4 gap-3 lg:gap-4 h-[500px] lg:h-full min-h-[300px]">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Braces className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wider hidden md:block">
                格式化结果
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <JsonSettings />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? '退出全屏' : '全屏查看'}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </header>

          <div className="flex-1 relative min-h-0 border rounded-md overflow-auto bg-background/50">
            {jsonData !== null ? (
              settings.simpleMode ? (
                <CodeArea
                  code={getDisplayCode()}
                  language="json"
                  className="h-full border-none bg-transparent"
                  showCopyButton={false}
                />
              ) : (
                <div className="min-h-full w-full">
                  <JsonEditor
                    data={jsonData}
                    setData={handleTreeUpdate}
                    theme={effectiveTheme === 'dark' ? githubDarkTheme : defaultTheme}
                    restrictEdit={settings.viewOnly}
                    viewOnly={settings.viewOnly}
                    rootName="root"
                    maxWidth="100%"
                    minWidth="100%"
                    rootFontSize={`${settings.rootFontSize}px`}
                    indent={settings.indent}
                    collapse={settings.collapse}
                    showArrayIndices={settings.showArrayIndices}
                    showStringQuotes={settings.showStringQuotes}
                    keySort={settings.sortKeys}
                    showCollectionCount={settings.showCollectionCount}
                    arrayIndexFromOne={settings.arrayIndexFromOne}
                    showIconTooltips={settings.showIconTooltips}
                    stringTruncate={settings.stringTruncate}
                    collapseAnimationTime={settings.collapseAnimationTime}
                    enableClipboard={settings.enableClipboard}
                  />
                </div>
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 gap-2 pointer-events-none">
                <Braces className="h-12 w-12 opacity-20" />
                <p className="text-sm">等待输入...</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
