import { HelpCircle, Moon, Pin, Sun } from 'lucide-react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
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
  const location = useLocation();
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
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        {/* Sidebar Header */}
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex flex-col justify-center h-14 pl-12">
            <span className="text-[10px] uppercase tracking-[0.3em] text-sidebar-foreground/50 font-medium">QIAO</span>
            <span className="text-base font-semibold tracking-wide text-sidebar-foreground">Tools</span>
          </div>
        </SidebarHeader>

        {/* Sidebar Content */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {sortedRoutes.map((route) => {
                  const Icon = route.icon;
                  const pinned = isPinned(route.path);
                  const isActive = location.pathname === route.path;
                  return (
                    <SidebarMenuItem key={route.path}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <NavLink to={route.path}>
                          <Icon />
                          <span>{route.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        showOnHover={!pinned}
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(route.path);
                        }}
                        className={cn(pinned && 'text-sidebar-accent-foreground')}
                        aria-label={pinned ? '取消置顶' : '置顶'}
                      >
                        <Pin className={cn('h-3.5 w-3.5 transition-transform', pinned && 'fill-current')} />
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Sidebar Footer */}
        <SidebarFooter className="border-t border-sidebar-border">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-[10px] text-sidebar-foreground/60 cursor-help">
                  <HelpCircle className="h-3 w-3 shrink-0" />
                  <span className="line-clamp-1">置顶数据存储说明</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px] text-xs">
                <p>工具置顶数据保存在浏览器本地存储中，清除浏览器数据会导致置顶信息丢失。</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </SidebarFooter>

        {/* Sidebar Rail - 提供拖拽交互 */}
        <SidebarRail />
      </Sidebar>

      {/* SidebarTrigger - 固定在左上角 */}
      <div className="fixed top-4 left-4 z-50">
        <SidebarTrigger />
      </div>

      {/* 右侧内容区 */}
      <SidebarInset>
        <Routes>
          {toolRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <div className="flex flex-col min-h-screen">
                  {/* 页面 Header */}
                  <header className="h-16 px-6 flex items-center sticky top-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
                    {/* 预留 SidebarTrigger 的空间 */}
                    <div className="w-10" />
                    <div className="flex items-center flex-1">
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

                  {/* 页面内容 */}
                  <div className="flex-1">
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
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
