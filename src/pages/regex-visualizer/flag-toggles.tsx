/**
 * 正则 Flag 切换组件
 */

import { useTranslation } from 'react-i18next';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { RegexFlags } from './types';

interface FlagTogglesProps {
  flags: RegexFlags;
  onToggle: (flag: keyof RegexFlags) => void;
}

const FLAG_KEYS: { key: keyof RegexFlags; char: string }[] = [
  { key: 'global', char: 'g' },
  { key: 'ignoreCase', char: 'i' },
  { key: 'multiline', char: 'm' },
  { key: 'dotAll', char: 's' },
  { key: 'unicode', char: 'u' },
  { key: 'sticky', char: 'y' },
];

export function FlagToggles({ flags, onToggle }: FlagTogglesProps) {
  const { t } = useTranslation('tools');

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1">
        {FLAG_KEYS.map(({ key, char }) => {
          const isPressed = flags[key];

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onToggle(key)}
                  className={`w-8 h-8 font-mono text-sm rounded-md border transition-colors ${
                    isPressed
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                      : 'bg-transparent border-input hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {char}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-medium">{t(`regexVisualizer.flag.${char}.label`)}</p>
                <p className="text-xs text-muted-foreground">{t(`regexVisualizer.flag.${char}.description`)}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export default FlagToggles;
