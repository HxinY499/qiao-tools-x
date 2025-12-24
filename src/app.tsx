import { HelpCircle, Pin } from 'lucide-react';
import { useMemo } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toolRoutes } from '@/router';
import { useMenuStore } from '@/store/menu';
import { cn } from '@/utils';

import { CATEGORY_LABELS, CATEGORY_ORDER } from './constant';
import { ToolPage } from './tool-page';

function App() {
  const location = useLocation();
  const { pinnedPaths, togglePin, isPinned } = useMenuStore();

  // 分组逻辑
  const groupedRoutes = useMemo(() => {
    // 1. 先找出所有置顶的工具，它们不参与后续的分类展示
    const pinnedRoutes = toolRoutes.filter((route) => pinnedPaths.includes(route.path));

    // 2. 找出未置顶的工具，并按 category 分组
    const unpinnedRoutes = toolRoutes.filter((route) => !pinnedPaths.includes(route.path));
    const groups: Record<string, typeof toolRoutes> = {};

    unpinnedRoutes.forEach((route) => {
      const category = route.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(route);
    });

    return {
      pinned: pinnedRoutes,
      categories: CATEGORY_ORDER.filter((cat) => groups[cat] && groups[cat].length > 0).map((cat) => ({
        id: cat,
        title: CATEGORY_LABELS[cat],
        routes: groups[cat],
      })),
    };
  }, [pinnedPaths]);

  // 计算默认跳转路径：如果有置顶，跳转第一个置顶；否则跳转第一个分类的第一个工具
  const firstPath =
    groupedRoutes.pinned.length > 0
      ? groupedRoutes.pinned[0].path
      : (groupedRoutes.categories[0]?.routes[0]?.path ?? '/');

  const renderMenuItem = (route: (typeof toolRoutes)[0]) => {
    const Icon = route.icon;
    const pinned = isPinned(route.path);
    const isActive = location.pathname === route.path;

    return (
      <SidebarMenuItem key={route.path}>
        <SidebarMenuButton asChild isActive={isActive}>
          <NavLink to={route.path}>
            <Icon />
            <span>{route.title}</span>
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
  };

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
        <SidebarContent className="custom-scrollbar">
          {/* 置顶分组 - 仅当有置顶项时显示 */}
          {groupedRoutes.pinned.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>置顶工具</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{groupedRoutes.pinned.map((route) => renderMenuItem(route))}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* 常规分类分组 */}
          {groupedRoutes.categories.map((category) => (
            <SidebarGroup key={category.id}>
              <SidebarGroupLabel>{category.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{category.routes.map((route) => renderMenuItem(route))}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
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
        <Routes key={location.pathname}>
          {toolRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={<ToolPage route={route} />} />
          ))}
          {/* 默认重定向到第一个工具 */}
          <Route path="*" element={<Navigate to={firstPath} replace />} />
        </Routes>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}

export default App;
