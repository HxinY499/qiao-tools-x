import { ArrowLeftRight, Braces, Code2, FileJson, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CodeArea } from '@/components/code-area';
import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { ConvertDirection, ConvertOptions, DEFAULT_OPTIONS, EXAMPLE_SCHEMA, EXAMPLE_TYPESCRIPT } from './types';
import { jsonSchemaToTypeScript, typeScriptToJsonSchema, validateJsonSchema, validateTypeScript } from './utils';

export default function JsonSchemaConverterPage() {
  const [direction, setDirection] = useState<ConvertDirection>('schema-to-ts');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ConvertOptions>(DEFAULT_OPTIONS);

  const isSchemaToTs = direction === 'schema-to-ts';

  const inputPlaceholder = isSchemaToTs ? '在此粘贴 JSON Schema...' : '在此粘贴 TypeScript interface 或 type...';

  const inputLabel = isSchemaToTs ? 'JSON Schema' : 'TypeScript';
  const outputLabel = isSchemaToTs ? 'TypeScript' : 'JSON Schema';

  const hasInput = useMemo(() => input.trim().length > 0, [input]);

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      if (isSchemaToTs) {
        const validation = validateJsonSchema(input);
        if (!validation.valid) {
          setError(validation.error || '无效的 JSON Schema');
          setOutput('');
          return;
        }
        const result = jsonSchemaToTypeScript(input, options);
        setOutput(result);
        setError(null);
        toast.success('转换成功');
      } else {
        const validation = validateTypeScript(input);
        if (!validation.valid) {
          setError(validation.error || '无效的 TypeScript 代码');
          setOutput('');
          return;
        }
        const result = typeScriptToJsonSchema(input, options);
        setOutput(result);
        setError(null);
        toast.success('转换成功');
      }
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  }, [input, isSchemaToTs, options]);

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const handleSwap = () => {
    // 交换方向时，把输出作为新的输入
    if (output) {
      setInput(output);
      setOutput('');
    }
    setDirection(isSchemaToTs ? 'ts-to-schema' : 'schema-to-ts');
    setError(null);
  };

  const handleLoadExample = () => {
    if (isSchemaToTs) {
      setInput(EXAMPLE_SCHEMA);
    } else {
      setInput(EXAMPLE_TYPESCRIPT);
    }
    setOutput('');
    setError(null);
    toast.success('已加载示例');
  };

  const updateOption = <K extends keyof ConvertOptions>(key: K, value: ConvertOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto p-2 lg:p-4 lg:h-[calc(100vh-4rem)] flex flex-col gap-3 lg:gap-4">
      {/* 控制面板 */}
      <Card className="p-3 lg:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* 方向切换 */}
          <div className="flex items-center gap-3">
            <Tabs
              value={direction}
              onValueChange={(v) => {
                setDirection(v as ConvertDirection);
                setInput('');
                setOutput('');
                setError(null);
              }}
            >
              <TabsList>
                <TabsTrigger value="schema-to-ts" className="gap-1.5">
                  <FileJson className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Schema</span> → TS
                </TabsTrigger>
                <TabsTrigger value="ts-to-schema" className="gap-1.5">
                  <Code2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">TS</span> → Schema
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 选项 */}
          <div className="flex flex-wrap items-center gap-4">
            {isSchemaToTs ? (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">输出类型</Label>
                  <Select
                    value={options.exportType}
                    onValueChange={(v) => updateOption('exportType', v as 'interface' | 'type')}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interface">interface</SelectItem>
                      <SelectItem value="type">type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="addExport"
                    checked={options.addExport}
                    onCheckedChange={(v) => updateOption('addExport', v)}
                  />
                  <Label htmlFor="addExport" className="text-xs text-muted-foreground cursor-pointer">
                    添加 export
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="optionalByDefault"
                    checked={options.optionalByDefault}
                    onCheckedChange={(v) => updateOption('optionalByDefault', v)}
                  />
                  <Label htmlFor="optionalByDefault" className="text-xs text-muted-foreground cursor-pointer">
                    默认可选
                  </Label>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Schema 版本</Label>
                  <Select
                    value={options.schemaVersion}
                    onValueChange={(v) => updateOption('schemaVersion', v as 'draft-07' | 'draft-04')}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft-07">Draft-07</SelectItem>
                      <SelectItem value="draft-04">Draft-04</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="includeRequired"
                    checked={options.includeRequired}
                    onCheckedChange={(v) => updateOption('includeRequired', v)}
                  />
                  <Label htmlFor="includeRequired" className="text-xs text-muted-foreground cursor-pointer">
                    包含 required
                  </Label>
                </div>
              </>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2 lg:ml-auto">
            <Button onClick={handleConvert} disabled={!hasInput} className="gap-2">
              <Braces className="h-4 w-4" />
              转换
            </Button>
            <Button variant="outline" onClick={handleSwap} disabled={!output} className="gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              交换
            </Button>
          </div>
        </div>
      </Card>

      {/* 编辑器区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 flex-1 min-h-0">
        {/* 输入区 */}
        <Card className="flex flex-col p-3 lg:p-4 gap-3 h-[350px] lg:h-full">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSchemaToTs ? (
                <FileJson className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Code2 className="h-5 w-5 text-muted-foreground" />
              )}
              <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{inputLabel}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleLoadExample} className="h-8 gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">示例</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleClear}
                disabled={!hasInput && !output}
                className="h-8 gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">清空</span>
              </Button>
            </div>
          </header>

          <div className="flex-1 relative min-h-0">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={inputPlaceholder}
              className="h-full font-mono !text-xs resize-none p-3 lg:p-4 leading-relaxed custom-scrollbar"
              spellCheck={false}
            />
            {error && (
              <div className="absolute bottom-3 left-3 right-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-2.5 text-xs animate-in slide-in-from-bottom-2">
                <p className="font-medium">{error}</p>
              </div>
            )}
          </div>
        </Card>

        {/* 输出区 */}
        <Card className="flex flex-col p-3 lg:p-4 gap-3 h-[350px] lg:h-full">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSchemaToTs ? (
                <Code2 className="h-5 w-5 text-muted-foreground" />
              ) : (
                <FileJson className="h-5 w-5 text-muted-foreground" />
              )}
              <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{outputLabel}</h2>
            </div>
            <CopyButton text={output} mode="icon-text" variant="secondary" className="h-8" disabled={!output} />
          </header>

          <div className="flex-1 min-h-0 rounded-md overflow-hidden bg-background/50">
            {output ? (
              <CodeArea
                showCopyButton={false}
                code={output}
                language={isSchemaToTs ? 'typescript' : 'json'}
                className="h-full"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-2 border rounded-md">
                {isSchemaToTs ? (
                  <Code2 className="h-12 w-12 opacity-20" />
                ) : (
                  <FileJson className="h-12 w-12 opacity-20" />
                )}
                <p className="text-sm">等待转换...</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
