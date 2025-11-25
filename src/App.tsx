import { ChevronLeft, HelpCircle, Menu, Moon, Pin, Sun } from 'lucide-react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toolRoutes } from '@/router';
import { useMenuStore } from '@/store/menu';
import { useThemeStore } from '@/store/theme';
import { cn } from '@/utils';

import { LOADING_MESSAGES } from './constant';

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

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { themeSetting, effectiveTheme, setThemeSetting } = useThemeStore();
  const { pinnedPaths, togglePin, isPinned } = useMenuStore();
  const isDark = effectiveTheme === 'dark';

  // 根据置顶状态排序工具路由
  const sortedRoutes = useMemo(() => {
    const pinned = toolRoutes.filter((route) => pinnedPaths.includes(route.path));
    const unpinned = toolRoutes.filter((route) => !pinnedPaths.includes(route.path));
    return [...pinned, ...unpinned];
  }, [pinnedPaths]);

  const firstPath = sortedRoutes[0]?.path ?? '/';

  return (
    <div className="h-screen bg-background text-foreground flex">
      {/* 左侧工具菜单 */}
      <aside
        className={cn(
          'border-r border-border/80 bg-gradient-to-b from-background/95 via-card/95 to-background/90 backdrop-blur flex flex-col transition-all duration-200 shadow-sm',
          isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none -ml-px' : 'w-64',
        )}
      >
        {/* menu header */}
        <div className="shrink-0 h-16 pl-12 border-b border-border/80 flex items-center gap-3">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">QIAO</span>
            <span className="text-sm font-semibold tracking-wide">Tools</span>
          </div>
        </div>

        {/* menu content */}
        <nav className="flex-1 py-3 px-2 space-y-1 text-sm min-h-0 overflow-auto">
          {sortedRoutes.map((route) => {
            const Icon = route.icon;
            const pinned = isPinned(route.path);
            return (
              <div key={route.path} className="relative group">
                <NavLink
                  to={route.path}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors pr-8',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    ].join(' ')
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{route.label}</span>
                </NavLink>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(route.path);
                  }}
                  className={cn(
                    'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-all',
                    pinned
                      ? 'opacity-100 text-primary hover:text-primary/80'
                      : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground',
                  )}
                  aria-label={pinned ? '取消置顶' : '置顶'}
                >
                  <Pin className={cn('h-3.5 w-3.5 transition-transform', pinned && 'fill-current')} />
                </button>
              </div>
            );
          })}
        </nav>

        {/* menu footer */}
        <div className="px-4 py-3 border-t border-border text-[11px] text-muted-foreground space-y-2 bg-background">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 cursor-help">
                  <HelpCircle className="h-3 w-3" />
                  <span>置顶数据存储说明</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px] text-xs">
                <p>工具置顶数据保存在浏览器本地存储中，清除浏览器数据会导致置顶信息丢失。</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setIsSidebarCollapsed(isSidebarCollapsed ? false : true)}
        className="h-8 w-8 flex items-center border justify-center rounded-md text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/60 transition-colors absolute top-4 left-2 z-50"
      >
        {isSidebarCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        <span className="sr-only">{isSidebarCollapsed ? '展开菜单' : '收起菜单'}</span>
      </button>

      {/* 右侧内容区 */}
      <main className="flex-1 min-w-0 min-h-screen overflow-auto bg-background">
        <Routes>
          {toolRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <div className="min-h-screen">
                  <header
                    className={cn(
                      'h-16 px-6 flex items-center sticky top-0 border-b border-border bg-background/80 backdrop-blur z-40',
                    )}
                  >
                    <div
                      className={cn(
                        'h-full bg-transparent transition-all duration-2000',
                        isSidebarCollapsed ? 'w-8' : 'w-1',
                      )}
                    ></div>
                    <div className="flex items-center w-full">
                      <div className="flex flex-col">
                        <h1 className="text-lg font-semibold tracking-wide">{route.title}</h1>
                        {route.subtitle && <p className="text-xs text-muted-foreground">{route.subtitle}</p>}
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <Select
                          value={themeSetting}
                          onValueChange={(value) => setThemeSetting(value as 'light' | 'dark' | 'system')}
                        >
                          <SelectTrigger className="h-8 w-[120px] border-none bg-muted/60 text-[11px] px-3">
                            <div className="flex items-center gap-1.5">
                              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                              <span>
                                {themeSetting === 'system'
                                  ? '跟随系统'
                                  : themeSetting === 'dark'
                                    ? '深色模式'
                                    : '浅色模式'}
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
                  <div>
                    <Suspense fallback={<RouteLoadingFallback />}>
                      <route.component />
                    </Suspense>
                  </div>
                </div>
              }
            />
          ))}
          {/* 默认重定向到第一个工具 */}
          <Route path="*" element={<Navigate to={firstPath} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
