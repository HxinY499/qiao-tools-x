import { Copy, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils';

import { useWordCountStore } from './store';

const calculateReadingTime = (cjkCount: number, nonCjkCount: number) => {
  const WORDS_PER_MINUTE_EN = 200;
  const CHARS_PER_MINUTE_CJK = 400; // 中文阅读速度通常较快

  const minutes = cjkCount / CHARS_PER_MINUTE_CJK + nonCjkCount / WORDS_PER_MINUTE_EN;
  const ceilMinutes = Math.ceil(minutes);

  return {
    text: ceilMinutes < 1 ? '少于 1 分钟' : `${ceilMinutes} 分钟`,
    minutes,
  };
};

const analyzeText = (text: string) => {
  // 字符数（含空格）
  const chars = text.length;
  // 字符数（不含空格）
  const charsNoSpaces = text.replace(/\s/g, '').length;
  // 段落数 (非空行)
  const paragraphs = text.split(/\n/).filter((line) => line.trim() !== '').length;

  // 字数 (Words) 统计优化版
  // 1. CJK 字符：匹配汉字(含扩展)、日文假名、韩文
  // 注意：这里不包含 CJK 标点符号
  const cjkRegex = /[\u4E00-\u9FFF\u3400-\u4DBF\u20000-\u2A6DF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g;
  const cjkMatches = text.match(cjkRegex) || [];
  const cjkCount = cjkMatches.length;

  // 2. 非 CJK 单词：英文、数字、连字符单词
  // 先将 CJK 字符替换为空格，防止粘连影响判断
  const nonCjkText = text.replace(cjkRegex, ' ');
  // 匹配逻辑：
  // [a-zA-Z0-9_\u00C0-\u00FF]+ : 匹配字母、数字、下划线、拉丁字母补充
  // (['’\u2019-][a-zA-Z0-9_\u00C0-\u00FF]+)* : 匹配单词内部的连字符(-)、撇号(' ’)等后续部分
  // 这样可以匹配 "state-of-the-art", "don't", "user_id", "100.5" (暂不处理小数点的复杂情况，通常按词算)
  const wordMatches = nonCjkText.match(/[a-zA-Z0-9_\u00C0-\u00FF]+(['’\u2019-][a-zA-Z0-9_\u00C0-\u00FF]+)*/g) || [];
  const nonCjkCount = wordMatches.length;

  const words = cjkCount + nonCjkCount;

  // 句子数 (Sentences) 统计优化
  let tempText = text;
  // 临时替换常见的缩写点号，避免误判 (仅处理最常见的)
  const abbreviations = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Vs.', 'vs.', 'etc.', 'e.g.', 'i.e.'];
  abbreviations.forEach((abbr) => {
    // 使用特殊的占位符替换缩写中的点
    const replacement = abbr.replace('.', '__DOT__');
    // 简单的全局替换，注意正则转义
    tempText = tempText.split(abbr).join(replacement);
  });

  // 按句子结束符分割：. ! ? 。 ！ ？ …
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

export default function WordCountPage() {
  const { text, setText, targetWordCount, setTargetWordCount } = useWordCountStore();

  const stats = useMemo(() => analyzeText(text), [text]);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const handleClear = () => {
    if (window.confirm('确定要清空内容吗？')) {
      setText('');
    }
  };

  const progress = targetWordCount > 0 ? Math.min((stats.words / targetWordCount) * 100, 100) : 0;

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8 space-y-6">
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

      {/* 编辑区 */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">文本内容</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!text}>
              <Copy className="h-4 w-4 mr-2" />
              复制
            </Button>
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
