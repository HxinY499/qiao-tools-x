import { ArrowLeftRight, FileDiff, Filter, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CopyButton } from '@/components/copy-button';
import { FileDragUploader } from '@/components/file-drag-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { TextDiffResultView } from './result-view';
import { useTextDiffStore } from './store';
import type { DiffLine, DiffViewMode } from './types';
import { buildDiffLines, buildDiffSummaryText, calculateStats } from './utils';

type InputMode = 'paste' | 'upload';

export default function TextDiffPage() {
  const { leftText, rightText, setLeftText, setRightText, swapTexts, reset } = useTextDiffStore();

  const [viewMode, setViewMode] = useState<DiffViewMode>('all');
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [hasCompared, setHasCompared] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const [leftInputMode, setLeftInputMode] = useState<InputMode>('paste');
  const [rightInputMode, setRightInputMode] = useState<InputMode>('paste');
  const [leftFileName, setLeftFileName] = useState<string | null>(null);
  const [rightFileName, setRightFileName] = useState<string | null>(null);

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

  const handleCompare = () => {
    if (!leftText && !rightText) {
      toast.error('请先在左右输入文本或上传文件');
      return;
    }

    const lines = buildDiffLines(leftText, rightText);
    setDiffLines(lines);
    setHasCompared(true);
  };

  const handleClear = () => {
    if (!leftText && !rightText) {
      return;
    }

    if (window.confirm('确定要清空左右所有文本吗？')) {
      reset();
      setDiffLines([]);
      setHasCompared(false);
      setLeftFileName(null);
      setRightFileName(null);
    }
  };

  const handleFillExample = () => {
    const exampleLeft = `function add(a: number, b: number) {\n  const sum = a + b;\n  return sum;\n}\n\nconsole.log(add(1, 2));`;

    const exampleRight = `function add(a: number, b: number) {\n  const result = a + b;\n  return result;\n}\n\nconsole.log(add(1, 3));`;

    setLeftText(exampleLeft);
    setRightText(exampleRight);
    const lines = buildDiffLines(exampleLeft, exampleRight);
    setDiffLines(lines);
    setHasCompared(true);
    setLeftFileName(null);
    setRightFileName(null);
    setLeftInputMode('paste');
    setRightInputMode('paste');
  };

  const hasResult = hasCompared && diffLines.length > 0;
  const summaryText = hasResult ? buildDiffSummaryText(filteredLines) : '';

  const commonUploadValidation = {
    maxSize: 2 * 1024 * 1024,
    extensions: [
      'txt',
      'log',
      'json',
      'yaml',
      'yml',
      'md',
      'js',
      'jsx',
      'ts',
      'tsx',
      'css',
      'scss',
      'toml',
      'ini',
      'conf',
    ],
  };

  const acceptExtensions = '.txt,.log,.json,.yaml,.yml,.md,.js,.jsx,.ts,.tsx,.css,.scss,.toml,.ini,.conf';

  return (
    <div className="max-w-6xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-4">
      <Card className="shadow-sm border bg-card/80 backdrop-blur">
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={handleCompare} className="gap-1">
                <FileDiff className="h-4 w-4" />
                开始对比
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
              <Button size="sm" variant="ghost" onClick={handleClear} className="gap-1 text-destructive">
                <Filter className="h-4 w-4" />
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
                onValueChange={(value) => setLeftInputMode(value as InputMode)}
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
                      validation={commonUploadValidation}
                      accept={acceptExtensions}
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
                onValueChange={(value) => setRightInputMode(value as InputMode)}
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
                      validation={commonUploadValidation}
                      accept={acceptExtensions}
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
        lines={filteredLines}
        syncScroll={syncScroll}
        onSyncScrollChange={setSyncScroll}
        viewMode={viewMode}
        onViewModeChange={(value) => setViewMode(value)}
        summaryText={summaryText}
        stats={stats}
      />
    </div>
  );
}
