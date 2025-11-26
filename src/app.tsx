import { HelpCircle, Pin } from 'lucide-react';
import { useMemo } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';

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
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toolRoutes } from '@/router';
import { useMenuStore } from '@/store/menu';
import { cn } from '@/utils';

import { ToolPage } from './tool-page';

function App() {
  const location = useLocation();
  const { pinnedPaths, togglePin, isPinned } = useMenuStore();

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
        <SidebarHeader className="border-b border-sidebar-border h-16">
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
      </Sidebar>

      {/* SidebarTrigger - 固定在左上角 */}
      <div className="fixed top-4 left-4 z-50">
        <SidebarTrigger />
      </div>

      {/* 右侧内容区 */}
      <SidebarInset>
        <Routes>
          {toolRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={<ToolPage route={route} />} />
          ))}
          {/* 默认重定向到第一个工具 */}
          <Route path="*" element={<Navigate to={firstPath} replace />} />
        </Routes>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
