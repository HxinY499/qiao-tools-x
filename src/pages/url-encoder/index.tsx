import { Link } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type Mode = 'encode' | 'decode';
type EncodeMethod = 'component' | 'uri';

const EXAMPLE_URL =
  'https://www.example.com:8080/search/results?q=hello%20world&category=dev%20tools&tags=react,typescript#top-section';

const EXAMPLE_ENCODE_COMPONENT = '你好 世界 & test=value';
const EXAMPLE_ENCODE_URI = 'https://example.com/搜索?q=你好 世界&name=张三';

function UrlEncoderPage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('decode');
  const [encodeMethod, setEncodeMethod] = useState<EncodeMethod>('component');

  const output = useMemo(() => {
    if (!input) return '';
    try {
      if (mode === 'encode') {
        return encodeMethod === 'component' ? encodeURIComponent(input) : encodeURI(input);
      } else {
        // 解码时自动尝试两种方式
        return decodeURIComponent(input);
      }
    } catch (e) {
      return 'Error: Invalid URI';
    }
  }, [input, mode, encodeMethod]);

  const fillSample = () => {
    if (mode === 'decode') {
      setInput(EXAMPLE_URL);
    } else {
      setInput(encodeMethod === 'component' ? EXAMPLE_ENCODE_COMPONENT : EXAMPLE_ENCODE_URI);
    }
  };

  const urlAnalysis = useMemo(() => {
    if (mode !== 'decode') return null;
    try {
      // 尝试解析，如果失败则返回 null
      const url = new URL(input);
      const params: { key: string; value: string }[] = [];
      url.searchParams.forEach((value, key) => {
        params.push({ key, value });
      });
      return {
        protocol: url.protocol,
        host: url.host,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        hash: url.hash,
        search: url.search,
        params,
      };
    } catch (e) {
      return null;
    }
  }, [input, mode]);

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-4 lg:space-y-6">
      <Card className="shadow-sm p-4 lg:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">URL 编解码</h2>
          </div>
          <div className="flex items-center gap-3">
            {mode === 'encode' && (
              <Select value={encodeMethod} onValueChange={(v) => setEncodeMethod(v as EncodeMethod)}>
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="component" className="text-xs">
                    encodeURIComponent
                  </SelectItem>
                  <SelectItem value="uri" className="text-xs">
                    encodeURI
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList>
                <TabsTrigger value="decode" className="text-xs">
                  Decode (解码)
                </TabsTrigger>
                <TabsTrigger value="encode" className="text-xs">
                  Encode (编码)
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">输入</Label>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" className="h-6 px-2 text-[11px]" onClick={fillSample}>
                  示例
                </Button>
                <Button variant="secondary" size="sm" className="h-6 px-2 text-[11px]" onClick={() => setInput('')}>
                  清空
                </Button>
              </div>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 URL 或文本...'}
              className="min-h-[200px] text-xs font-mono"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">结果</Label>
              <CopyButton
                text={output}
                mode="icon-text"
                variant="secondary"
                size="sm"
                className="h-6 px-2 text-[11px]"
                disabled={!output || output.startsWith('Error:')}
              />
            </div>
            <Textarea value={output} readOnly className="min-h-[200px] text-xs font-mono bg-muted/50" />
          </div>
        </div>
      </Card>

      {urlAnalysis && (
        <Card className="shadow-sm p-4 lg:p-5 space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Link className="w-4 h-4" />
              URL 解析
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Protocol</Label>
                <div className="text-sm font-mono bg-muted/30 p-2 rounded border">{urlAnalysis.protocol}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Host</Label>
                <div className="text-sm font-mono bg-muted/30 p-2 rounded border">{urlAnalysis.host}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Port</Label>
                <div className="text-sm font-mono bg-muted/30 p-2 rounded border">{urlAnalysis.port || '-'}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Path</Label>
                <div className="text-sm font-mono bg-muted/30 p-2 rounded border truncate" title={urlAnalysis.pathname}>
                  {urlAnalysis.pathname}
                </div>
              </div>
            </div>
            {urlAnalysis.hash && (
              <div className="mt-4 space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Hash</Label>
                <div className="text-sm font-mono bg-muted/30 p-2 rounded border">{urlAnalysis.hash}</div>
              </div>
            )}
          </div>

          {urlAnalysis.params.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Query Parameters</h3>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Key</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {urlAnalysis.params.map((param, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs font-medium">{param.key}</TableCell>
                        <TableCell className="font-mono text-xs break-all">{param.value}</TableCell>
                        <TableCell>
                          <CopyButton
                            text={param.value}
                            mode="icon"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            iconClassName="w-3 h-3"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 使用说明 */}
      <Card className="shadow-sm p-4 lg:p-5">
        <h2 className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase mb-3">使用说明</h2>
        <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
          <li>
            <span className="font-medium text-foreground">encodeURIComponent</span>
            ：编码所有特殊字符，包括 <code className="bg-muted px-1 rounded">/ ? & =</code> 等。适合编码 URL 参数值。
          </li>
          <li>
            <span className="font-medium text-foreground">encodeURI</span>
            ：保留 URL 结构字符（<code className="bg-muted px-1 rounded">/ ? & = : #</code>
            ），只编码非 ASCII 字符和空格。适合编码完整 URL。
          </li>
          <li>
            <span className="font-medium text-foreground">解码模式</span>
            ：自动解析 URL 结构，提取协议、主机、路径、查询参数等信息。
          </li>
        </ul>
      </Card>
    </div>
  );
}

export default UrlEncoderPage;
