import { useDebounceFn, useLatest } from 'ahooks';
import { defaultTheme, githubDarkTheme, JsonEditor } from 'json-edit-react';
import { Braces, Eraser, FileJson, Maximize2, Minimize2, Trash2, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { CodeArea } from '@/components/code-area';
import { ResizablePanels } from '@/components/resizable-panels';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useThemeStore } from '@/store/theme';

import { HistoryDialog } from './history-dialog';
import { SaveJsonDialog } from './save-dialog';
import { JsonSettings } from './settings';
import { useJsonFormatterStore } from './store';
import { ERROR_HIGHLIGHT_RANGE, JsonParseErrorInfo, parseJsonWithBetterError } from './utils';

export default function JsonFormatterPage() {
  const { t } = useTranslation('tools');
  const [input, setInput] = useState('');
  const [jsonData, setJsonData] = useState<any>(null);
  const [error, setError] = useState<JsonParseErrorInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { effectiveTheme } = useThemeStore();
  const settings = useJsonFormatterStore();

  // 使用 useLatest 保存当前 input 值，用于防抖函数内部访问
  const inputRef = useLatest(input);

  // 直接计算，开销极低无需 memo
  const hasInput = input.trim().length > 0;

  // 解析 JSON 核心函数
  const parseJson = (jsonStr: string) => {
    if (!jsonStr.trim()) {
      setJsonData(null);
      setError(null);
      return null;
    }

    try {
      const parsed = parseJsonWithBetterError(jsonStr);
      setJsonData(parsed);
      setError(null);
      return parsed;
    } catch (e: any) {
      setJsonData(null);
      if (e.errorInfo) {
        setError(e.errorInfo as JsonParseErrorInfo);
      } else {
        setError({ message: e.message, position: null, errorLine: null, column: null });
      }
      return null;
    }
  };

  const processJson = (minify: boolean) => {
    const parsed = parseJson(input);
    if (parsed) {
      // 手动点击按钮时才更新 input（带格式化或压缩）
      setInput(JSON.stringify(parsed, null, minify ? 0 : 2));
    }
  };

  // 自动格式化（防抖）- 只更新 jsonData 和 error，不更新 input
  const { run: autoFormat } = useDebounceFn(
    () => {
      parseJson(inputRef.current);
    },
    { wait: 300 },
  );

  // 监听输入变化，自动触发格式化
  useEffect(() => {
    autoFormat();
  }, [input, autoFormat]);

  const handleTreeUpdate = (newData: any) => {
    setJsonData(newData);
  };

  // 简易模式下使用的格式化代码
  const displayCode = useMemo(() => {
    if (jsonData !== null) {
      return JSON.stringify(jsonData, null, settings.indent);
    }
    return input;
  }, [jsonData, settings.indent, input]);

  // 加载历史记录
  const handleLoadHistory = (content: string) => {
    setInput(content);
    parseJson(content);
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
      toast.info(t('jsonFormatter.noEscapesFound'));
    } else {
      setInput(newText);
      toast.success(t('jsonFormatter.escapesRemoved'));
    }
  };

  const inputPanel = (
    <>
      <header className="flex items-center justify-between px-3 py-1 border-b border-border bg-muted/30 min-w-0 gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <FileJson className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-xs text-muted-foreground uppercase tracking-wider hidden md:block">
            {t('jsonFormatter.inputLabel')}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-wrap justify-end min-w-0">
          <SaveJsonDialog content={input} disabled={!hasInput || !!error} />
          <HistoryDialog onLoad={handleLoadHistory} />
          <div className="w-px h-4 bg-border mx-0.5 hidden sm:block" />
          <Button
            size="sm"
            variant="ghost"
            onClick={removeEscapes}
            disabled={!hasInput}
            className="h-7 px-1.5"
            title={t('jsonFormatter.removeEscapes')}
          >
            <Eraser className="h-3.5 w-3.5" />
            <span className="hidden 2xl:inline ml-1">{t('jsonFormatter.removeEscapes')}</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setInput('');
              setJsonData(null);
              setError(null);
            }}
            disabled={!hasInput}
            className="h-7 px-1.5"
            title={t('jsonFormatter.clear')}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden 2xl:inline ml-1">{t('jsonFormatter.clear')}</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => processJson(true)}
            disabled={!hasInput}
            className="h-7 px-1.5"
            title={t('jsonFormatter.minify')}
          >
            <Minimize2 className="h-3.5 w-3.5" />
            <span className="hidden 2xl:inline ml-1">{t('jsonFormatter.minify')}</span>
          </Button>
          <Button
            size="sm"
            onClick={() => processJson(false)}
            disabled={!hasInput}
            className="h-7 px-1.5"
            title={t('jsonFormatter.format')}
          >
            <Braces className="h-3.5 w-3.5" />
            <span className="hidden 2xl:inline ml-1">{t('jsonFormatter.format')}</span>
          </Button>
        </div>
      </header>
      <div className="flex-1 relative min-h-0 min-w-0">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('jsonFormatter.inputPlaceholder')}
          className="h-full w-full font-mono !text-xs resize-none p-4 leading-relaxed custom-scrollbar rounded-none border-0 focus-visible:ring-0"
          spellCheck={false}
        />
        {error && (
          <div className="absolute bottom-4 left-4 right-4 bg-destructive/80 border border-destructive text-white rounded-md p-3 flex items-start gap-2 text-xs animate-in slide-in-from-bottom-2 shadow-sm backdrop-blur-sm">
            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold mb-1">{t('jsonFormatter.parseError')}</p>
              <p className="font-mono opacity-90 mb-2">{error.message}</p>
              {error.errorLine !== null && error.column !== null && (
                <p className="font-mono break-all opacity-90 overflow-x-auto custom-scrollbar">
                  {error.errorLine.slice(0, Math.max(0, error.column - ERROR_HIGHLIGHT_RANGE))}
                  <span className="bg-yellow-400 text-black px-0.5 rounded">
                    {error.errorLine.slice(Math.max(0, error.column - ERROR_HIGHLIGHT_RANGE), error.column + 1)}
                  </span>
                  {error.errorLine.slice(error.column + 1)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );

  const outputPanel = (
    <div className={`flex flex-col h-full ${isExpanded ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <header className="flex items-center justify-between px-3 py-1 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Braces className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-xs text-muted-foreground uppercase tracking-wider hidden md:block">
            {t('jsonFormatter.outputLabel')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <JsonSettings />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? t('jsonFormatter.exitFullscreen') : t('jsonFormatter.fullscreen')}
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </header>
      <div className="flex-1 relative min-h-0 min-w-0 overflow-auto custom-scrollbar">
        {jsonData !== null ? (
          settings.simpleMode ? (
            <CodeArea
              code={displayCode}
              showCopyButton={false}
              language="json"
              className="h-full bg-transparent"
              codeClassName="border-none"
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
            <p className="text-sm">{t('jsonFormatter.waitingInput')}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ResizablePanels left={inputPanel} right={outputPanel} hideLeft={isExpanded} className="h-[calc(100vh-4rem)]" />
  );
}
