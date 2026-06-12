/**
 * 正则解释视图组件
 */

import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';

import type { ExplanationItem } from './types';

interface ExplanationViewProps {
  items: ExplanationItem[];
}

const TYPE_COLORS: Record<string, string> = {
  literal: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  meta: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  escape: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  class: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  group: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  quantifier: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
};

export function ExplanationView({ items }: ExplanationViewProps) {
  const { t } = useTranslation('tools');

  const TYPE_LABEL_KEYS: Record<string, string> = {
    literal: 'regexVisualizer.typeLabel.literal',
    meta: 'regexVisualizer.typeLabel.meta',
    escape: 'regexVisualizer.typeLabel.escape',
    class: 'regexVisualizer.typeLabel.class',
    group: 'regexVisualizer.typeLabel.group',
    quantifier: 'regexVisualizer.typeLabel.quantifier',
  };

  if (items.length === 0) {
    return <div className="text-center text-muted-foreground py-8 text-sm">{t('regexVisualizer.explanation.empty')}</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
        >
          <code
            className={`px-2 py-1 rounded font-mono text-sm shrink-0 ${TYPE_COLORS[item.type] || TYPE_COLORS.literal}`}
          >
            {item.raw}
          </code>
          <div className="flex-1 min-w-0">
            <p className="text-sm">{item.description}</p>
            <Badge variant="outline" className="mt-1 text-[10px]">
              {TYPE_LABEL_KEYS[item.type] ? t(TYPE_LABEL_KEYS[item.type]) : item.type}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ExplanationView;
