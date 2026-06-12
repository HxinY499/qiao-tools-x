import { useDebounceFn } from 'ahooks';
import { ArrowLeftRight, FileDiff, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { CopyButton } from '@/components/copy-button';
import { FileDragUploader } from '@/components/file-drag-uploader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { TextDiffResultView } from './result-view';
import { useTextDiffStore } from './store';
import type { DiffLine, DiffViewMode } from './types';
import { buildDiffLines, buildDiffSummaryText, calculateStats } from './utils';

type InputMode = 'paste' | 'upload';

// 上传文件的通用配置（模块级常量，避免每次渲染重建）
const UPLOAD_VALIDATION = {
  maxSize: 2 * 1024 * 1024,
  extensions: ['txt', 'log', 'json', 'yaml', 'yml', 'md', 'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'toml', 'ini', 'conf'],
};
const ACCEPT_EXTENSIONS = '.txt,.log,.json,.yaml,.yml,.md,.js,.jsx,.ts,.tsx,.css,.scss,.toml,.ini,.conf';

// 自动对比的防抖间隔
const AUTO_DIFF_DEBOUNCE_MS = 300;
// 总字符量超过该阈值时，认为计算可能较慢，显示 loading 并让出主线程
const HEAVY_DIFF_CHAR_THRESHOLD = 50_000;

export default function TextDiffPage() {
  const { leftText, rightText, setLeftText, setRightText, swapTexts, reset } = useTextDiffStore();

  const [viewMode, setViewMode] = useState<DiffViewMode>('all');
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [hasCompared, setHasCompared] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const [leftInputMode, setLeftInputMode] = useState<InputMode>('paste');
  const [rightInputMode, setRightInputMode] = useState<InputMode>('paste');
  const [leftFileName, setLeftFileName] = useState<string | null>(null);
  const [rightFileName, setRightFileName] = useState<string | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // 用于丢弃过期的异步计算结果（避免快速输入时旧结果覆盖新结果）
  const computeTokenRef = useRef(0);

  const stats = useMemo(() => calculateStats(leftText, rightText), [leftText, rightText]);

  const filteredLines = useMemo(() => {
    if (!diffLines.length) {
      return [] as DiffLine[];
    }

    if (viewMode === 'changes') {
      return diffLines.filter((line) => line.type !== 'unchanged');
    }

    return diffLines;
  }, [diffLines, viewMode]);

  // 执行一次对比计算。大文本时让出主线程并显示 loading。
  const runDiff = useCallback((left: string, right: string) => {
    if (!left && !right) {
      setDiffLines([]);
      setHasCompared(false);
      setIsComputing(false);
      return;
    }

    const token = (computeTokenRef.current += 1);
    const isHeavy = left.length + right.length > HEAVY_DIFF_CHAR_THRESHOLD;

    const compute = () => {
      // 计算前再次校验 token，丢弃已过期的计算
      if (token !== computeTokenRef.current) {
        return;
      }
      const lines = buildDiffLines(left, right);
      if (token !== computeTokenRef.current) {
        return;
      }
      setDiffLines(lines);
      setHasCompared(true);
      setIsComputing(false);
    };

    if (isHeavy) {
      setIsComputing(true);
      // 让出主线程，让 loading 态先渲染出来
      setTimeout(compute, 0);
    } else {
      compute();
    }
  }, []);

  const { run: debouncedDiff } = useDebounceFn(
    (left: string, right: string) => runDiff(left, right),
    { wait: AUTO_DIFF_DEBOUNCE_MS },
  );

  // 文本变化时自动防抖对比
  useEffect(() => {
    debouncedDiff(leftText, rightText);
  }, [leftText, rightText, debouncedDiff]);

  const handleCompareNow = () => {
    if (!leftText && !rightText) {
      toast.error('请先在左右输入文本或上传文件');
      return;
    }
    runDiff(leftText, rightText);
  };

  const handleClearConfirmed = () => {
    reset();
    computeTokenRef.current += 1; // 作废进行中的计算
    setDiffLines([]);
    setHasCompared(false);
    setIsComputing(false);
    setLeftFileName(null);
    setRightFileName(null);
    setClearDialogOpen(false);
  };

  const handleFillExample = () => {
    const exampleLeft = `function add(a: number, b: number) {\n  const sum = a + b;\n  return sum;\n}\n\nconsole.log(add(1, 2));`;

    const exampleRight = `function add(a: number, b: number) {\n  const result = a + b;\n  return result;\n}\n\nconsole.log(add(1, 3));`;

    setLeftText(exampleLeft);
    setRightText(exampleRight);
    setLeftFileName(null);
    setRightFileName(null);
    setLeftInputMode('paste');
    setRightInputMode('paste');
    // 文本变化会触发 useEffect 自动对比，无需手动调用
  };

  const handleLeftInputModeChange = (value: InputMode) => {
    setLeftInputMode(value);
    if (value === 'paste') {
      setLeftFileName(null);
    }
  };

  const handleRightInputModeChange = (value: InputMode) => {
    setRightInputMode(value);
    if (value === 'paste') {
      setRightFileName(null);
    }
  };

  const hasResult = hasCompared && diffLines.length > 0;
  const summaryText = hasResult ? buildDiffSummaryText(filteredLines) : '';

  return (
    <div className="w-full px-4 pb-5 lg:py-8 space-y-4">
      <Card className="shadow-sm border">
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={handleCompareNow} className="gap-1" disabled={isComputing}>
                {isComputing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDiff className="h-4 w-4" />}
                {isComputing ? '对比中…' : '立即对比'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={swapTexts}
                className="gap-1"
                disabled={!leftText && !rightText}
              >
                <ArrowLeftRight className="h-4 w-4" />
                交换左右
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setClearDialogOpen(true)}
                className="gap-1 text-destructive"
                disabled={!leftText && !rightText}
              >
                <Trash2 className="h-4 w-4" />
                清空
              </Button>
            </div>
            <Button size="sm" variant="secondary" onClick={handleFillExample} className="gap-1">
              <Sparkles className="h-4 w-4" />
              填充示例
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Tabs
                value={leftInputMode}
                onValueChange={(value) => handleLeftInputModeChange(value as InputMode)}
                className="w-full"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>左侧文本</span>
                    <TabsList className="h-7 text-[11px]">
                      <TabsTrigger value="paste" className="px-2 py-0.5">
                        粘贴
                      </TabsTrigger>
                      <TabsTrigger value="upload" className="px-2 py-0.5">
                        上传
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <CopyButton
                    text={leftText}
                    mode="icon-text"
                    size="sm"
                    variant="ghost"
                    copyText="复制左侧"
                    successText="已复制"
                    disabled={!leftText}
                  />
                </div>

                {leftInputMode === 'upload' && (
                  <div className="mt-2 space-y-1.5">
                    <FileDragUploader
                      onFileSelect={(file) => {
                        setLeftFileName(file.name);
                      }}
                      onError={(error) => toast.error(error)}
                      validation={UPLOAD_VALIDATION}
                      accept={ACCEPT_EXTENSIONS}
                      readAs="text"
                      onFileRead={(result) => {
                        if (typeof result === 'string') {
                          setLeftText(result);
                        }
                      }}
                      className="border-dashed border-muted-foreground/40 bg-muted/40 hover:bg-muted/70"
                    >
                      <div className="flex flex-col items-center justify-center gap-1 py-5 text-[11px] text-muted-foreground">
                        <span className="text-lg">📄</span>
                        <span>拖拽文件到此处，或点击选择文件</span>
                        <span>支持常见文本/代码文件，单个文件建议不超过 2MB</span>
                      </div>
                    </FileDragUploader>
                    {leftFileName && (
                      <p className="text-[11px] text-muted-foreground truncate">当前文件：{leftFileName}</p>
                    )}
                  </div>
                )}
              </Tabs>

              <Textarea
                className="min-h-[220px] text-xs md:text-sm font-mono leading-relaxed resize-y custom-scrollbar"
                placeholder="在此输入或粘贴原始文本，例如旧版本代码、配置等"
                value={leftText}
                spellCheck={false}
                onChange={(event) => setLeftText(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Tabs
                value={rightInputMode}
                onValueChange={(value) => handleRightInputModeChange(value as InputMode)}
                className="w-full"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>右侧文本</span>
                    <TabsList className="h-7 text-[11px]">
                      <TabsTrigger value="paste" className="px-2 py-0.5">
                        粘贴
                      </TabsTrigger>
                      <TabsTrigger value="upload" className="px-2 py-0.5">
                        上传
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <CopyButton
                    text={rightText}
                    mode="icon-text"
                    size="sm"
                    variant="ghost"
                    copyText="复制右侧"
                    successText="已复制"
                    disabled={!rightText}
                  />
                </div>

                {rightInputMode === 'upload' && (
                  <div className="mt-2 space-y-1.5">
                    <FileDragUploader
                      onFileSelect={(file) => {
                        setRightFileName(file.name);
                      }}
                      onError={(error) => toast.error(error)}
                      validation={UPLOAD_VALIDATION}
                      accept={ACCEPT_EXTENSIONS}
                      readAs="text"
                      onFileRead={(result) => {
                        if (typeof result === 'string') {
                          setRightText(result);
                        }
                      }}
                      className="border-dashed border-muted-foreground/40 bg-muted/40 hover:bg-muted/70"
                    >
                      <div className="flex flex-col items-center justify-center gap-1 py-5 text-[11px] text-muted-foreground">
                        <span className="text-lg">📄</span>
                        <span>拖拽文件到此处，或点击选择文件</span>
                        <span>支持常见文本/代码文件，单个文件建议不超过 2MB</span>
                      </div>
                    </FileDragUploader>
                    {rightFileName && (
                      <p className="text-[11px] text-muted-foreground truncate">当前文件：{rightFileName}</p>
                    )}
                  </div>
                )}
              </Tabs>

              <Textarea
                className="min-h-[220px] text-xs md:text-sm font-mono leading-relaxed resize-y custom-scrollbar"
                placeholder="在此输入或粘贴目标文本，例如新版本代码、配置等"
                value={rightText}
                spellCheck={false}
                onChange={(event) => setRightText(event.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <TextDiffResultView
        hasResult={hasResult}
        isComputing={isComputing}
        lines={filteredLines}
        syncScroll={syncScroll}
        onSyncScrollChange={setSyncScroll}
        viewMode={viewMode}
        onViewModeChange={(value) => setViewMode(value)}
        summaryText={summaryText}
        stats={stats}
      />

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>清空所有文本？</AlertDialogTitle>
            <AlertDialogDescription>此操作会清空左右两侧的全部文本与对比结果，且无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
