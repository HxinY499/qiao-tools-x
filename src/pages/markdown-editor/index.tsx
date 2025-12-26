import { Maximize2, Minimize2, Palette, Upload } from 'lucide-react';
import { Marked } from 'marked';
import { useCallback, useEffect, useRef, useState } from 'react';
import { codeToHtml } from 'shiki';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useMarkdownEditorStore } from './store';
import { getThemeLabel, loadThemeStyle, THEME_LIST, ThemeName } from './themes';
import { Toolbar } from './toolbar';

// 配置 marked（不带代码高亮，后续用 shiki 处理）
const marked = new Marked();

marked.setOptions({
  gfm: true,
  breaks: true,
});

// 使用 shiki 高亮代码块
async function highlightCodeBlocks(html: string): Promise<string> {
  const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
  const codeBlockNoLangRegex = /<pre><code>([\s\S]*?)<\/code><\/pre>/g;

  const matches: { full: string; lang: string; code: string }[] = [];

  // 收集带语言标记的代码块
  let match;
  while ((match = codeBlockRegex.exec(html)) !== null) {
    matches.push({
      full: match[0],
      lang: match[1],
      code: decodeHtmlEntities(match[2]),
    });
  }

  // 收集不带语言标记的代码块
  while ((match = codeBlockNoLangRegex.exec(html)) !== null) {
    matches.push({
      full: match[0],
      lang: 'text',
      code: decodeHtmlEntities(match[1]),
    });
  }

  // 并行高亮所有代码块
  const highlightedBlocks = await Promise.all(
    matches.map(async ({ full, lang, code }) => {
      try {
        const html = await codeToHtml(code, {
          lang: lang || 'text',
          theme: 'github-dark',
        });
        return { full, html };
      } catch {
        // 如果语言不支持，使用 text
        const html = await codeToHtml(code, {
          lang: 'text',
          theme: 'github-dark',
        });
        return { full, html };
      }
    }),
  );

  // 替换原始代码块
  let result = html;
  for (const { full, html: highlightedHtml } of highlightedBlocks) {
    result = result.replace(full, highlightedHtml);
  }

  return result;
}

// 解码 HTML 实体
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export default function MarkdownEditorPage() {
  const { content, previewTheme, setContent, setPreviewTheme } = useMarkdownEditorStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isScrollingSyncRef = useRef(false);
  // 用于追踪是否需要在渲染后恢复焦点
  const pendingFocusRef = useRef<{ selectionStart: number; selectionEnd: number; scrollTop: number } | null>(null);

  // 按需加载主题样式
  const [themeStyle, setThemeStyle] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [htmlContent, setHtmlContent] = useState('<p><em>开始输入以查看预览...</em></p>');

  useEffect(() => {
    loadThemeStyle(previewTheme).then(setThemeStyle);
  }, [previewTheme]);

  // 解析 Markdown 并高亮代码
  useEffect(() => {
    if (!content) {
      setHtmlContent('<p><em>开始输入以查看预览...</em></p>');
      return;
    }

    const rawHtml = marked.parse(content) as string;

    // 异步高亮代码块
    highlightCodeBlocks(rawHtml).then(setHtmlContent);
  }, [content]);

  // ESC 键退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // 同步滚动：编辑区 -> 预览区
  const syncScrollToPreview = useCallback(() => {
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    if (!textarea || !preview || isScrollingSyncRef.current) return;

    isScrollingSyncRef.current = true;

    // 计算滚动比例
    const scrollRatio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight || 1);
    const previewScrollTop = scrollRatio * (preview.scrollHeight - preview.clientHeight);

    preview.scrollTop = previewScrollTop;

    // 防止循环触发
    requestAnimationFrame(() => {
      isScrollingSyncRef.current = false;
    });
  }, []);

  // 监听编辑区滚动
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.addEventListener('scroll', syncScrollToPreview);
    return () => textarea.removeEventListener('scroll', syncScrollToPreview);
  }, [syncScrollToPreview]);

  // 内容变化时同步滚动位置，并恢复焦点
  useEffect(() => {
    const timer = setTimeout(() => {
      syncScrollToPreview();

      // 如果有待恢复的焦点状态，恢复它
      if (pendingFocusRef.current && textareaRef.current) {
        const textarea = textareaRef.current;
        const { selectionStart, selectionEnd, scrollTop } = pendingFocusRef.current;
        textarea.focus();
        textarea.setSelectionRange(selectionStart, selectionEnd);
        textarea.scrollTop = scrollTop;
        pendingFocusRef.current = null;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [content, syncScrollToPreview]);

  // 供 Toolbar 调用的内容更新函数，会保存焦点状态
  const handleContentChange = useCallback(
    (newContent: string, selectionStart?: number, selectionEnd?: number) => {
      const textarea = textareaRef.current;
      if (textarea && selectionStart !== undefined && selectionEnd !== undefined) {
        // 保存需要恢复的焦点状态
        pendingFocusRef.current = {
          selectionStart,
          selectionEnd,
          scrollTop: textarea.scrollTop,
        };
      }
      setContent(newContent);
    },
    [setContent],
  );

  const handleImportMd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setContent(text);
        toast.success(`已导入 ${file.name}`);
      }
    };
    reader.onerror = () => {
      toast.error('读取文件失败');
    };
    reader.readAsText(file);

    // 重置 input 以便可以再次选择同一文件
    e.target.value = '';
  };

  return (
    <div className="container mx-auto p-2 lg:p-4 h-[calc(100vh-4rem)] flex flex-col gap-2 lg:gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4 flex-1 min-h-0">
        {/* 编辑器 */}
        <Card className="flex flex-col p-3 lg:p-4 gap-3 min-h-[400px] lg:min-h-0">
          <header className="flex items-center justify-between gap-2">
            <Toolbar textareaRef={textareaRef} content={content} onContentChange={handleContentChange} />
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.txt"
                onChange={handleImportMd}
                className="hidden"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => fileInputRef.current?.click()}
                    tabIndex={-1}
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>导入 MD 文件</TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* 编辑区 */}
          <div className="flex-1 min-h-0">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在此输入 Markdown..."
              className="h-full font-mono !text-xs resize-none p-3 leading-relaxed custom-scrollbar"
              spellCheck={false}
            />
          </div>
        </Card>

        {/* 预览 */}
        <Card
          className={`flex flex-col p-3 lg:p-4 min-h-[400px] lg:min-h-0 gap-3 ${
            isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none min-h-0' : ''
          }`}
        >
          <header className="flex items-center justify-end gap-1">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5" tabIndex={-1}>
                      <Palette className="h-3.5 w-3.5" />
                      <span className="text-xs">{getThemeLabel(previewTheme)}</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>切换预览主题</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                {THEME_LIST.map((theme) => (
                  <DropdownMenuItem
                    key={theme.name}
                    onClick={() => setPreviewTheme(theme.name as ThemeName)}
                    className={previewTheme === theme.name ? 'bg-accent' : ''}
                  >
                    {theme.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  tabIndex={-1}
                >
                  {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? '退出全屏 (ESC)' : '全屏预览'}</TooltipContent>
            </Tooltip>
          </header>
          <div ref={previewRef} className="flex-1 min-h-0 overflow-auto custom-scrollbar border rounded-md p-4 bg-card">
            <style>{themeStyle}</style>
            <article className="markdown-body !bg-transparent" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        </Card>
      </div>
    </div>
  );
}
