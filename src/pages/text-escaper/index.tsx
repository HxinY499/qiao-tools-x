import { ArrowRightLeft, Sparkles, Trash2 } from 'lucide-react';

import { CodeArea } from '@/components/code-area';
import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { useTextEscaperStore } from './store';
import { EscapeType } from './utils';

export default function TextEscaperPage() {
  const { data, setInput, setTab, setMode, reset } = useTextEscaperStore();
  const { input, output, activeTab, mode } = data;

  const handleTabChange = (value: string) => {
    setTab(value as EscapeType);
  };

  const fillSample = () => {
    switch (activeTab) {
      case 'html':
        setInput('<div><h1>Hello World</h1><p>This is a "test".</p></div>');
        break;
      case 'unicode':
        setInput('你好，世界！\nHello World!');
        break;
      case 'js':
        setInput('const greeting = "Hello World";\nconsole.log(greeting);');
        break;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      <Card>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full pt-6">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="html">HTML 实体</TabsTrigger>
              <TabsTrigger value="unicode">Unicode</TabsTrigger>
              <TabsTrigger value="js">JavaScript 字符串</TabsTrigger>
            </TabsList>

            <div className="space-y-6">
              {/* 操作栏 */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
                    <Button
                      variant={mode === 'encode' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() => setMode('encode')}
                    >
                      转义 (Encode)
                    </Button>
                    <Button
                      variant={mode === 'decode' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() => setMode('decode')}
                    >
                      反转义 (Decode)
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">
                    {activeTab === 'html' && (mode === 'encode' ? '例如: < -> &lt;' : '例如: &lt; -> <')}
                    {activeTab === 'unicode' && (mode === 'encode' ? '例如: 中 -> \\u4e2d' : '例如: \\u4e2d -> 中')}
                    {activeTab === 'js' && (mode === 'encode' ? '例如: 换行 -> \\n' : '例如: \\n -> 换行')}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={fillSample} className="w-full sm:w-auto">
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    示例
                  </Button>
                  <Button variant="outline" size="sm" onClick={reset} className="w-full sm:w-auto">
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    清空
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* 输入区 */}
                <div className="space-y-2 flex flex-col">
                  <Label>输入内容</Label>
                  <Textarea
                    placeholder={mode === 'encode' ? '输入原始文本...' : '输入需要反转义的代码...'}
                    className="min-h-[300px] font-mono text-sm resize-none flex-1"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                </div>

                {/* 输出区 */}
                <div className="space-y-2 flex flex-col">
                  <div className="flex items-center justify-between h-5">
                    <Label>转换结果</Label>
                    <CopyButton text={output} className="h-6 w-6" iconClassName="w-3 h-3" />
                  </div>
                  <div className="relative flex-1 max-w-full">
                    <CodeArea
                      code={output}
                      language="text"
                      className="min-h-[300px] h-full max-w-full"
                      codeClassName="h-full max-w-full whitespace-pre-wrap break-words"
                      showCopyButton={false} // 上面已经放了 CopyButton
                    />
                    {!output && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 pointer-events-none">
                        <ArrowRightLeft className="w-12 h-12 mb-2 opacity-20" />
                        <span className="text-sm">等待输入...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card className="shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase mb-3">使用说明</h2>
        <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
          <li>
            <span className="font-medium text-foreground">HTML 实体</span>：将 HTML 特殊字符（如 &lt;, &gt;,
            &）转换为对应的实体名称或编号，防止 XSS 攻击或显示错误。
          </li>
          <li>
            <span className="font-medium text-foreground">Unicode</span>：将中文等非 ASCII 字符转换为 \uXXXX
            格式的转义序列，常用于 Java properties 文件或 JSON 传输。
          </li>
          <li>
            <span className="font-medium text-foreground">JavaScript 字符串</span>
            ：对字符串中的特殊字符（如换行符、引号）进行转义，使其可以安全地拼接到 JS 代码中。
          </li>
        </ul>
      </Card>
    </div>
  );
}
