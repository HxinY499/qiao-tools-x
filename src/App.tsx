import { ChevronLeft, Menu, Moon, Sun } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { toolRoutes } from '@/router';
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
  const firstPath = toolRoutes[0]?.path ?? '/';
  const { themeSetting, effectiveTheme, setThemeSetting } = useThemeStore();
  const isDark = effectiveTheme === 'dark';

  return (
    <div className="h-screen bg-background text-foreground flex">
      {/* 左侧工具菜单 */}
      <aside
        className={cn(
          'border-r border-border/80 bg-gradient-to-b from-background/95 via-card/95 to-background/90 backdrop-blur flex flex-col transition-all duration-200 shadow-sm',
          isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none -ml-px' : 'w-64',
        )}
      >
        <div className="h-16 pl-12 border-b border-border/80 flex items-center gap-3">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">QIAO</span>
            <span className="text-sm font-semibold tracking-wide">Tools</span>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1 text-sm">
          {toolRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <NavLink
                key={route.path}
                to={route.path}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{route.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-border text-[11px] text-muted-foreground">
          <p>选择左侧工具，在右侧面板中进行操作。</p>
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
