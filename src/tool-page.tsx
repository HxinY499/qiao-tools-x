import { Info, Laptop, Moon, Sun } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useSidebar } from './components/ui/sidebar';
import { LOADING_MESSAGES } from './constant';
import { useIsMobile } from './hooks/use-mobile';
import { useThemeStore } from './store/theme';
import { ToolRoute } from './type';
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
  const isMobile = useIsMobile();
  const { themeSetting, effectiveTheme, setThemeSetting } = useThemeStore();
  const isDark = effectiveTheme === 'dark';

  return (
    <>
      {route.seo && (
        <SEO
          title={route.title}
          description={route.seo.description}
          keywords={route.seo.keywords}
          path={route.path}
          category={route.category}
        />
      )}

      <div className="flex flex-col min-h-screen">
        {/* 页面 Header */}
        <header
          className={cn(
            'h-16 px-6 flex items-center sticky top-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40',
          )}
        >
          <div className="flex items-center flex-1 min-w-0">
            <div
              className={cn('h-full w-8 bg-transparent transition-all shrink-0', open && 'w-1', isMobile && 'w-6')}
            ></div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg font-semibold tracking-tight truncate">{route.title}</h1>
              {route.subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{route.subtitle}</p>}
            </div>
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-10 bg-muted/60 hover:bg-muted">
                    <Info className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>数据安全说明</DialogTitle>
                    <DialogDescription className="pt-2 space-y-2">
                      <p>
                        这个工具站不会往后端存储任何数据，所有数据均存储在客户端本地（如 LocalStorage、IndexedDB
                        等），不用担心数据泄露风险。
                      </p>
                      <p>菜单置顶数据也保存在本地了，所以当切换浏览器或者清理缓存后指定数据会消失。</p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-10 bg-muted/60 hover:bg-muted">
                    {themeSetting === 'system' ? (
                      <Laptop className="h-3.5 w-3.5" />
                    ) : isDark ? (
                      <Moon className="h-3.5 w-3.5" />
                    ) : (
                      <Sun className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setThemeSetting('system')}>
                    <Laptop className="mr-2 h-3.5 w-3.5" />
                    <span>跟随系统</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setThemeSetting('light')}>
                    <Sun className="mr-2 h-3.5 w-3.5" />
                    <span>浅色模式</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setThemeSetting('dark')}>
                    <Moon className="mr-2 h-3.5 w-3.5" />
                    <span>深色模式</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
