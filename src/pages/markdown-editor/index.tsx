import 'katex/dist/katex.min.css';

import {
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Globe,
  Image,
  Import,
  List,
  Maximize2,
  Menu,
  Minimize2,
  Moon,
  MoreVertical,
  Palette,
  PanelTop,
  RotateCcw,
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ResizablePanels } from '@/components/resizable-panels';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { findCommandByShortcut, getCommandExecutor } from './commands';
import { parseMarkdown } from './renderer';
import { useMarkdownEditorStore } from './store';
import { getThemesByCategory, loadThemeStyle, THEME_LIST, ThemeName } from './themes';
import { Toc } from './toc';
import { Toolbar } from './toolbar';
import {
  exportToDocx,
  exportToHtml,
  exportToImage,
  exportToMarkdown,
  exportToPdf,
  htmlToMarkdown,
  insertTextAtCursor,
} from './utils';

export default function MarkdownEditorPage() {
  const {
    content,
    previewTheme,
    previewZoom,
    showProgressBar,
    isPreviewHeaderHidden,
    setContent,
    setPreviewTheme,
    setPreviewZoom,
    setShowProgressBar,
    setPreviewHeaderHidden,
  } = useMarkdownEditorStore();

  const ZOOM_MIN = 50;
  const ZOOM_MAX = 200;
  // 按钮步进（更像 PDF 阅读器）
  const ZOOM_STEP = 10;
  // 滑杆步进（支持 75%/125% 等常用档位）
  const ZOOM_SLIDER_STEP = 5;

  const clampZoom = useCallback(
    (next: number) => {
      const rounded = Math.round(next);
      return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, rounded));
    },
    [ZOOM_MAX, ZOOM_MIN],
  );

  const applyZoom = useCallback(
    (next: number) => {
      setPreviewZoom(clampZoom(next));
    },
    [clampZoom, setPreviewZoom],
  );

  const handleZoomOut = useCallback(() => {
    applyZoom(previewZoom - ZOOM_STEP);
  }, [applyZoom, previewZoom, ZOOM_STEP]);

  const handleZoomIn = useCallback(() => {
    applyZoom(previewZoom + ZOOM_STEP);
  }, [applyZoom, previewZoom, ZOOM_STEP]);

  const handleZoomReset = useCallback(() => {
    setPreviewZoom(100);
  }, [setPreviewZoom]);

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
  const [readingProgress, setReadingProgress] = useState(0);

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

  const updateReadingProgress = useCallback(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const max = preview.scrollHeight - preview.clientHeight;
    if (max <= 0) {
      setReadingProgress(0);
      return;
    }
    const ratio = preview.scrollTop / max;
    setReadingProgress(Math.min(100, Math.max(0, Math.round(ratio * 100))));
  }, []);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    const handleScroll = () => updateReadingProgress();
    preview.addEventListener('scroll', handleScroll);
    // 初始化
    updateReadingProgress();

    return () => preview.removeEventListener('scroll', handleScroll);
  }, [previewRef, updateReadingProgress]);

  useEffect(() => {
    const timer = setTimeout(updateReadingProgress, 80);
    return () => clearTimeout(timer);
  }, [htmlContent, updateReadingProgress]);

  // ESC 键退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        setPreviewHeaderHidden(false); // 退出全屏时重置 header 状态
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, setPreviewHeaderHidden]);

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

  // 处理表格插入
  const handleTableInsert = useCallback(
    (markdown: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const result = insertTextAtCursor(textarea, markdown);
      handleSelectionChange(result.selectionStart, result.selectionEnd);
    },
    [handleSelectionChange],
  );

  // 快捷键处理（使用 capture 阶段拦截，防止其他组件响应）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const textarea = textareaRef.current;
      if (!textarea || document.activeElement !== textarea) return;

      const command = findCommandByShortcut(e);
      if (!command) return;

      // 表格命令不支持快捷键（需要弹窗选择行列）
      if (command.isTable) return;

      e.preventDefault();
      e.stopImmediatePropagation(); // 阻止所有后续监听器

      const executor = getCommandExecutor(command.id, { content, onTableInsert: handleTableInsert });
      if (!executor) return;

      const result = executor(textarea);
      if (result) {
        handleSelectionChange(result.selectionStart, result.selectionEnd);
      }
    };

    // 使用 capture: true 在捕获阶段拦截事件
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [content, handleSelectionChange, handleTableInsert]);

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
      <header className="flex items-center justify-between gap-2 px-3 py-1 border-b border-border bg-muted/30 min-w-0 h-10">
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
      {/* Header 区域 - 带动画 */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isFullscreen && isPreviewHeaderHidden ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'
        }`}
      >
        <header className="flex items-center justify-end gap-1 px-3 py-1 border-b border-border bg-muted/30 h-10">
          {/* 全屏时显示隐藏 header 按钮 */}
          {isFullscreen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPreviewHeaderHidden(true)}
                  tabIndex={-1}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>隐藏工具栏</TooltipContent>
            </Tooltip>
          )}
          {/* 设置下拉菜单 - 多级结构 */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" tabIndex={-1}>
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>设置与导出</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-48">
              {/* 导出子菜单 */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Download className="h-4 w-4 mr-2" />
                  <span>导出</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
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
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* 主题子菜单 */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="h-4 w-4 mr-2" />
                  <span>预览主题</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
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
                            <DropdownMenuSeparator />
                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">暗色主题</div>
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
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* 直接的设置选项 - 不需要子菜单 */}
              <DropdownMenuItem onClick={() => setShowProgressBar(!showProgressBar)} className="cursor-pointer">
                <div className="flex items-center space-x-2 w-full">
                  <Checkbox checked={showProgressBar} onChange={() => {}} className="pointer-events-none" />
                  <span>显示阅读进度条</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-0.5 rounded-md border border-border/50 bg-background/40 px-0.5 py-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleZoomOut}
                  disabled={previewZoom <= ZOOM_MIN}
                  tabIndex={-1}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>缩小</TooltipContent>
            </Tooltip>

            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 gap-1" tabIndex={-1}>
                      <span className="text-xs tabular-nums">{previewZoom}%</span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>缩放</TooltipContent>
              </Tooltip>
              <PopoverContent align="end" className="w-72 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium">缩放</div>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleZoomReset}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    重置
                  </Button>
                </div>
                <div className="mt-3">
                  <Slider
                    min={ZOOM_MIN}
                    max={ZOOM_MAX}
                    step={ZOOM_SLIDER_STEP}
                    value={[previewZoom]}
                    onValueChange={(v) => applyZoom(v[0] ?? 100)}
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{ZOOM_MIN}%</span>
                    <span>{ZOOM_MAX}%</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1">
                  {[50, 75, 100, 125, 150, 175, 200].map((z) => (
                    <Button
                      key={z}
                      variant={previewZoom === z ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setPreviewZoom(z)}
                    >
                      {z}%
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleZoomIn}
                  disabled={previewZoom >= ZOOM_MAX}
                  tabIndex={-1}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>放大</TooltipContent>
            </Tooltip>
          </div>
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
              <Toc htmlContent={htmlContent} previewRef={previewRef} pinned={tocPinned} onPinChange={setTocPinned} />
            </PopoverContent>
          </Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  const newFullscreen = !isFullscreen;
                  setIsFullscreen(newFullscreen);
                  if (!newFullscreen) {
                    setPreviewHeaderHidden(false); // 退出全屏时重置 header 状态
                  }
                }}
                tabIndex={-1}
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? '退出全屏 (ESC)' : '全屏预览'}</TooltipContent>
          </Tooltip>
        </header>
      </div>

      {/* 全屏时隐藏 header 后的展开按钮 */}
      <div
        className={`absolute top-3 right-3 z-10 transition-all duration-300 ease-out ${
          isFullscreen && isPreviewHeaderHidden
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full shadow-md opacity-60 hover:opacity-100 transition-opacity duration-200"
              onClick={() => setPreviewHeaderHidden(false)}
            >
              <PanelTop className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>显示工具栏</TooltipContent>
        </Tooltip>
      </div>
      {showProgressBar && (
        <div className="sticky top-0 z-10 bg-transparent">
          <div className="h-[2px] w-full bg-transparent">
            <div
              className="h-full bg-primary transition-all duration-150 ease-out"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
        </div>
      )}
      <div ref={previewRef} className="flex-1 min-h-0 min-w-0 overflow-auto custom-scrollbar group">
        <style>{`
          .markdown-body ul { list-style-type: disc; }
          .markdown-body ol { list-style-type: decimal; }
        `}</style>
        <style>{themeStyle}</style>
        <article
          className="markdown-body max-w-full overflow-x-auto"
          style={{ zoom: previewZoom / 100 }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );

  return (
    <ResizablePanels left={editorPanel} right={previewPanel} hideLeft={isFullscreen} className="h-[calc(100vh-4rem)]" />
  );
}
