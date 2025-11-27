import { Check, Copy, History, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { useUUIDStore } from './store';

function UUIDGeneratorPage() {
  const [quantity, setQuantity] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [generatedContent, setGeneratedContent] = useState('');

  const { history, addHistory, clearHistory, removeHistoryItem } = useUUIDStore();

  const generateUUIDs = () => {
    const uuids: string[] = [];
    for (let i = 0; i < quantity; i++) {
      let uuid = crypto.randomUUID() as string;

      if (!hyphens) {
        uuid = uuid.replace(/-/g, '');
      }

      if (uppercase) {
        uuid = uuid.toUpperCase();
      }

      uuids.push(uuid);
    }

    const content = uuids.join('\n');
    setGeneratedContent(content);
    addHistory(uuids);

    toast.success(`已生成 ${quantity} 个 UUID`);
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success('已复制到剪贴板');
      })
      .catch(() => {
        toast.error('复制失败');
      });
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              生成配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>生成数量: {quantity}</Label>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[quantity]}
                  onValueChange={(v) => setQuantity(v[0])}
                  min={1}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 100) {
                      setQuantity(val);
                    }
                  }}
                  className="w-20"
                  min={1}
                  max={100}
                />
              </div>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="uppercase" className="flex flex-col space-y-1">
                <span>大写字母</span>
                <span className="font-normal text-xs text-muted-foreground">使用 A-F 代替 a-f</span>
              </Label>
              <Switch id="uppercase" checked={uppercase} onCheckedChange={setUppercase} />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="hyphens" className="flex flex-col space-y-1">
                <span>包含连字符</span>
                <span className="font-normal text-xs text-muted-foreground">包含 "-" 分隔符</span>
              </Label>
              <Switch id="hyphens" checked={hyphens} onCheckedChange={setHyphens} />
            </div>

            <Button className="w-full" onClick={generateUUIDs}>
              生成 UUID
            </Button>
          </CardContent>
        </Card>

        {/* Result Panel */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                生成结果
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(generatedContent)}
                disabled={!generatedContent}
                className="h-8 px-2 lg:px-3"
              >
                <Copy className="w-4 h-4 mr-2" />
                复制
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[200px]">
            <Textarea
              value={generatedContent}
              readOnly
              placeholder="点击生成按钮开始..."
              className="h-full min-h-[200px] font-mono text-sm resize-none bg-muted/30"
            />
          </CardContent>
        </Card>
      </div>

      {/* History Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="w-4 h-4" />
              生成历史
            </span>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                清空历史
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">暂无生成记录</div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {history.map((batch) => (
                  <div key={batch.id} className="flex flex-col space-y-2 p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(batch.timestamp).toLocaleString()} • {batch.uuids.length} 个 UUID
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(batch.uuids.join('\n'))}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeHistoryItem(batch.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground line-clamp-2 break-all">
                      {batch.uuids.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default UUIDGeneratorPage;
