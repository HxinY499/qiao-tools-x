import { Check, History, RefreshCw, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { usePasswordGeneratorStore } from './store';

const MIN_LENGTH = 6;
const MAX_LENGTH = 64;

const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()-_=+[]{};:,.<>/?';

function getSecureRandomIndex(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % maxExclusive;
}

function generatePassword(
  length: number,
  options: {
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasNumbers: boolean;
    hasSymbols: boolean;
  },
): string {
  const pools: string[] = [];
  const guaranteedChars: string[] = [];

  if (options.hasLowercase) {
    pools.push(LOWERCASE_CHARS);
    guaranteedChars.push(LOWERCASE_CHARS[getSecureRandomIndex(LOWERCASE_CHARS.length)]);
  }
  if (options.hasUppercase) {
    pools.push(UPPERCASE_CHARS);
    guaranteedChars.push(UPPERCASE_CHARS[getSecureRandomIndex(UPPERCASE_CHARS.length)]);
  }
  if (options.hasNumbers) {
    pools.push(NUMBER_CHARS);
    guaranteedChars.push(NUMBER_CHARS[getSecureRandomIndex(NUMBER_CHARS.length)]);
  }
  if (options.hasSymbols) {
    pools.push(SYMBOL_CHARS);
    guaranteedChars.push(SYMBOL_CHARS[getSecureRandomIndex(SYMBOL_CHARS.length)]);
  }

  const allChars = pools.join('');
  if (!allChars) return '';

  const passwordChars: string[] = [...guaranteedChars];

  for (let i = passwordChars.length; i < length; i++) {
    const index = getSecureRandomIndex(allChars.length);
    passwordChars.push(allChars[index] ?? '');
  }

  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = getSecureRandomIndex(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
}

function PasswordGeneratorPage() {
  const [length, setLength] = useState(16);
  const [hasLowercase, setHasLowercase] = useState(true);
  const [hasUppercase, setHasUppercase] = useState(true);
  const [hasNumbers, setHasNumbers] = useState(true);
  const [hasSymbols, setHasSymbols] = useState(true);
  const [password, setPassword] = useState('');

  const { history, addHistory, clearHistory, removeHistoryItem } = usePasswordGeneratorStore();

  const disabled = useMemo(
    () => !hasLowercase && !hasUppercase && !hasNumbers && !hasSymbols,
    [hasLowercase, hasUppercase, hasNumbers, hasSymbols],
  );

  const handleGenerate = () => {
    if (disabled) {
      toast.error('请至少选择一种字符类型');
      return;
    }

    const newPassword = generatePassword(length, {
      hasLowercase,
      hasUppercase,
      hasNumbers,
      hasSymbols,
    });

    if (!newPassword) {
      toast.error('生成密码失败，请重试');
      return;
    }

    setPassword(newPassword);

    addHistory({
      password: newPassword,
      length,
      hasLowercase,
      hasUppercase,
      hasNumbers,
      hasSymbols,
    });

    toast.success('已生成新密码');
  };

  const handleLengthInputChange = (value: string) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(Math.max(parsed, MIN_LENGTH), MAX_LENGTH);
    setLength(clamped);
  };

  const handleCopy = () => {
    if (!password) return;
    toast.success('密码已复制到剪贴板');
  };

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              生成配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>密码长度: {length}</Label>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[length]}
                  onValueChange={(value) => setLength(value[0] ?? MIN_LENGTH)}
                  min={MIN_LENGTH}
                  max={MAX_LENGTH}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={length}
                  onChange={(event) => handleLengthInputChange(event.target.value)}
                  className="w-24"
                  min={MIN_LENGTH}
                  max={MAX_LENGTH}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                建议长度不少于 12 位，重要账号可使用 16 位及以上以提升安全性。
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="lowercase" className="flex flex-col space-y-1">
                  <span>小写字母</span>
                  <span className="font-normal text-xs text-muted-foreground">a-z</span>
                </Label>
                <Switch id="lowercase" checked={hasLowercase} onCheckedChange={setHasLowercase} />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="uppercase" className="flex flex-col space-y-1">
                  <span>大写字母</span>
                  <span className="font-normal text-xs text-muted-foreground">A-Z</span>
                </Label>
                <Switch id="uppercase" checked={hasUppercase} onCheckedChange={setHasUppercase} />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="numbers" className="flex flex-col space-y-1">
                  <span>数字</span>
                  <span className="font-normal text-xs text-muted-foreground">0-9</span>
                </Label>
                <Switch id="numbers" checked={hasNumbers} onCheckedChange={setHasNumbers} />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="symbols" className="flex flex-col space-y-1">
                  <span>特殊符号</span>
                  <span className="font-normal text-xs text-muted-foreground">!@#$% 等常见符号</span>
                </Label>
                <Switch id="symbols" checked={hasSymbols} onCheckedChange={setHasSymbols} />
              </div>
            </div>

            <Button className="w-full" onClick={handleGenerate} disabled={disabled}>
              <RefreshCw className="w-4 h-4 mr-2" />
              生成密码
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                生成结果
              </span>
              <CopyButton
                text={password}
                mode="icon-text"
                variant="ghost"
                size="sm"
                disabled={!password}
                className="h-8 px-2 lg:px-3"
                onCopy={handleCopy}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={password}
              readOnly
              placeholder="点击生成按钮开始..."
              className="h-[200px] font-mono text-sm resize-none bg-muted/30"
            />
          </CardContent>
        </Card>
      </div>

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
                清空历史
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">暂无生成记录</div>
          ) : (
            <ScrollArea className="h-[260px] pr-4">
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="flex flex-col space-y-2 p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()} • 长度 {item.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <CopyButton
                          text={item.password}
                          mode="icon"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          iconClassName="w-3.5 h-3.5"
                          onCopy={handleCopy}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeHistoryItem(item.id)}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                    <div className="font-mono text-xs break-all text-muted-foreground">
                      {item.password}
                    </div>
                    <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                      {item.hasLowercase && <span className="px-1.5 py-0.5 rounded bg-muted">小写</span>}
                      {item.hasUppercase && <span className="px-1.5 py-0.5 rounded bg-muted">大写</span>}
                      {item.hasNumbers && <span className="px-1.5 py-0.5 rounded bg-muted">数字</span>}
                      {item.hasSymbols && <span className="px-1.5 py-0.5 rounded bg-muted">符号</span>}
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

export default PasswordGeneratorPage;
