import { Download, FileText, Globe, Image, Import, List, Maximize2, Menu, Minimize2, Moon, Palette, Sun } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ResizablePanels } from '@/components/resizable-panels';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { parseMarkdown } from './renderer';
import { useMarkdownEditorStore } from './store';
import { getThemeLabel, getThemesByCategory, loadThemeStyle, THEME_LIST, ThemeName } from './themes';
import { Toc } from './toc';
import { Toolbar } from './toolbar';
import { exportToDocx, exportToHtml, exportToImage, exportToMarkdown, exportToPdf, htmlToMarkdown } from './utils';

export default function MarkdownEditorPage() {
  const { content, previewTheme, setContent, setPreviewTheme } = useMarkdownEditorStore();

  // 获取当前主题是否为暗色主题
  const isDarkTheme = THEME_LIST.find((t) => t.name === previewTheme)?.isDark || false;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isScrollingSyncRef = useRef(false);
  // 用于追踪是否需要在渲染后恢复焦点
  const pendingFocusRef = useRef<{ selectionStart: number; selectionEnd: number; scrollTop: number } | null>(null);

  // 按需加载主题样式
  const [themeStyle, setThemeStyle] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [tocPinned, setTocPinned] = useState(false);
  const [htmlContent, setHtmlContent] = useState('<p><em>开始输入以查看预览...</em></p>');

  useEffect(() => {
    loadThemeStyle(previewTheme).then(setThemeStyle);
  }, [previewTheme]);

  // 解析 Markdown 并高亮代码
  // 依赖 themeStyle 而非 previewTheme，确保 CSS 已应用到 DOM 后再渲染 mermaid
  useEffect(() => {
    // 等待 themeStyle 加载完成
    if (!themeStyle) return;

    const processMarkdown = async () => {
      // 使用 requestAnimationFrame 确保 CSS 已渲染到 DOM
      requestAnimationFrame(async () => {
        const html = await parseMarkdown(content);
        setHtmlContent(html);
      });
    };

    processMarkdown();
  }, [content, themeStyle]);

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
      await exportToPdf(previewRef.current, isDarkTheme);
      toast.success('已导出 PDF 文件');
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
      await exportToImage(previewRef.current, isDarkTheme);
      toast.success('已导出图片');
    } catch (err) {
      console.error(err);
      toast.error('图片导出失败');
    }
  };

  const editorPanel = (
    <>
      <header className="flex items-center justify-between gap-2 px-3 py-1 border-b border-border bg-muted/30 min-w-0">
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
            <Button variant="ghost" size="icon" className="h-7 w-7" tabIndex={-1}>
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
      <header className="flex items-center justify-end gap-1 px-3 py-1 border-b border-border bg-muted/30">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5" tabIndex={-1}>
                  <Palette className="h-3.5 w-3.5" />
                  <span className="text-xs">{getThemeLabel(previewTheme)}</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>切换预览主题</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            {(() => {
              const { light, dark } = getThemesByCategory();
              return (
                <>
                  {/* 亮色主题 */}
                  {light.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">亮色主题</div>
                      {light.map((theme) => (
                        <DropdownMenuItem
                          key={theme.name}
                          onClick={() => setPreviewTheme(theme.name as ThemeName)}
                          className={previewTheme === theme.name ? 'bg-accent' : ''}
                        >
                          <Sun className="h-3.5 w-3.5 mr-2 text-amber-500" />
                          {theme.label}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  {/* 暗色主题 */}
                  {dark.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-1">暗色主题</div>
                      {dark.map((theme) => (
                        <DropdownMenuItem
                          key={theme.name}
                          onClick={() => setPreviewTheme(theme.name as ThemeName)}
                          className={previewTheme === theme.name ? 'bg-accent' : ''}
                        >
                          <Moon className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                          {theme.label}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </>
              );
            })()}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5" tabIndex={-1}>
                  <Download className="h-3.5 w-3.5" />
                  <span className="text-xs">导出</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>导出选项</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
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
        <Popover open={tocOpen} onOpenChange={(open) => !tocPinned && setTocOpen(open)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  tabIndex={-1}
                  onClick={() => {
                    if (tocPinned) {
                      setTocPinned(false);
                      setTocOpen(false);
                    } else {
                      setTocOpen(!tocOpen);
                    }
                  }}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>目录大纲</TooltipContent>
          </Tooltip>
          <PopoverContent align="end" className="w-64 p-0 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
            <Toc
              htmlContent={htmlContent}
              previewRef={previewRef}
              pinned={tocPinned}
              onPinChange={setTocPinned}
            />
          </PopoverContent>
        </Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsFullscreen(!isFullscreen)}
              tabIndex={-1}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isFullscreen ? '退出全屏 (ESC)' : '全屏预览'}</TooltipContent>
        </Tooltip>
      </header>
      <div ref={previewRef} className="flex-1 min-h-0 min-w-0 overflow-auto custom-scrollbar">
        <style>{themeStyle}</style>
        <article
          className="markdown-body max-w-full overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );

  return (
    <ResizablePanels left={editorPanel} right={previewPanel} hideLeft={isFullscreen} className="h-[calc(100vh-4rem)]" />
  );
}
