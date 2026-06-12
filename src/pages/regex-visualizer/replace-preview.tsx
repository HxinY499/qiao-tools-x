/**
 * 替换预览组件
 */

import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('tools');

  return (
    <div className="space-y-4">
      {/* 替换模式输入 */}
      <div className="space-y-2">
        <Label htmlFor="replace-pattern" className="text-sm">
          {t('regexVisualizer.replace.label')}
        </Label>
        <Input
          id="replace-pattern"
          value={replacePattern}
          onChange={(e) => onReplacePatternChange(e.target.value)}
          placeholder={t('regexVisualizer.replace.placeholder')}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {t('regexVisualizer.replace.hint')}: <code className="px-1 bg-muted rounded">$&</code> {t('regexVisualizer.replace.hintMatch')},{' '}
          <code className="px-1 bg-muted rounded">$1</code> {t('regexVisualizer.replace.hintGroup1')},{' '}
          <code className="px-1 bg-muted rounded">$`</code> {t('regexVisualizer.replace.hintBefore')},{' '}
          <code className="px-1 bg-muted rounded">$'</code> {t('regexVisualizer.replace.hintAfter')}
        </p>
      </div>

      {/* 替换预览 */}
      {originalText && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>{t('regexVisualizer.replace.previewTitle')}</span>
            {replacedText !== null && (
              <CopyButton
                text={replacedText}
                mode="icon-text"
                size="sm"
                variant="ghost"
                copyText={t('regexVisualizer.replace.copyResult')}
                successText={t('regexVisualizer.replace.copied')}
                className="ml-auto"
              />
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr,auto,1fr]">
            {/* 原始文本 */}
            <div className="space-y-1">
              <div className="p-3 rounded-lg border bg-muted/30 font-mono text-sm whitespace-pre-wrap break-all min-h-[100px] max-h-[800px] overflow-y-auto custom-scrollbar">
                {originalText || t('regexVisualizer.replace.empty')}
              </div>
            </div>

            {/* 箭头 */}
            <div className="hidden md:flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* 替换后文本 */}
            <div className="space-y-1">
              <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/30 font-mono text-sm whitespace-pre-wrap break-all min-h-[100px] max-h-[800px] overflow-y-auto custom-scrollbar">
                {replacedText ?? t('regexVisualizer.replace.cannotReplace')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReplacePreview;
