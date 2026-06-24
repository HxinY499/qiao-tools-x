import { Check, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import { cn } from '@/utils';

interface LanguageSwitcherProps {
  /** 触发器额外类名 */
  className?: string;
  /**
   * 展示形态：
   * - `inline`：图标 + 当前语言文字（用于 sidebar 等需要文字标签的场景）
   * - `icon`：纯图标圆形按钮（用于顶栏与主题按钮并排）
   */
  variant?: 'inline' | 'icon';
}

export function LanguageSwitcher({ className, variant = 'inline' }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const current = i18n.language as SupportedLanguage;

  const trigger =
    variant === 'icon' ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60',
                className,
              )}
              aria-label={t(`language.${current}`)}
            >
              <Languages className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {t(`language.${current}`)}
        </TooltipContent>
      </Tooltip>
    ) : (
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors',
            className,
          )}
        >
          <Languages className="h-3.5 w-3.5 shrink-0" />
          <span>{t(`language.${current}`)}</span>
        </button>
      </DropdownMenuTrigger>
    );

  return (
    <DropdownMenu>
      {trigger}
      <DropdownMenuContent align={variant === 'icon' ? 'end' : 'start'} className="min-w-[140px]">
        {SUPPORTED_LANGUAGES.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => i18n.changeLanguage(lng)}
            className="flex items-center justify-between"
          >
            <span>{t(`language.${lng}`)}</span>
            {current === lng && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
