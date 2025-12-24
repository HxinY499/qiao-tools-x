/**
 * 替换预览组件
 */

import { ArrowRight } from 'lucide-react';

import { CopyButton } from '@/components/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ReplacePreviewProps {
  replacePattern: string;
  onReplacePatternChange: (value: string) => void;
  originalText: string;
  replacedText: string | null;
}

export function ReplacePreview({
  replacePattern,
  onReplacePatternChange,
  originalText,
  replacedText,
}: ReplacePreviewProps) {
  return (
    <div className="space-y-4">
      {/* 替换模式输入 */}
      <div className="space-y-2">
        <Label htmlFor="replace-pattern" className="text-sm">
          替换模式
        </Label>
        <Input
          id="replace-pattern"
          value={replacePattern}
          onChange={(e) => onReplacePatternChange(e.target.value)}
          placeholder="输入替换文本，支持 $1, $2, $& 等"
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          提示: <code className="px-1 bg-muted rounded">$&</code> 匹配的文本,{' '}
          <code className="px-1 bg-muted rounded">$1</code> 第一个捕获组,{' '}
          <code className="px-1 bg-muted rounded">$`</code> 匹配前的文本,{' '}
          <code className="px-1 bg-muted rounded">$'</code> 匹配后的文本
        </p>
      </div>

      {/* 替换预览 */}
      {originalText && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>替换预览</span>
            {replacedText !== null && (
              <CopyButton
                text={replacedText}
                mode="icon-text"
                size="sm"
                variant="ghost"
                copyText="复制结果"
                successText="已复制"
                className="ml-auto"
              />
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr,auto,1fr]">
            {/* 原始文本 */}
            <div className="space-y-1">
              <div className="p-3 rounded-lg border bg-muted/30 font-mono text-sm whitespace-pre-wrap break-all min-h-[100px] max-h-[800px] overflow-y-auto custom-scrollbar">
                {originalText || '(空)'}
              </div>
            </div>

            {/* 箭头 */}
            <div className="hidden md:flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* 替换后文本 */}
            <div className="space-y-1">
              <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/30 font-mono text-sm whitespace-pre-wrap break-all min-h-[100px] max-h-[800px] overflow-y-auto custom-scrollbar">
                {replacedText ?? '(无法替换)'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReplacePreview;
