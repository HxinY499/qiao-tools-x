import { ArrowLeft, Pin } from 'lucide-react';
import { lazy, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import { toolRoutes } from '@/router';
import { useMenuStore } from '@/store/menu';
import { cn } from '@/utils';

import { ErrorBoundary } from './components/error-boundary';
import { LanguageSwitcher } from './components/language-switcher';
import { CATEGORY_ORDER } from './constant';
import { ToolPage } from './tool-page';

const HomePage = lazy(() => import('@/pages/home'));

// ─── 带 Sidebar 的工具页面布局 ──────────────────────────────────
function ToolLayout() {
  const location = useLocation();
  const { t } = useTranslation();
  const pinnedPaths = useMenuStore((s) => s.pinnedPaths);
  const togglePin = useMenuStore((s) => s.togglePin);

  // 分组逻辑：单次遍历 + Set 查找
  const groupedRoutes = useMemo(() => {
    const pinnedSet = new Set(pinnedPaths);
    const pinnedRoutes: typeof toolRoutes = [];
    const groups: Record<string, typeof toolRoutes> = {};

    for (const route of toolRoutes) {
      if (pinnedSet.has(route.path)) {
        pinnedRoutes.push(route);
      } else {
        (groups[route.category] ??= []).push(route);
      }
    }

    return {
      pinned: pinnedRoutes,
      pinnedSet,
      categories: CATEGORY_ORDER.filter((cat) => groups[cat]?.length).map((cat) => ({
        id: cat,
        title: t(`category.${cat}`),
        routes: groups[cat],
      })),
    };
  }, [pinnedPaths, t]);

  const renderMenuItem = (route: (typeof toolRoutes)[0]) => {
    const Icon = route.icon;
    const pinned = groupedRoutes.pinnedSet.has(route.path);
    const isActive = location.pathname === route.path;
    // i18n 标题：约定每个工具的 i18n key 与 ToolKey 同名（同 path 字符串去掉前置斜杠）。
    // 第二个参数作为兜底值，万一没翻译就退回 router.ts 里的原 title。
    const title = t(`routes:${route.key}.title`, route.title);

    return (
      <SidebarMenuItem key={route.path}>
        <SidebarMenuButton asChild isActive={isActive}>
          <NavLink to={route.path}>
            <Icon />
            <span>{title}</span>
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
      <Sidebar
        collapsible="offcanvas"
        variant="floating"
        className="[&_[data-sidebar=sidebar]]:!shadow-none [&_[data-sidebar=sidebar]]:border-sidebar-border"
      >
        {/* Sidebar Header - 点击 Logo 回首页 */}
        <SidebarHeader className="border-b border-sidebar-border h-16">
          <NavLink to="/" className="group flex items-center h-14 pl-12 transition-opacity hover:opacity-80">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.3em] text-sidebar-foreground/50 font-medium">
                QIAO
              </span>
              <span className="text-base font-semibold tracking-wide text-sidebar-foreground">Tools</span>
            </div>
            <ArrowLeft className="ml-2 h-3.5 w-3.5 text-sidebar-foreground/0 transition-all duration-200 group-hover:text-sidebar-foreground/50 group-hover:-translate-x-0.5" />
          </NavLink>
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
        <SidebarFooter className="border-t border-sidebar-border gap-2">
          <LanguageSwitcher />
        </SidebarFooter>
      </Sidebar>

      {/* SidebarTrigger - 固定在左上角 */}
      <div className="fixed top-4 left-4 z-50">
        <SidebarTrigger />
      </div>

      {/* 右侧内容区 */}
      <SidebarInset>
        {/* 工具级错误边界：单个工具崩溃时侧边栏仍可用；
            以 pathname 作 resetKey —— 切换到其他工具时自动恢复 */}
        <ErrorBoundary resetKeys={[location.pathname]}>
          <Routes>
            {toolRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={<ToolPage route={route} />} />
            ))}
            {/* 未匹配的工具路径重定向到首页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}

// ─── 根组件：首页独立布局，工具页带侧边栏 ────────────────────────
function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  if (isHome) {
    return (
      <>
        <Suspense fallback={null}>
          <HomePage />
        </Suspense>
        <Toaster />
      </>
    );
  }

  return <ToolLayout />;
}

export default App;
