import { ArrowDownAZ, ChevronDown, Eraser, HelpCircle, Replace, Settings2, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

import { useWordCountStore } from './store';

const calculateReadingTime = (cjkCount: number, nonCjkCount: number) => {
  const WORDS_PER_MINUTE_EN = 200;
  const CHARS_PER_MINUTE_CJK = 400;

  if (cjkCount === 0 && nonCjkCount === 0) {
    return {
      text: '0 分钟',
      minutes: 0,
    };
  }

  const minutes = cjkCount / CHARS_PER_MINUTE_CJK + nonCjkCount / WORDS_PER_MINUTE_EN;
  const ceilMinutes = Math.ceil(minutes);

  return {
    text: ceilMinutes < 1 ? '少于 1 分钟' : `${ceilMinutes} 分钟`,
    minutes,
  };
};

const analyzeText = (text: string) => {
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const paragraphs = text.split(/\n/).filter((line) => line.trim() !== '').length;

  const cjkRegex = /[\u4E00-\u9FFF\u3400-\u4DBF\u20000-\u2A6DF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g;
  const cjkMatches = text.match(cjkRegex) || [];
  const cjkCount = cjkMatches.length;

  const nonCjkText = text.replace(cjkRegex, ' ');
  const wordMatches = nonCjkText.match(/[a-zA-Z0-9_\u00C0-\u00FF]+(['’\u2019-][a-zA-Z0-9_\u00C0-\u00FF]+)*/g) || [];
  const nonCjkCount = wordMatches.length;

  const words = cjkCount + nonCjkCount;

  let tempText = text;
  const abbreviations = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Vs.', 'vs.', 'etc.', 'e.g.', 'i.e.'];
  abbreviations.forEach((abbr) => {
    const replacement = abbr.replace('.', '__DOT__');
    tempText = tempText.split(abbr).join(replacement);
  });

  const sentences = tempText.split(/[.!?。！？…]+/).filter((s) => s.trim().length > 0).length;

  const rt = calculateReadingTime(cjkCount, nonCjkCount);

  return { chars, charsNoSpaces, paragraphs, sentences, words, readingTime: rt };
};

const StatCard = ({
  title,
  value,
  sub,
  className,
}: {
  title: string;
  value: number | string;
  sub?: string;
  className?: string;
}) => (
  <Card className={cn('overflow-hidden', className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      <div className="text-2xl font-bold truncate" title={String(value)}>
        {value}
      </div>
      {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
    </CardContent>
  </Card>
);

const COMMON_REGEX = [
  { label: '匹配数字', value: '\\d+' },
  { label: '匹配字母', value: '[a-zA-Z]+' },
  { label: '匹配中文', value: '[\\u4e00-\\u9fa5]+' },
  { label: '匹配空白字符', value: '\\s+' },
  { label: '匹配换行符', value: '\\n' },
  { label: '匹配邮箱', value: '\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*' },
];

export default function WordCountAndProcessPage() {
  const { text, setText, targetWordCount, setTargetWordCount } = useWordCountStore();
  const [replacePopoverOpen, setReplacePopoverOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(true);

  const stats = useMemo(() => analyzeText(text), [text]);

  const handleClear = () => {
    if (window.confirm('确定要清空内容吗？')) {
      setText('');
    }
  };

  const handleFormat = (type: 'spaces' | 'lines' | 'tabs' | 'fullwidth' | 'all') => {
    let newText = text;

    switch (type) {
      case 'spaces':
        newText = newText.replace(/[ \t]+/g, ' ').replace(/^ +| +$/gm, '');
        toast.success('已去除多余空格');
        break;
      case 'lines':
        newText = newText.replace(/\n\s*\n/g, '\n').trim();
        toast.success('已去除空行');
        break;
      case 'tabs':
        newText = newText.replace(/\t/g, ' ');
        toast.success('已去除制表符');
        break;
      case 'fullwidth':
        newText = newText.replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
        newText = newText.replace(/\u3000/g, ' ');
        toast.success('已将全角转半角');
        break;
      case 'all':
        newText = newText.replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
        newText = newText.replace(/\u3000/g, ' ');
        newText = newText.replace(/\t/g, ' ');
        newText = newText.replace(/[ \t]+/g, ' ').replace(/^ +| +$/gm, '');
        newText = newText.replace(/\n\s*\n/g, '\n').trim();
        toast.success('已执行全部清理');
        break;
    }

    setText(newText);
  };

  const handleReplace = (replaceAll: boolean = true) => {
    if (!findText) {
      toast.error('请输入查找内容');
      return;
    }

    try {
      let searchValue: string | RegExp = findText;
      // 处理转义字符，将 \n 转换为真实换行符
      const actualFindText = findText.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      const actualReplaceText = replaceText.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

      if (useRegex) {
        // 如果使用正则，就不自动处理 \n，用户需要自己写 \n
        searchValue = new RegExp(findText, replaceAll ? 'g' : '');
      } else {
        if (replaceAll) {
          // 如果不是正则模式但要全部替换，需要转义特殊字符并构造全局正则
          const escapedFindText = actualFindText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          searchValue = new RegExp(escapedFindText, 'g');
        } else {
          searchValue = actualFindText;
        }
      }

      // 如果不是正则模式，replaceText 使用处理过转义符的文本
      // 如果是正则模式，replaceText 保持原样（支持 $1 $2 引用）
      const finalReplaceText = useRegex ? replaceText : actualReplaceText;

      const newText = text.replace(searchValue, finalReplaceText);

      if (newText === text) {
        toast.info('未找到匹配内容或内容未发生变化');
      } else {
        let count = 0;
        if (searchValue instanceof RegExp) {
          if (searchValue.global) {
            count = (text.match(searchValue) || []).length;
          } else {
            count = 1;
          }
        } else {
          // 字符串替换模式，replace只替换第一个
          count = 1;
        }

        setText(newText);
        toast.success(`替换完成，共替换 ${count} 处`);
        setReplacePopoverOpen(false);
      }
    } catch {
      toast.error('正则表达式错误');
    }
  };

  const quickReplaceNewlineToBreak = () => {
    if (!text) return;
    // 将字面量 \n 替换为真实换行符
    const newText = text.replace(/\\n/g, '\n');
    if (newText === text) {
      toast.info('未找到 \\n 文本');
    } else {
      setText(newText);
      toast.success('已将所有 \\n 替换为真实换行符');
      setReplacePopoverOpen(false);
    }
  };

  const removeEscapes = () => {
    if (!text) return;
    // 去除常见转义符：\' -> ', \" -> ", \\ -> \, \/ -> /
    // 保留 \n, \t, \r, \uXXXX 等特殊转义
    const controlChars = ['n', 't', 'r', 'b', 'f', 'v', '0', 'u', 'x'];
    const newText = text.replace(/\\(.)/g, (match, char) => {
      if (controlChars.includes(char)) return match;
      return char;
    });

    if (newText === text) {
      toast.info('未找到可去除的转义符');
    } else {
      setText(newText);
      toast.success('已去除所有转义符');
      setReplacePopoverOpen(false);
    }
  };

  const progress = targetWordCount > 0 ? Math.min((stats.words / targetWordCount) * 100, 100) : 0;

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-6">
      <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">统计数据</h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronDown
                className={cn('h-4 w-4 transition-transform duration-200', isStatsOpen ? '' : '-rotate-90')}
              />
              <span className="sr-only">切换统计面板</span>
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="space-y-6">
          {/* 统计卡片区 */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard title="字数" value={stats.words} />
            <StatCard title="字符数" value={stats.chars} sub={`无空格: ${stats.charsNoSpaces}`} />
            <StatCard title="阅读时间" value={stats.readingTime.text} />
            <StatCard title="段落" value={stats.paragraphs} />
            <StatCard title="句子" value={stats.sentences} />
          </div>

          {/* 目标设定 & 进度条 */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 lg:p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
              <div className="flex flex-col gap-1.5 w-full max-w-xs">
                <Label htmlFor="target" className="text-sm font-semibold">
                  目标字数
                </Label>
                <Input
                  id="target"
                  type="number"
                  placeholder="设置目标字数（可选）"
                  value={targetWordCount || ''}
                  onChange={(e) => setTargetWordCount(Number(e.target.value))}
                  min={0}
                />
              </div>
              {targetWordCount > 0 && (
                <div className="flex-1 w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>完成度</span>
                    <span className="font-medium">
                      {Math.round(progress)}% ({stats.words} / {targetWordCount})
                    </span>
                  </div>
                  <Progress value={progress} className="h-2.5" />
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 编辑区 */}
      <div className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold">文本内容</h3>
          <div className="flex flex-wrap gap-2">
            {/* 查找替换 Popover */}
            <Popover open={replacePopoverOpen} onOpenChange={setReplacePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" disabled={!text}>
                  <Replace className="h-4 w-4 mr-2" />
                  查找替换
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium leading-none">查找与替换</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs break-words">
                          这是一个轻量级文本处理工具，不支持查找高亮。
                          <br />
                          如果需要，请使用浏览器自带查找功能（快捷键 Ctrl/Cmd + F）
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid gap-2">
                      <Label htmlFor="find">查找</Label>
                      <Textarea
                        id="find"
                        className="min-h-[60px] text-xs resize-y"
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                        placeholder="输入查找内容..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="replace">替换为</Label>
                      <Textarea
                        id="replace"
                        className="min-h-[60px] text-xs resize-y"
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                        placeholder="输入替换内容..."
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch id="regex-mode" checked={useRegex} onCheckedChange={setUseRegex} />
                      <Label htmlFor="regex-mode" className="text-xs">
                        使用正则表达式
                      </Label>
                    </div>
                    {useRegex && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                            常用正则 <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                          <DropdownMenuLabel>选择常用正则</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {COMMON_REGEX.map((item) => (
                            <DropdownMenuItem key={item.label} onClick={() => setFindText(item.value)}>
                              <span className="flex-1 truncate">{item.label}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs h-8 justify-start px-3"
                      onClick={quickReplaceNewlineToBreak}
                    >
                      ⚡ 将 \n 替换为真实换行
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs h-8 justify-start px-3"
                      onClick={removeEscapes}
                    >
                      ⚡ 去除转义符 (如 \' → ')
                    </Button>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setReplacePopoverOpen(false)}
                    >
                      取消
                    </Button>
                    <Button size="sm" className="h-8 text-xs" onClick={() => handleReplace(true)}>
                      全部替换
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* 文本格式化下拉菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={!text}>
                  <Eraser className="h-4 w-4 mr-2" />
                  清理格式
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>选择清理方式</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleFormat('spaces')}>去除多余空格</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFormat('lines')}>去除空行</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFormat('tabs')}>去除制表符</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFormat('fullwidth')}>
                  全角转半角 <ArrowDownAZ className="ml-auto h-3 w-3 opacity-50" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleFormat('all')}
                  className="text-primary focus:text-primary focus:bg-primary/10"
                >
                  <Settings2 className="mr-2 h-4 w-4" />
                  一键全部清理
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <CopyButton
              text={text}
              mode="icon-text"
              variant="outline"
              size="sm"
              disabled={!text}
              copyText="复制"
              successText="已复制"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!text}
              className="text-destructive hover:text-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清空
            </Button>
          </div>
        </div>
        <Textarea
          className="min-h-[400px] text-base leading-relaxed p-4 resize-y font-mono"
          placeholder="在此输入或粘贴文本..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
    </div>
  );
}
