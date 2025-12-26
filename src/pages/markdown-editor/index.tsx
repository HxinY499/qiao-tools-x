import { Download, FileText, Globe, Image, Import, Maximize2, Menu, Minimize2, Moon, Palette, Sun } from 'lucide-react';
import { Marked } from 'marked';
import { useCallback, useEffect, useRef, useState } from 'react';
import { codeToHtml } from 'shiki';
import { toast } from 'sonner';

import { ResizablePanels } from '@/components/resizable-panels';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useMarkdownEditorStore } from './store';
import { getThemeLabel, loadThemeStyle, THEME_LIST, ThemeName } from './themes';
import { Toolbar } from './toolbar';
import { exportToDocx, exportToHtml, exportToImage, exportToMarkdown, exportToPdf, htmlToMarkdown } from './utils';

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

  // 供 Toolbar 调用，仅设置光标位置（内容更新由 execCommand 触发的 onChange 处理）
  const handleSelectionChange = useCallback((selectionStart: number, selectionEnd: number) => {
    const textarea = textareaRef.current;
    if (textarea) {
      pendingFocusRef.current = {
        selectionStart,
        selectionEnd,
        scrollTop: textarea.scrollTop,
      };
    }
  }, []);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const ext = file.name.split('.').pop()?.toLowerCase();
      const isHtml = ext === 'html' || ext === 'htm';

      if (isHtml) {
        setContent(htmlToMarkdown(text));
      } else {
        setContent(text);
      }
      toast.success(`已导入 ${file.name}`);
    };
    reader.onerror = () => {
      toast.error('读取文件失败');
    };
    reader.readAsText(file);

    e.target.value = '';
  };

  // 导出处理函数
  const handleExportMd = () => {
    if (!content) {
      toast.error('没有内容可导出');
      return;
    }
    exportToMarkdown(content);
    toast.success('已导出 Markdown 文件');
  };

  const handleExportHtml = () => {
    if (!content) {
      toast.error('没有内容可导出');
      return;
    }
    exportToHtml(htmlContent, themeStyle);
    toast.success('已导出 HTML 文件');
  };

  const handleExportPdf = async () => {
    if (!previewRef.current || !content) {
      toast.error('没有内容可导出');
      return;
    }
    toast.info('正在生成 PDF...');
    try {
      await exportToPdf(previewRef.current);
      toast.success('已导出 PDF 文件');
    } catch {
      toast.error('PDF 导出失败');
    }
  };

  const handleExportDocx = async () => {
    if (!content) {
      toast.error('没有内容可导出');
      return;
    }
    toast.info('正在生成 Word 文档...');
    try {
      await exportToDocx(content);
      toast.success('已导出 Word 文件');
    } catch {
      toast.error('Word 导出失败');
    }
  };

  const handleExportImage = async () => {
    if (!previewRef.current || !content) {
      toast.error('没有内容可导出');
      return;
    }
    toast.info('正在生成图片...');
    try {
      await exportToImage(previewRef.current);
      toast.success('已导出图片');
    } catch {
      toast.error('图片导出失败');
    }
  };

  const editorPanel = (
    <>
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/30 min-w-0">
        <Toolbar textareaRef={textareaRef} content={content} onSelectionChange={handleSelectionChange} />
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt,.html,.htm"
          onChange={handleImportFile}
          className="hidden"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1}>
              <Menu className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Import className="h-4 w-4 mr-2" />
                  导入
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="left">支持 .md .html .txt</TooltipContent>
            </Tooltip>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportMd} disabled={!content}>
              <Download className="h-4 w-4 mr-2" />
              导出 Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportHtml} disabled={!content}>
              <Globe className="h-4 w-4 mr-2" />
              导出 HTML
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPdf} disabled={!content}>
              <FileText className="h-4 w-4 mr-2" />
              导出 PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportDocx} disabled={!content}>
              <FileText className="h-4 w-4 mr-2" />
              导出 Word
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportImage} disabled={!content}>
              <Image className="h-4 w-4 mr-2" />
              导出图片
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="flex-1 min-h-0 min-w-0">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="在此输入 Markdown..."
          className="h-full w-full font-mono !text-xs resize-none p-4 leading-relaxed custom-scrollbar rounded-none border-0 focus-visible:ring-0"
          spellCheck={false}
        />
      </div>
    </>
  );

  const previewPanel = (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <header className="flex items-center justify-end gap-1 px-3 py-2 border-b border-border bg-muted/30">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5" tabIndex={-1}>
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
                {theme.isDark ? (
                  <Moon className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                ) : (
                  <Sun className="h-3.5 w-3.5 mr-2 text-amber-500" />
                )}
                {theme.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
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
      <div ref={previewRef} className="flex-1 min-h-0 min-w-0 overflow-auto custom-scrollbar p-4">
        <style>{themeStyle}</style>
        <article
          className="markdown-body !bg-transparent max-w-full overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );

  return (
    <ResizablePanels left={editorPanel} right={previewPanel} hideLeft={isFullscreen} className="h-[calc(100vh-4rem)]" />
  );
}
