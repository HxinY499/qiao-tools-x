import { Info, Laptop, Moon, Sun } from 'lucide-react';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SEO } from '@/components/seo';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useSidebar } from './components/ui/sidebar';
import { useIsMobile } from './hooks/use-mobile';
import { useThemeStore, type ThemeSetting } from './store/theme';
import { ToolRoute } from './type';
import { cn } from './utils';

// ─── 路由加载 fallback ────────────────────────────────────────
function RouteLoadingFallback() {
  const { t } = useTranslation('toolPage');
  const [visible, setVisible] = useState(false);
  const [index] = useState(() => Math.floor(Math.random() * 5));

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
      <div className="text-xs text-center px-4 max-w-sm leading-relaxed">
        {(t('loading', { returnObjects: true }) as string[])[index]}
      </div>
    </div>
  );
}

// ─── 主题 cycle 按钮（light → dark → system → light） ──────────
const THEME_CYCLE: ThemeSetting[] = ['light', 'dark', 'system'];
const THEME_ICONS: Record<ThemeSetting, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Laptop,
};

function ThemeToggleButton() {
  const { t } = useTranslation('toolPage');
  const { themeSetting, setThemeSetting } = useThemeStore();
  const Icon = THEME_ICONS[themeSetting];

  const handleClick = useCallback(() => {
    const idx = THEME_CYCLE.indexOf(themeSetting);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    setThemeSetting(next);
  }, [themeSetting, setThemeSetting]);

  const label = t(`themes.${themeSetting}`);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60"
          onClick={handleClick}
          aria-label={t('themeAria', { label })}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {t('themeTip', { label })}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── 工具页 ───────────────────────────────────────────────────
export function ToolPage({ route }: { route: ToolRoute }) {
  const { t } = useTranslation('routes');
  const { t: tTool } = useTranslation('toolPage');
  const { open } = useSidebar();
  const isMobile = useIsMobile();

  // i18n 标题/副标题：优先取翻译，兜底 router.ts 里的原值
  const title = t(`${route.key}.title`, route.title);
  const subtitle = route.subtitle ? t(`${route.key}.subtitle`, route.subtitle) : undefined;

  return (
    <>
      {route.seo && (
        <SEO
          title={title}
          description={route.seo.description}
          keywords={route.seo.keywords}
          path={route.path}
          category={route.category}
        />
      )}

      <div className="flex flex-col h-screen overflow-hidden">
        {/* 顶部浮岛 Header —— 和 sidebar 的悬浮卡片风格保持一致 */}
        <div className="shrink-0 px-2 pt-2 pb-0 z-40">
          <TooltipProvider delayDuration={200}>
            <header
              className={cn(
                'h-14 pl-3 pr-2.5 flex items-center gap-3',
                'rounded-lg border border-sidebar-border bg-sidebar',
                'animate-in fade-in slide-in-from-top-1 duration-300',
              )}
            >
              {/* SidebarTrigger 占位（侧栏收起时让出空间） */}
              <div
                className={cn(
                  'h-full bg-transparent transition-[width] duration-200 shrink-0',
                  open ? 'w-0' : 'w-9',
                  isMobile && 'w-7',
                )}
              />

              {/* 标题 + 副标题 */}
              <div className="flex flex-col min-w-0 flex-1">
                <h1 className="text-[15px] font-semibold tracking-tight truncate leading-tight">{title}</h1>
                {subtitle && (
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate leading-snug">{subtitle}</p>
                )}
              </div>

              {/* 右侧操作：Info + 主题切换 */}
              <div className="flex items-center gap-0.5 shrink-0">
                <Dialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          aria-label={tTool('dataSafety.trigger')}
                        >
                          <Info className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {tTool('dataSafety.trigger')}
                    </TooltipContent>
                  </Tooltip>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{tTool('dataSafety.title')}</DialogTitle>
                      <DialogDescription className="pt-2 space-y-2">
                        <p>{tTool('dataSafety.para1')}</p>
                        <p>{tTool('dataSafety.para2')}</p>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>

                <ThemeToggleButton />
              </div>
            </header>
          </TooltipProvider>
        </div>

        {/* 页面内容（独立滚动容器，工具内的 sticky 相对于此容器吸顶） */}
        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-clip custom-scrollbar">
          <Suspense fallback={<RouteLoadingFallback />}>
            <route.component />
          </Suspense>
        </div>
      </div>
    </>
  );
}

