import { ArrowDownAZ, ChevronDown, Eraser, HelpCircle, Replace, Settings2, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

// ─── 模块级常量：复用正则避免每次分析时重新编译 ─────────────────

const CJK_REGEX = /[\u4E00-\u9FFF\u3400-\u4DBF\u20000-\u2A6DF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g;
const NON_CJK_WORD_REGEX = /[a-zA-Z0-9_\u00C0-\u00FF]+(['’\u2019-][a-zA-Z0-9_\u00C0-\u00FF]+)*/g;
const SENTENCE_SPLIT_REGEX = /[.!?。！？…]+/;
// 常见英文缩写（避免缩写里的"."被当成句号切分）
// 用单个正则一次性替换所有缩写，避免 N 次 split/join
const ABBREVIATION_REGEX = /\b(Mr|Mrs|Ms|Dr|Vs|vs|etc|e\.g|i\.e)\./g;
const ABBREVIATION_PLACEHOLDER = '__DOT__';

const calculateReadingTime = (cjkCount: number, nonCjkCount: number) => {
  const WORDS_PER_MINUTE_EN = 200;
  const CHARS_PER_MINUTE_CJK = 400;

  if (cjkCount === 0 && nonCjkCount === 0) {
    return {
      minutes: 0,
    };
  }

  const minutes = cjkCount / CHARS_PER_MINUTE_CJK + nonCjkCount / WORDS_PER_MINUTE_EN;

  return {
    minutes,
  };
};

const analyzeText = (text: string) => {
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const paragraphs = text.split(/\n/).filter((line) => line.trim() !== '').length;

  const cjkMatches = text.match(CJK_REGEX) || [];
  const cjkCount = cjkMatches.length;

  const nonCjkText = text.replace(CJK_REGEX, ' ');
  const wordMatches = nonCjkText.match(NON_CJK_WORD_REGEX) || [];
  const nonCjkCount = wordMatches.length;

  const words = cjkCount + nonCjkCount;

  // 一次性替换所有缩写中的 "." 为占位符（避免 N 次 split/join）
  const placeholderText = text.replace(ABBREVIATION_REGEX, (match) => match.replace(/\./g, ABBREVIATION_PLACEHOLDER));
  const sentences = placeholderText.split(SENTENCE_SPLIT_REGEX).filter((s) => s.trim().length > 0).length;

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

const COMMON_REGEX_VALUES = [
  { labelKey: 'wordCount.regexNumbers', value: '\\d+' },
  { labelKey: 'wordCount.regexLetters', value: '[a-zA-Z]+' },
  { labelKey: 'wordCount.regexChinese', value: '[\\u4e00-\\u9fa5]+' },
  { labelKey: 'wordCount.regexWhitespace', value: '\\s+' },
  { labelKey: 'wordCount.regexNewline', value: '\\n' },
  { labelKey: 'wordCount.regexEmail', value: '\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*' },
];

export default function WordCountAndProcessPage() {
  const { t } = useTranslation('tools');
  const { text, setText, targetWordCount, setTargetWordCount } = useWordCountStore();
  const [replacePopoverOpen, setReplacePopoverOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(true);

  const stats = useMemo(() => analyzeText(text), [text]);

  const readingTimeText = useMemo(() => {
    const { minutes } = stats.readingTime;
    if (minutes === 0) return t('wordCount.readingTimeZero');
    const ceilMinutes = Math.ceil(minutes);
    return ceilMinutes < 1 ? t('wordCount.readingTimeLessThanOne') : t('wordCount.readingTimeMinutes', { count: ceilMinutes });
  }, [stats.readingTime, t]);

  const handleClear = () => {
    if (window.confirm(t('wordCount.confirmClear'))) {
      setText('');
    }
  };

  const handleFormat = (type: 'spaces' | 'lines' | 'tabs' | 'fullwidth' | 'all') => {
    let newText = text;

    switch (type) {
      case 'spaces':
        newText = newText.replace(/[ \t]+/g, ' ').replace(/^ +| +$/gm, '');
        toast.success(t('wordCount.toastSpacesRemoved'));
        break;
      case 'lines':
        newText = newText.replace(/\n\s*\n/g, '\n').trim();
        toast.success(t('wordCount.toastLinesRemoved'));
        break;
      case 'tabs':
        newText = newText.replace(/\t/g, ' ');
        toast.success(t('wordCount.toastTabsRemoved'));
        break;
      case 'fullwidth':
        newText = newText.replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
        newText = newText.replace(/\u3000/g, ' ');
        toast.success(t('wordCount.toastFullwidthConverted'));
        break;
      case 'all':
        newText = newText.replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
        newText = newText.replace(/\u3000/g, ' ');
        newText = newText.replace(/\t/g, ' ');
        newText = newText.replace(/[ \t]+/g, ' ').replace(/^ +| +$/gm, '');
        newText = newText.replace(/\n\s*\n/g, '\n').trim();
        toast.success(t('wordCount.toastAllCleaned'));
        break;
    }

    setText(newText);
  };

  const handleReplace = (replaceAll: boolean = true) => {
    if (!findText) {
      toast.error(t('wordCount.toastFindEmpty'));
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
        toast.info(t('wordCount.toastNoMatch'));
        return;
      }

      // 仅在全局正则下需要 count：此时 String.prototype.replace 会扫描全文
      // 再用 match 扫一遍是必要的代价（因为原生 replace 不返回次数）
      let count = 1;
      if (searchValue instanceof RegExp && searchValue.global) {
        count = (text.match(searchValue) || []).length;
      }

      setText(newText);
      toast.success(t('wordCount.toastReplaced', { count }));
      setReplacePopoverOpen(false);
    } catch {
      toast.error(t('wordCount.toastRegexError'));
    }
  };

  const quickReplaceNewlineToBreak = () => {
    if (!text) return;
    // 将字面量 \n 替换为真实换行符
    const newText = text.replace(/\\n/g, '\n');
    if (newText === text) {
      toast.info(t('wordCount.toastNoNewline'));
    } else {
      setText(newText);
      toast.success(t('wordCount.toastNewlineReplaced'));
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
      toast.info(t('wordCount.toastNoEscape'));
    } else {
      setText(newText);
      toast.success(t('wordCount.toastEscapeRemoved'));
      setReplacePopoverOpen(false);
    }
  };

  const progress = targetWordCount > 0 ? Math.min((stats.words / targetWordCount) * 100, 100) : 0;

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-6">
      <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('wordCount.statsTitle')}</h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronDown
                className={cn('h-4 w-4 transition-transform duration-200', isStatsOpen ? '' : '-rotate-90')}
              />
              <span className="sr-only">{t('wordCount.toggleStats')}</span>
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="space-y-6">
          {/* 统计卡片区 */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard title={t('wordCount.statWords')} value={stats.words} />
            <StatCard title={t('wordCount.statChars')} value={stats.chars} sub={`${t('wordCount.statCharsNoSpaces')}: ${stats.charsNoSpaces}`} />
            <StatCard title={t('wordCount.statReadingTime')} value={readingTimeText} />
            <StatCard title={t('wordCount.statParagraphs')} value={stats.paragraphs} />
            <StatCard title={t('wordCount.statSentences')} value={stats.sentences} />
          </div>

          {/* 目标设定 & 进度条 */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 lg:p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
              <div className="flex flex-col gap-1.5 w-full max-w-xs">
                <Label htmlFor="target" className="text-sm font-semibold">
                  {t('wordCount.targetWordCount')}
                </Label>
                <Input
                  id="target"
                  type="number"
                  placeholder={t('wordCount.targetWordCountPlaceholder')}
                  value={targetWordCount || ''}
                  onChange={(e) => setTargetWordCount(Number(e.target.value))}
                  min={0}
                />
              </div>
              {targetWordCount > 0 && (
                <div className="flex-1 w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('wordCount.progress')}</span>
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
          <h3 className="text-lg font-semibold">{t('wordCount.textContentTitle')}</h3>
          <div className="flex flex-wrap gap-2">
            {/* 查找替换 Popover */}
            <Popover open={replacePopoverOpen} onOpenChange={setReplacePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" disabled={!text}>
                  <Replace className="h-4 w-4 mr-2" />
                  {t('wordCount.btnFindReplace')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium leading-none">{t('wordCount.findReplaceTitle')}</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs break-words">
                          {t('wordCount.findReplaceTooltip')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid gap-2">
                      <Label htmlFor="find">{t('wordCount.labelFind')}</Label>
                      <Textarea
                        id="find"
                        className="min-h-[60px] text-xs resize-y"
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                        placeholder={t('wordCount.placeholderFind')}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="replace">{t('wordCount.labelReplaceWith')}</Label>
                      <Textarea
                        id="replace"
                        className="min-h-[60px] text-xs resize-y"
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                        placeholder={t('wordCount.placeholderReplace')}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch id="regex-mode" checked={useRegex} onCheckedChange={setUseRegex} />
                      <Label htmlFor="regex-mode" className="text-xs">
                        {t('wordCount.useRegex')}
                      </Label>
                    </div>
                    {useRegex && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                            {t('wordCount.commonRegex')} <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                          <DropdownMenuLabel>{t('wordCount.selectCommonRegex')}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {COMMON_REGEX_VALUES.map((item) => (
                            <DropdownMenuItem key={item.labelKey} onClick={() => setFindText(item.value)}>
                              <span className="flex-1 truncate">{t(item.labelKey)}</span>
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
                      ⚡ {t('wordCount.quickReplaceNewline')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs h-8 justify-start px-3"
                      onClick={removeEscapes}
                    >
                      ⚡ {t('wordCount.quickRemoveEscape')}
                    </Button>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setReplacePopoverOpen(false)}
                    >
                      {t('wordCount.btnCancel')}
                    </Button>
                    <Button size="sm" className="h-8 text-xs" onClick={() => handleReplace(true)}>
                      {t('wordCount.btnReplaceAll')}
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
                  {t('wordCount.btnCleanFormat')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{t('wordCount.selectCleanMethod')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleFormat('spaces')}>{t('wordCount.cleanSpaces')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFormat('lines')}>{t('wordCount.cleanLines')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFormat('tabs')}>{t('wordCount.cleanTabs')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFormat('fullwidth')}>
                  {t('wordCount.cleanFullwidth')} <ArrowDownAZ className="ml-auto h-3 w-3 opacity-50" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleFormat('all')}
                  className="text-primary focus:text-primary focus:bg-primary/10"
                >
                  <Settings2 className="mr-2 h-4 w-4" />
                  {t('wordCount.cleanAll')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <CopyButton
              text={text}
              mode="icon-text"
              variant="outline"
              size="sm"
              disabled={!text}
              copyText={t('wordCount.btnCopy')}
              successText={t('wordCount.btnCopied')}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!text}
              className="text-destructive hover:text-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('wordCount.btnClearText')}
            </Button>
          </div>
        </div>
        <Textarea
          className="min-h-[400px] text-base leading-relaxed p-4 resize-y font-mono"
          placeholder={t('wordCount.placeholderTextarea')}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
    </div>
  );
}
