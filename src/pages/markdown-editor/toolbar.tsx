import {
  Bold,
  ChevronDown,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  ListTree,
  LucideIcon,
  Quote,
  Strikethrough,
  Table,
} from 'lucide-react';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { TableDialog } from './table-dialog';
import { generateToc, insertAtLineStart, insertTextAtCursor, wrapSelection } from './utils';

interface ToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  content: string;
  onSelectionChange: (selectionStart: number, selectionEnd: number) => void;
}

interface ToolbarItem {
  id: string;
  icon: LucideIcon;
  label: string;
  action: () => void;
  isTable?: boolean;
  isText?: boolean;
  text?: string;
}

interface ToolbarGroup {
  items: ToolbarItem[];
}

export function Toolbar({ textareaRef, content, onSelectionChange }: ToolbarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(Infinity);

  const applyAction = useCallback(
    (
      action: (textarea: HTMLTextAreaElement) => {
        selectionStart: number;
        selectionEnd: number;
      },
    ) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const result = action(textarea);
      onSelectionChange(result.selectionStart, result.selectionEnd);
    },
    [textareaRef, onSelectionChange],
  );

  const handleBold = useCallback(() => applyAction((ta) => wrapSelection(ta, '**')), [applyAction]);
  const handleItalic = useCallback(() => applyAction((ta) => wrapSelection(ta, '*')), [applyAction]);
  const handleStrikethrough = useCallback(() => applyAction((ta) => wrapSelection(ta, '~~')), [applyAction]);
  const handleInlineCode = useCallback(() => applyAction((ta) => wrapSelection(ta, '`')), [applyAction]);

  const handleHeading = useCallback(
    (level: number) => {
      applyAction((ta) => insertAtLineStart(ta, '#'.repeat(level) + ' '));
    },
    [applyAction],
  );

  const handleLink = useCallback(() => {
    applyAction((ta) => {
      const start = ta.selectionStart;
      const selectedText = ta.value.substring(start, ta.selectionEnd);

      if (selectedText) {
        const text = `[${selectedText}](url)`;
        return {
          ...insertTextAtCursor(ta, text),
          selectionStart: start + selectedText.length + 3,
          selectionEnd: start + selectedText.length + 6,
        };
      } else {
        const text = '[链接文本](url)';
        return insertTextAtCursor(ta, text, 1, 5);
      }
    });
  }, [applyAction]);

  const handleImage = useCallback(() => {
    applyAction((ta) => {
      const text = '![图片描述](url)';
      return insertTextAtCursor(ta, text, 2, 6);
    });
  }, [applyAction]);

  const handleCodeBlock = useCallback(() => {
    applyAction((ta) => {
      const text = '```\n\n```';
      return insertTextAtCursor(ta, text, 4, 4);
    });
  }, [applyAction]);

  const handleQuote = useCallback(() => {
    applyAction((ta) => insertAtLineStart(ta, '> '));
  }, [applyAction]);

  const handleUnorderedList = useCallback(() => {
    applyAction((ta) => insertAtLineStart(ta, '- '));
  }, [applyAction]);

  const handleOrderedList = useCallback(() => {
    applyAction((ta) => insertAtLineStart(ta, '1. '));
  }, [applyAction]);

  const handleInsertTable = useCallback(
    (markdown: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const result = insertTextAtCursor(textarea, '\n' + markdown + '\n');
      onSelectionChange(result.selectionStart, result.selectionEnd);
    },
    [textareaRef, onSelectionChange],
  );

  const handleGenerateToc = useCallback(() => {
    const toc = generateToc(content);
    if (!toc) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const result = insertTextAtCursor(textarea, toc + '\n\n');
    onSelectionChange(result.selectionStart, result.selectionEnd);
  }, [content, textareaRef, onSelectionChange]);

  // 定义所有工具按钮
  const toolbarGroups: ToolbarGroup[] = [
    {
      items: [
        { id: 'h1', icon: Heading1, label: '一级标题', action: () => handleHeading(1) },
        { id: 'h2', icon: Heading2, label: '二级标题', action: () => handleHeading(2) },
        { id: 'h3', icon: Heading3, label: '三级标题', action: () => handleHeading(3) },
      ],
    },
    {
      items: [
        { id: 'bold', icon: Bold, label: '粗体', action: handleBold },
        { id: 'italic', icon: Italic, label: '斜体', action: handleItalic },
        { id: 'strikethrough', icon: Strikethrough, label: '删除线', action: handleStrikethrough },
      ],
    },
    {
      items: [
        { id: 'inlineCode', icon: Code, label: '行内代码', action: handleInlineCode },
        { id: 'codeBlock', icon: Code, label: '代码块', action: handleCodeBlock, isText: true, text: '</>' },
      ],
    },
    {
      items: [
        { id: 'link', icon: Link, label: '链接', action: handleLink },
        { id: 'image', icon: Image, label: '图片', action: handleImage },
      ],
    },
    {
      items: [
        { id: 'ul', icon: List, label: '无序列表', action: handleUnorderedList },
        { id: 'ol', icon: ListOrdered, label: '有序列表', action: handleOrderedList },
        { id: 'quote', icon: Quote, label: '引用', action: handleQuote },
      ],
    },
    {
      items: [
        { id: 'table', icon: Table, label: '插入表格', action: () => {}, isTable: true },
        { id: 'toc', icon: ListTree, label: '生成目录', action: handleGenerateToc },
      ],
    },
  ];

  // 扁平化所有项目（包括分隔符）
  const allItems: (ToolbarItem | 'separator')[] = [];
  toolbarGroups.forEach((group, groupIndex) => {
    group.items.forEach((item) => allItems.push(item));
    if (groupIndex < toolbarGroups.length - 1) {
      allItems.push('separator');
    }
  });

  // 计算可见数量
  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const calculateVisibleCount = () => {
      const containerWidth = container.offsetWidth;
      const moreButtonWidth = moreButtonRef.current?.offsetWidth || 0;
      const availableWidth = containerWidth - moreButtonWidth;

      const children = measure.children;
      let totalWidth = 0;
      let count = 0;

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const width = child.offsetWidth;

        if (totalWidth + width <= availableWidth) {
          totalWidth += width;
          count++;
        } else {
          break;
        }
      }

      // 如果所有按钮都能显示，不需要展开按钮
      if (count === allItems.length) {
        setVisibleCount(Infinity);
      } else {
        setVisibleCount(count);
      }
    };

    const observer = new ResizeObserver(calculateVisibleCount);
    observer.observe(container);

    calculateVisibleCount();

    return () => observer.disconnect();
  }, [allItems.length]);

  const visibleItems = visibleCount === Infinity ? allItems : allItems.slice(0, visibleCount);
  const overflowItems =
    visibleCount === Infinity ? [] : allItems.slice(visibleCount).filter((item) => item !== 'separator');

  const renderButton = (item: ToolbarItem, inDropdown = false) => {
    if (item.isTable) {
      if (inDropdown) {
        return (
          <DropdownMenuItem key={item.id} onSelect={(e) => e.preventDefault()}>
            <TableDialog
              trigger={
                <div className="flex items-center w-full">
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </div>
              }
              onInsert={handleInsertTable}
            />
          </DropdownMenuItem>
        );
      }
      return (
        <Tooltip key={item.id}>
          <TableDialog
            trigger={
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1}>
                  <item.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
            }
            onInsert={handleInsertTable}
          />
          <TooltipContent>{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    if (inDropdown) {
      return (
        <DropdownMenuItem key={item.id} onClick={item.action}>
          <item.icon className="h-4 w-4 mr-2" />
          {item.label}
        </DropdownMenuItem>
      );
    }

    if (item.isText) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" tabIndex={-1} onClick={item.action}>
              {item.text}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Tooltip key={item.id}>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1} onClick={item.action}>
            <item.icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div ref={containerRef} className="relative flex-1 min-w-0 overflow-hidden">
        {/* 隐藏的测量容器 */}
        <div
          ref={measureRef}
          className="flex items-center gap-0.5 absolute left-0 top-0 invisible pointer-events-none whitespace-nowrap"
          aria-hidden="true"
        >
          {allItems.map((item, index) =>
            item === 'separator' ? (
              <Separator key={`sep-${index}`} orientation="vertical" className="h-6 mx-1" />
            ) : (
              <div key={item.id} className="inline-flex">
                {item.isText ? (
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" tabIndex={-1}>
                    {item.text}
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1}>
                    <item.icon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ),
          )}
        </div>

        {/* 隐藏的展开按钮测量 */}
        <div ref={moreButtonRef} className="absolute left-0 top-0 invisible pointer-events-none" aria-hidden="true">
          <Button variant="ghost" size="icon" className="h-8 w-8 ml-0.5" tabIndex={-1}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* 可见的工具栏 */}
        <div className="flex items-center gap-0.5">
          {visibleItems.map((item, index) =>
            item === 'separator' ? (
              <Separator key={`sep-${index}`} orientation="vertical" className="h-6 mx-1" />
            ) : (
              renderButton(item)
            ),
          )}

          {/* 展开按钮 */}
          {overflowItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-0.5" tabIndex={-1}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {(overflowItems as ToolbarItem[]).map((item) => renderButton(item, true))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
