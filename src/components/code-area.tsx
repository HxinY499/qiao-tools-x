import { Check, Copy } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/store/theme';
import { cn } from '@/utils';

// 尽量保持通用：只关心字符串代码本身，不关心具体业务含义
type CodeAreaProps = {
  // 面板标题（左上角文案），默认 "Code"
  title?: string;
  // 要展示和复制的代码字符串
  code: string;
  // shiki 使用的语言标识，例如 "css"、"ts"，默认 "text"
  language?: string;
  // 外层容器额外样式，控制整个卡片的布局/尺寸
  className?: string;
  // 代码滚动区域额外样式，适合调整字体大小、行高等
  codeClassName?: string;
  // 代码区域内联样式，例如传入滚动条相关 CSS 变量
  codeStyle?: CSSProperties;
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * 代码展示卡片，支持语法高亮、复制
 */
export function CodeArea({ title, code, language = 'text', className, codeClassName, codeStyle }: CodeAreaProps) {
  const { effectiveTheme } = useThemeStore();
  const [highlightedHtml, setHighlightedHtml] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!code) {
      setHighlightedHtml('');
      setCopied(false);
      return;
    }

    import('shiki')
      .then(({ codeToHtml }) => {
        const themeName = effectiveTheme === 'dark' ? 'dark-plus' : 'github-light';
        return codeToHtml(code, { lang: language, theme: themeName });
      })
      .then((html) => {
        if (!cancelled) {
          setHighlightedHtml(html);
        }
      })
      .catch((error) => {
        console.error('Failed to highlight code with shiki', error);
        if (!cancelled) {
          setHighlightedHtml('');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code, language, effectiveTheme]);

  // 点击右上角按钮复制代码，并短暂显示对勾反馈，提升可感知性
  function handleCopy() {
    if (!code || !navigator.clipboard || !navigator.clipboard.writeText) return;
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => {
          setCopied(false);
        }, 1600);
      })
      .catch((error) => {
        console.error('Failed to copy code', error);
      });
  }

  const containerClassName = cn('rounded-lg  flex flex-col gap-2 min-h-[180px]', className);

  const contentClassName = cn(
    'code-area text-[11px] font-mono border rounded-md bg-background/80 h-full overflow-auto px-3 py-2 dark:bg-[#1E1E1E]',
    codeClassName,
  );

  const fallbackHtml = `<pre><code>${escapeHtml(code)}</code></pre>`;

  return (
    <div className={containerClassName}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{title}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-4 w-4 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          disabled={!code}
          aria-label={copied ? '复制成功' : '复制代码'}
        >
          {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
        </Button>
      </div>
      <div className="relative flex-1">
        <div
          className={contentClassName}
          style={codeStyle}
          dangerouslySetInnerHTML={{ __html: highlightedHtml || fallbackHtml }}
        />
      </div>
    </div>
  );
}
