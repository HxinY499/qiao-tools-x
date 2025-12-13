import { Cpu, Globe, Monitor, Smartphone, Trash2, User, Zap } from 'lucide-react';

import { CodeArea } from '@/components/code-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { useUserAgentParserStore } from './store';

// 示例 UA
const EXAMPLE_UAS = [
  {
    name: 'Chrome / macOS',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  {
    name: 'Safari / iPhone',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  },
  {
    name: 'Firefox / Windows',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  },
  {
    name: 'WeChat / Android',
    ua: 'Mozilla/5.0 (Linux; Android 14; SM-S9180 Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.0.0 Mobile Safari/537.36 XWEB/1160065 MMWEBSDK/20231105 MMWEBID/5786 MicroMessenger/8.0.44.2502(0x28002C51) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64',
  },
];

export default function UserAgentParserPage() {
  const { data, setUserAgent, reset } = useUserAgentParserStore();
  const { userAgent, parsedResult } = data;

  // 自动填充当前 UA
  const fillCurrentUA = () => {
    setUserAgent(navigator.userAgent);
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ua-input">User Agent 字符串</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={fillCurrentUA}>
                  <User className="w-3 h-3 mr-1" />
                  使用我的 UA
                </Button>
                <Button variant="outline" size="sm" onClick={reset} disabled={!userAgent}>
                  <Trash2 className="w-3 h-3 mr-1" />
                  清空
                </Button>
              </div>
            </div>
            <Textarea
              id="ua-input"
              placeholder="在此粘贴 User Agent 字符串..."
              className="min-h-[100px] font-mono text-sm"
              value={userAgent}
              onChange={(e) => setUserAgent(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground self-center">常用示例：</span>
            {EXAMPLE_UAS.map((item) => (
              <Button key={item.name} variant="secondary" size="sm" onClick={() => setUserAgent(item.ua)}>
                {item.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {parsedResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 浏览器信息 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                浏览器 (Browser)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">名称</dt>
                  <dd className="font-medium">{parsedResult.browser.name || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">版本</dt>
                  <dd className="font-medium">{parsedResult.browser.version || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">主版本</dt>
                  <dd className="font-medium">{parsedResult.browser.major || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* 引擎信息 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                引擎 (Engine)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">名称</dt>
                  <dd className="font-medium">{parsedResult.engine.name || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">版本</dt>
                  <dd className="font-medium">{parsedResult.engine.version || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* 操作系统 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                操作系统 (OS)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">名称</dt>
                  <dd className="font-medium">{parsedResult.os.name || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">版本</dt>
                  <dd className="font-medium">{parsedResult.os.version || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* 设备信息 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                设备 (Device)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">类型</dt>
                  <dd className="font-medium">{parsedResult.device.type || 'Desktop (guess)'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">厂商</dt>
                  <dd className="font-medium">{parsedResult.device.vendor || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">型号</dt>
                  <dd className="font-medium">{parsedResult.device.model || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* CPU 信息 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                CPU
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">架构</dt>
                  <dd className="font-medium">{parsedResult.cpu.architecture || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* 原始 JSON */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">解析结果 (JSON)</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeArea
                code={JSON.stringify(parsedResult, null, 2)}
                language="json"
                className="min-h-0"
                codeClassName="h-auto"
                showCopyButton={true}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
