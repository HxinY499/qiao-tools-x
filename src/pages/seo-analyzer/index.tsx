import { Clock, Code2, FileUp, Globe, Loader2, Search, X } from 'lucide-react';
import { useCallback, useState } from 'react';

import { FileDragUploader } from '@/components/file-drag-uploader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE } from '@/constant';

import { SeoResultView } from './result-view';
import { useSeoAnalyzerStore } from './store';
import type { FetchHtmlResponse, InputSource, SeoAnalysisResult } from './types';
import { analyzeHtml } from './utils';

function SeoAnalyzerPage() {
  const [inputSource, setInputSource] = useState<InputSource>('url');
  const [protocol, setProtocol] = useState<'https://' | 'http://'>('https://');
  const [url, setUrl] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SeoAnalysisResult | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { urlHistory, addUrlToHistory, removeUrlFromHistory } = useSeoAnalyzerStore();

  // 判断用户输入是否已包含协议
  const urlHasProtocol = url.trim().startsWith('http://') || url.trim().startsWith('https://');

  // 通过 URL 抓取
  const fetchFromUrl = useCallback(async () => {
    if (!url.trim()) {
      setError('请输入网址');
      return;
    }

    // 如果用户输入已包含协议则直接使用，否则拼接下拉框选择的协议
    const targetUrl = urlHasProtocol ? url.trim() : protocol + url.trim();

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/fetch-html?url=${encodeURIComponent(targetUrl)}`);
      const data: FetchHtmlResponse = await response.json();

      if (!data.success) {
        setError(data.error || '抓取失败');
        return;
      }

      if (!data.html) {
        setError('未获取到 HTML 内容');
        return;
      }

      const analysisResult = analyzeHtml(data.html, data.finalUrl || targetUrl);
      analysisResult.url = targetUrl;
      analysisResult.finalUrl = data.finalUrl;
      setResult(analysisResult);

      // 添加到历史记录
      addUrlToHistory(targetUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setIsLoading(false);
    }
  }, [url, protocol, urlHasProtocol, addUrlToHistory]);

  // 分析粘贴的 HTML 代码
  const analyzeCode = useCallback(() => {
    if (!htmlCode.trim()) {
      setError('请输入 HTML 代码');
      return;
    }

    setError(null);
    const analysisResult = analyzeHtml(htmlCode);
    setResult(analysisResult);
  }, [htmlCode]);

  // 处理文件上传
  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const analysisResult = analyzeHtml(content);
        setResult(analysisResult);
      }
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError('文件读取失败');
      setIsLoading(false);
    };
    reader.readAsText(file);
  }, []);

  // 处理分析按钮点击
  const handleAnalyze = useCallback(() => {
    if (inputSource === 'url') {
      fetchFromUrl();
    } else if (inputSource === 'code') {
      analyzeCode();
    }
  }, [inputSource, fetchFromUrl, analyzeCode]);

  // 重置结果
  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  // 选择历史记录
  const handleSelectHistory = useCallback((historyUrl: string) => {
    setUrl(historyUrl);
    setHistoryOpen(false);
  }, []);

  // 删除历史记录
  const handleDeleteHistory = useCallback(
    (historyUrl: string, e: React.MouseEvent) => {
      e.stopPropagation();
      removeUrlFromHistory(historyUrl);
    },
    [removeUrlFromHistory],
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-5 lg:space-y-6 lg:py-8">
      {!result ? (
        <Card className="p-4 shadow-sm lg:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={inputSource} onValueChange={(v) => setInputSource(v as InputSource)}>
              <TabsList className="h-8">
                <TabsTrigger value="url" className="gap-1.5 px-3 text-xs">
                  <Globe className="h-3.5 w-3.5" />
                  网址
                </TabsTrigger>
                <TabsTrigger value="code" className="gap-1.5 px-3 text-xs">
                  <Code2 className="h-3.5 w-3.5" />
                  代码
                </TabsTrigger>
                <TabsTrigger value="file" className="gap-1.5 px-3 text-xs">
                  <FileUp className="h-3.5 w-3.5" />
                  文件
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {inputSource === 'url' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {!urlHasProtocol && (
                  <Select value={protocol} onValueChange={(v) => setProtocol(v as 'https://' | 'http://')}>
                    <SelectTrigger className="h-9 w-[100px] shrink-0 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="https://" className="text-xs">
                        https://
                      </SelectItem>
                      <SelectItem value="http://" className="text-xs">
                        http://
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <div className="relative flex-1">
                  <Input
                    placeholder={urlHasProtocol ? '输入完整网址' : 'example.com/page'}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    disabled={isLoading}
                    className="h-9 flex-1 pr-9 text-sm"
                  />
                  {urlHistory.length > 0 && (
                    <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-9 w-9 p-0 hover:bg-transparent"
                          disabled={isLoading}
                        >
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="end">
                        <div className="border-b px-3 py-2">
                          <span className="text-xs font-medium text-muted-foreground">历史记录</span>
                        </div>
                        <ScrollArea className="max-h-[300px]">
                          <div className="p-1">
                            {urlHistory.map((item) => (
                              <button
                                key={item.url}
                                onClick={() => handleSelectHistory(item.url)}
                                className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                              >
                                <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="min-w-0 flex-1 truncate">{item.url}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                  onClick={(e) => handleDeleteHistory(item.url, e)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <Button onClick={handleAnalyze} disabled={isLoading || !url.trim()} size="sm" className="h-9 gap-1.5">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="hidden sm:inline">分析</span>
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                输入网页地址进行 SEO 分析。部分网站可能因反爬虫机制无法抓取。
              </p>
            </div>
          )}

          {inputSource === 'code' && (
            <div className="space-y-3">
              <Textarea
                placeholder="粘贴 HTML 代码..."
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                disabled={isLoading}
                className="min-h-[240px] font-mono text-xs"
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">粘贴完整的 HTML 代码进行分析</p>
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading || !htmlCode.trim()}
                  size="sm"
                  className="h-8 gap-1.5"
                >
                  <Search className="h-3.5 w-3.5" />
                  分析
                </Button>
              </div>
            </div>
          )}

          {inputSource === 'file' && (
            <FileDragUploader
              onFileSelect={handleFileSelect}
              onError={setError}
              validation={{ extensions: ['html', 'htm'] }}
              accept=".html,.htm"
              disabled={isLoading}
              icon={<FileUp className="h-8 w-8 text-muted-foreground/40" />}
              title="点击选择或拖放 HTML 文件"
              hint="支持 .html 和 .htm 文件"
              buttonText="选择文件"
              className="min-h-[200px]"
            />
          )}

          {error && <div className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
        </Card>
      ) : (
        <SeoResultView result={result} onReset={handleReset} />
      )}
    </div>
  );
}

export default SeoAnalyzerPage;
