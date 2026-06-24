import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { toolRoutes } from '@/router';

import { ErrorBoundary } from './components/error-boundary';
import { ToolPage } from './tool-page';

const HomePage = lazy(() => import('@/pages/home'));

// ─── 带 Sidebar 的工具页面布局 ──────────────────────────────────
function ToolLayout() {
  const location = useLocation();

  return (
    <SidebarProvider>
      <AppSidebar />

      {/* 右侧内容区 */}
      <SidebarInset>
        {/* 工具级错误边界：单个工具崩溃时侧边栏仍可用；
            以 pathname 作 resetKey —— 切换到其他工具时自动恢复 */}
        <ErrorBoundary resetKeys={[location.pathname]}>
          <Routes>
            {toolRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={<ToolPage route={route} />} />
            ))}
            {/* 兼容老链接：原 /sse-to-json 与 /ljson-to-json 已合并到 /sse-jsonl-parser */}
            <Route path="/sse-to-json" element={<Navigate to="/sse-jsonl-parser" replace />} />
            <Route path="/ljson-to-json" element={<Navigate to="/sse-jsonl-parser" replace />} />
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
