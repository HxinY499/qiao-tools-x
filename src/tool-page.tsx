import { Moon, Sun } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger } from './components/ui/select';
import { useSidebar } from './components/ui/sidebar';
import { LOADING_MESSAGES } from './constant';
import { ToolRoute } from './router';
import { useThemeStore } from './store/theme';
import { cn } from './utils';

function RouteLoadingFallback() {
  const [visible, setVisible] = useState(false);
  const [message] = useState(() => {
    const index = Math.floor(Math.random() * LOADING_MESSAGES.length);
    return LOADING_MESSAGES[index];
  });

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
      <div className="text-xs text-center px-4 max-w-sm leading-relaxed">{message}</div>
    </div>
  );
}

export function ToolPage({ route }: { route: ToolRoute }) {
  const { open } = useSidebar();
  const { themeSetting, effectiveTheme, setThemeSetting } = useThemeStore();
  const isDark = effectiveTheme === 'dark';

  return (
    <>
      <div className="flex flex-col min-h-screen">
        {/* 页面 Header */}
        <header className="h-16 px-6 flex items-center sticky top-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
          <div className="flex items-center flex-1">
            <div className={cn('h-full w-8 bg-transparent transition-all', open && 'w-1')}></div>

            <div className="flex flex-col">
              <h1 className="text-lg font-semibold tracking-tight">{route.title}</h1>
              {route.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{route.subtitle}</p>}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Select
                value={themeSetting}
                onValueChange={(value) => setThemeSetting(value as 'light' | 'dark' | 'system')}
              >
                <SelectTrigger className="h-8 w-[120px] border-none bg-muted/60 hover:bg-muted text-[11px] px-3 transition-colors">
                  <div className="flex items-center gap-1.5">
                    {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                    <span>
                      {themeSetting === 'system' ? '跟随系统' : themeSetting === 'dark' ? '深色模式' : '浅色模式'}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">跟随系统</SelectItem>
                  <SelectItem value="light">浅色模式</SelectItem>
                  <SelectItem value="dark">深色模式</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <div className="flex-1">
          <Suspense fallback={<RouteLoadingFallback />}>
            <route.component />
          </Suspense>
        </div>
      </div>
    </>
  );
}
