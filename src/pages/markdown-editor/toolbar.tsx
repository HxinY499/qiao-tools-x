import {
  Bold,
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
  Quote,
  Strikethrough,
  Table,
} from 'lucide-react';
import { RefObject } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { TableDialog } from './table-dialog';
import { generateToc, insertAtLineStart, insertTextAtCursor, wrapSelection } from './utils';

interface ToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  content: string;
  onContentChange: (value: string, selectionStart?: number, selectionEnd?: number) => void;
}

export function Toolbar({ textareaRef, content, onContentChange }: ToolbarProps) {
  const applyAction = (
    action: (textarea: HTMLTextAreaElement) => {
      value: string;
      selectionStart: number;
      selectionEnd: number;
    },
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const result = action(textarea);
    // insertTextNative 已经通过 dispatchEvent 触发了 input 事件更新状态
    // 这里只需要通知父组件恢复光标位置
    onContentChange(result.value, result.selectionStart, result.selectionEnd);
  };

  const handleBold = () => applyAction((ta) => wrapSelection(ta, '**'));
  const handleItalic = () => applyAction((ta) => wrapSelection(ta, '*'));
  const handleStrikethrough = () => applyAction((ta) => wrapSelection(ta, '~~'));
  const handleInlineCode = () => applyAction((ta) => wrapSelection(ta, '`'));

  const handleHeading = (level: number) => {
    applyAction((ta) => insertAtLineStart(ta, '#'.repeat(level) + ' '));
  };

  const handleLink = () => {
    applyAction((ta) => {
      const start = ta.selectionStart;
      const selectedText = ta.value.substring(start, ta.selectionEnd);

      if (selectedText) {
        // 有选中文本，作为链接文本
        const text = `[${selectedText}](url)`;
        return {
          ...insertTextAtCursor(ta, text),
          selectionStart: start + selectedText.length + 3,
          selectionEnd: start + selectedText.length + 6,
        };
      } else {
        // 无选中文本，插入模板
        const text = '[链接文本](url)';
        return insertTextAtCursor(ta, text, 1, 5);
      }
    });
  };

  const handleImage = () => {
    applyAction((ta) => {
      const text = '![图片描述](url)';
      return insertTextAtCursor(ta, text, 2, 6);
    });
  };

  const handleCodeBlock = () => {
    applyAction((ta) => {
      const text = '```\n\n```';
      return insertTextAtCursor(ta, text, 4, 4);
    });
  };

  const handleQuote = () => {
    applyAction((ta) => insertAtLineStart(ta, '> '));
  };

  const handleUnorderedList = () => {
    applyAction((ta) => insertAtLineStart(ta, '- '));
  };

  const handleOrderedList = () => {
    applyAction((ta) => insertAtLineStart(ta, '1. '));
  };

  const handleInsertTable = (markdown: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const result = insertTextAtCursor(textarea, '\n' + markdown + '\n');
    onContentChange(result.value, result.selectionStart, result.selectionEnd);
  };

  const handleGenerateToc = () => {
    const toc = generateToc(content);
    if (!toc) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const result = insertTextAtCursor(textarea, toc + '\n\n');
    onContentChange(result.value, result.selectionStart, result.selectionEnd);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5 flex-wrap">
        {/* 标题 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1} onClick={() => handleHeading(1)}>
              <Heading1 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>一级标题</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1} onClick={() => handleHeading(2)}>
              <Heading2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>二级标题</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1} onClick={() => handleHeading(3)}>
              <Heading3 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>三级标题</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 文本格式 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1} onClick={handleBold}>
              <Bold className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>粗体</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1} onClick={handleItalic}>
              <Italic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>斜体</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1} onClick={handleStrikethrough}>
              <Strikethrough className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>删除线</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 代码 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1} onClick={handleInlineCode}>
              <Code className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>行内代码</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" tabIndex={-1} onClick={handleCodeBlock}>
              {'</>'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>代码块</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 链接和图片 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1} onClick={handleLink}>
              <Link className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>链接</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1} onClick={handleImage}>
              <Image className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>图片</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 列表和引用 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1} onClick={handleUnorderedList}>
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>无序列表</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1} onClick={handleOrderedList}>
              <ListOrdered className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>有序列表</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1} onClick={handleQuote}>
              <Quote className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>引用</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 表格 */}
        <Tooltip>
          <TableDialog
            trigger={
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1}>
                  <Table className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
            }
            onInsert={handleInsertTable}
          />
          <TooltipContent>插入表格</TooltipContent>
        </Tooltip>

        {/* 目录 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" tabIndex={-1} onClick={handleGenerateToc}>
              <ListTree className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>生成目录</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
