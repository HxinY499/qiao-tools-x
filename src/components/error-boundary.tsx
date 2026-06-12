import { ChevronDown, Frown, Home, RotateCcw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 自定义降级 UI；不传则用内置面板 */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /**
   * 当这些 key 中任意一个发生变化时，自动重置错误状态。
   * 典型用法：传入路由 pathname —— 用户切换到别的工具时自动恢复，
   * 避免「持续性错误下手动重试反复崩溃」的死循环。
   */
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * 全局错误边界：捕获子树渲染期抛出的错误，避免整页白屏。
 *
 * 注意：React 错误边界只能捕获「渲染期 / 生命周期 / 构造函数」中的错误，
 * 无法捕获事件处理器、异步回调（setTimeout/Promise）、SSR 中的错误。
 * 那些场景需要在对应代码里 try/catch 自行处理。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 记录到控制台，便于排查；如接入监控可在此上报
    console.error('[ErrorBoundary] caught:', error, info.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // 仅在已处于错误态时检查 resetKeys 变化，避免无谓比较
    if (this.state.error === null) return;
    if (arraysChanged(prevProps.resetKeys, this.props.resetKeys)) {
      this.reset();
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return <DefaultErrorFallback error={error} reset={this.reset} />;
  }
}

/** 浅比较两个 resetKeys 数组是否有变化 */
function arraysChanged(a?: unknown[], b?: unknown[]): boolean {
  if (a === b) return false;
  if (!a || !b || a.length !== b.length) return true;
  return a.some((item, i) => !Object.is(item, b[i]));
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useTranslation();
  // 开发环境默认展开技术详情，生产环境默认收起
  const [showDetail, setShowDetail] = useState(import.meta.env.DEV);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-xl text-center animate-in fade-in zoom-in-95 duration-300">
        {/* 友好图形：柔光圆 + 拟人化表情，去掉刺眼的红色警告 */}
        <div className="relative mx-auto mb-8 h-32 w-32">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-muted/70">
            <Frown className="h-16 w-16 text-muted-foreground" strokeWidth={1.25} />
          </div>
        </div>

        {/* 温和的文案 */}
        <h2 className="text-2xl font-semibold tracking-tight">{t('errorBoundary.title')}</h2>
        <p className="mx-auto mt-3 max-w-md whitespace-pre-line text-base leading-relaxed text-muted-foreground">
          {t('errorBoundary.description')}
        </p>

        {/* 主操作 */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg" onClick={reset} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            {t('common.retry')}
          </Button>
          <Button size="lg" variant="outline" onClick={() => window.location.assign('/')} className="gap-1.5">
            <Home className="h-4 w-4" />
            {t('common.backHome')}
          </Button>
        </div>

        {/* 技术详情：默认收起，弱化处理，不抢视觉 */}
        {(error.message || error.stack) && (
          <div className="mt-8 text-left">
            <button
              type="button"
              onClick={() => setShowDetail((v) => !v)}
              className="mx-auto flex items-center gap-1 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showDetail && 'rotate-180')} />
              {t('errorBoundary.techDetail')}
            </button>
            {showDetail && (
              <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                {error.message && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive break-all">
                    {error.message}
                  </p>
                )}
                {error.stack && (
                  <pre className="max-h-48 overflow-auto custom-scrollbar rounded-lg bg-muted/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground/80 whitespace-pre-wrap break-all">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* 兜底：重试无效时再刷新整页 */}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 text-xs text-muted-foreground/50 underline underline-offset-2 transition-colors hover:text-muted-foreground"
        >
          {t('errorBoundary.refreshHint')}
        </button>
      </div>
    </div>
  );
}
