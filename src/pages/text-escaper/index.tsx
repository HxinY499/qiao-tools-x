import { ArrowRightLeft, Sparkles, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CodeArea } from '@/components/code-area';
import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { computeEscapeOutput, useTextEscaperStore } from './store';
import { EscapeType } from './utils';

export default function TextEscaperPage() {
  const { t } = useTranslation('tools');
  const { data, setInput, setTab, setMode, reset } = useTextEscaperStore();
  const { input, activeTab, mode } = data;

  // 派生输出：input/activeTab/mode 任一变化都重新计算
  const output = useMemo(() => computeEscapeOutput(input, activeTab, mode), [input, activeTab, mode]);

  const handleTabChange = (value: string) => {
    setTab(value as EscapeType);
  };

  const fillSample = () => {
    switch (activeTab) {
      case 'html':
        setInput('<div><h1>Hello  World</h1><p>This is a "test" & demo.</p></div>');
        break;
      case 'unicode':
        setInput('你好，世界！😀\nHello World!');
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
              <TabsTrigger value="html">{t('textEscaper.htmlEntities')}</TabsTrigger>
              <TabsTrigger value="unicode">{t('textEscaper.unicode')}</TabsTrigger>
              <TabsTrigger value="js">{t('textEscaper.jsString')}</TabsTrigger>
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
                      {t('textEscaper.encode')}
                    </Button>
                    <Button
                      variant={mode === 'decode' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() => setMode('decode')}
                    >
                      {t('textEscaper.decode')}
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">
                    {activeTab === 'html' && (mode === 'encode' ? t('textEscaper.exampleHtmlEncode') : t('textEscaper.exampleHtmlDecode'))}
                    {activeTab === 'unicode' &&
                      (mode === 'encode' ? t('textEscaper.exampleUnicodeEncode') : t('textEscaper.exampleUnicodeDecode'))}
                    {activeTab === 'js' && (mode === 'encode' ? t('textEscaper.exampleJsEncode') : t('textEscaper.exampleJsDecode'))}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={fillSample} className="w-full sm:w-auto">
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    {t('textEscaper.sample')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={reset} className="w-full sm:w-auto">
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    {t('textEscaper.clear')}
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* 输入区 */}
                <div className="space-y-2 flex flex-col">
                  <Label>{t('textEscaper.inputLabel')}</Label>
                  <Textarea
                    placeholder={mode === 'encode' ? t('textEscaper.inputPlaceholderEncode') : t('textEscaper.inputPlaceholderDecode')}
                    className="min-h-[300px] font-mono text-sm resize-none flex-1"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                </div>

                {/* 输出区 */}
                <div className="space-y-2 flex flex-col">
                  <div className="flex items-center justify-between h-5">
                    <Label>{t('textEscaper.outputLabel')}</Label>
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
                        <span className="text-sm">{t('textEscaper.waitingInput')}</span>
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
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase mb-3">{t('textEscaper.usageGuide')}</h2>
        <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
          <li>
            <span className="font-medium text-foreground">{t('textEscaper.guideHtmlTerm')}</span>
            {t('textEscaper.guideHtml')}
          </li>
          <li>
            <span className="font-medium text-foreground">{t('textEscaper.guideUnicodeTerm')}</span>
            {t('textEscaper.guideUnicode')}
          </li>
          <li>
            <span className="font-medium text-foreground">{t('textEscaper.guideJsTerm')}</span>
            {t('textEscaper.guideJs')}
          </li>
        </ul>
      </Card>
    </div>
  );
}
