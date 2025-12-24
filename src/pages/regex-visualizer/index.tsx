/**
 * 正则可视化工具页面
 */

import { AlertCircle, Eraser } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { ExplanationView } from './explanation-view';
import { FlagToggles } from './flag-toggles';
import { MatchResultView } from './match-result';
import { parseRegex, validateRegex } from './parser';
import { RailroadDiagram } from './railroad-diagram';
import { ReplacePreview } from './replace-preview';
import { useRegexVisualizerStore } from './store';
import { TemplateSelector } from './template-selector';
import { executeMatch, executeReplace, flagsToString, generateExplanation } from './utils';

export default function RegexVisualizerPage() {
  const {
    pattern,
    testText,
    replacePattern,
    flags,
    setPattern,
    setTestText,
    setReplacePattern,
    toggleFlag,
    reset,
    applyTemplate,
  } = useRegexVisualizerStore();

  const [activeTab, setActiveTab] = useState('match');

  // 验证正则
  const validation = useMemo(() => validateRegex(pattern, flagsToString(flags)), [pattern, flags]);

  // 解析 AST
  const ast = useMemo(() => {
    if (!pattern || !validation.valid) return null;
    return parseRegex(pattern);
  }, [pattern, validation.valid]);

  // 执行匹配
  const matches = useMemo(() => {
    if (!pattern || !validation.valid || !testText) return [];
    return executeMatch(pattern, flags, testText);
  }, [pattern, flags, testText, validation.valid]);

  // 生成解释
  const explanations = useMemo(() => generateExplanation(pattern), [pattern]);

  // 执行替换
  const replacedText = useMemo(() => {
    if (!pattern || !validation.valid || !testText) return null;
    return executeReplace(pattern, flags, testText, replacePattern);
  }, [pattern, flags, testText, replacePattern, validation.valid]);

  const handleClear = () => {
    if (window.confirm('确定要清空所有内容吗？')) {
      reset();
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-4">
      {/* 输入区域 */}
      <Card className="shadow-sm border bg-card/80 backdrop-blur">
        <CardContent className="pt-4 space-y-4">
          {/* 正则输入 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Label htmlFor="pattern" className="text-sm font-medium">
                正则表达式
              </Label>
              <div className="flex items-center gap-2">
                <TemplateSelector onSelect={applyTemplate} />
                <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1 text-destructive">
                  <Eraser className="h-4 w-4" />
                  清空
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-mono text-lg">/</span>
              <Input
                id="pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="输入正则表达式，如 \d+、[a-z]+、(\w+)@(\w+)\.(\w+)"
                className="font-mono text-sm flex-1"
                spellCheck={false}
              />
              <span className="text-muted-foreground font-mono text-lg">/</span>
              <FlagToggles flags={flags} onToggle={toggleFlag} />
            </div>

            {/* 错误提示 */}
            {!validation.valid && pattern && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{validation.error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* 测试文本 */}
          <div className="space-y-2">
            <Label htmlFor="test-text" className="text-sm font-medium">
              测试文本
            </Label>
            <Textarea
              id="test-text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="输入要测试的文本..."
              className="min-h-[100px] font-mono text-sm resize-y custom-scrollbar"
              spellCheck={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* 可视化区域 */}
      <Card className="shadow-sm border bg-card/80 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">可视化铁路图</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-[120px] rounded-lg border bg-muted/20 p-4">
            <RailroadDiagram ast={ast} />
          </div>
        </CardContent>
      </Card>

      {/* 结果区域 */}
      <Card className="shadow-sm border bg-card/80 backdrop-blur">
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="match" className="gap-1.5">
                匹配结果
                {matches.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-primary text-primary-foreground">
                    {matches.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="explain">正则解释</TabsTrigger>
              <TabsTrigger value="replace">替换预览</TabsTrigger>
            </TabsList>

            <TabsContent value="match" className="mt-0">
              <MatchResultView testText={testText} matches={matches} />
            </TabsContent>

            <TabsContent value="explain" className="mt-0">
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <ExplanationView items={explanations} />
              </div>
            </TabsContent>

            <TabsContent value="replace" className="mt-0">
              <ReplacePreview
                replacePattern={replacePattern}
                onReplacePatternChange={setReplacePattern}
                originalText={testText}
                replacedText={replacedText}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 图例说明 */}
      <Card className="shadow-sm border bg-card/80 backdrop-blur">
        <CardContent className="pt-4">
          <h4 className="text-sm font-medium mb-3">图例说明</h4>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[hsl(210_40%_96%)] dark:bg-[hsl(210_30%_25%)] border border-[hsl(210_40%_80%)] dark:border-[hsl(210_40%_50%)]" />
              <span>字符</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[hsl(280_60%_95%)] dark:bg-[hsl(280_40%_25%)] border border-[hsl(280_60%_70%)] dark:border-[hsl(280_50%_55%)]" />
              <span>元字符</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[hsl(150_40%_94%)] dark:bg-[hsl(150_30%_22%)] border border-[hsl(150_40%_65%)] dark:border-[hsl(150_40%_45%)]" />
              <span>字符类</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[hsl(35_80%_95%)] dark:bg-[hsl(35_50%_25%)] border border-[hsl(35_80%_70%)] dark:border-[hsl(35_60%_55%)]" />
              <span>分组</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[hsl(0_60%_95%)] dark:bg-[hsl(0_40%_25%)] border border-[hsl(0_60%_70%)] dark:border-[hsl(0_50%_55%)]" />
              <span>锚点</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[hsl(200_60%_94%)] dark:bg-[hsl(200_40%_25%)] border border-[hsl(200_60%_65%)] dark:border-[hsl(200_50%_55%)]" />
              <span>量词</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
