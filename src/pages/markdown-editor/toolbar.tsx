import { ChevronDown } from 'lucide-react';
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

import {
  CHART_TEMPLATES,
  CommandItem,
  FLAT_ITEMS_WITH_SEPARATOR,
  FlatItem,
  formatShortcut,
  getCommandExecutor,
} from './commands';
import { TableDialog } from './table-dialog';
import { insertTextAtCursor } from './utils';

interface ToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  content: string;
  onSelectionChange: (selectionStart: number, selectionEnd: number) => void;
}

export function Toolbar({ textareaRef, content, onSelectionChange }: ToolbarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(Infinity);

  const handleInsertTable = useCallback(
    (markdown: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const result = insertTextAtCursor(textarea, '\n' + markdown + '\n');
      onSelectionChange(result.selectionStart, result.selectionEnd);
    },
    [textareaRef, onSelectionChange],
  );

  const handleInsertChart = useCallback(
    (template: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const result = insertTextAtCursor(textarea, '\n' + template + '\n');
      onSelectionChange(result.selectionStart, result.selectionEnd);
    },
    [textareaRef, onSelectionChange],
  );

  const executeCommand = useCallback(
    (commandId: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const executor = getCommandExecutor(commandId, { content, onTableInsert: handleInsertTable });
      if (!executor) return;

      const result = executor(textarea);
      if (result) {
        onSelectionChange(result.selectionStart, result.selectionEnd);
      }
    },
    [textareaRef, content, onSelectionChange, handleInsertTable],
  );

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

      if (count === FLAT_ITEMS_WITH_SEPARATOR.length) {
        setVisibleCount(Infinity);
      } else {
        setVisibleCount(count);
      }
    };

    const observer = new ResizeObserver(calculateVisibleCount);
    observer.observe(container);
    calculateVisibleCount();

    return () => observer.disconnect();
  }, []);

  const visibleItems =
    visibleCount === Infinity ? FLAT_ITEMS_WITH_SEPARATOR : FLAT_ITEMS_WITH_SEPARATOR.slice(0, visibleCount);
  const overflowItems =
    visibleCount === Infinity
      ? []
      : (FLAT_ITEMS_WITH_SEPARATOR.slice(visibleCount).filter((item) => item !== 'separator') as CommandItem[]);

  const renderButton = (item: CommandItem, inDropdown = false) => {
    const shortcutText = item.shortcut ? formatShortcut(item.shortcut) : undefined;

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
                <Button variant="ghost" size="icon" className="h-7 w-7" tabIndex={-1}>
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

    if (item.isChart) {
      if (inDropdown) {
        return CHART_TEMPLATES.map((chart) => (
          <DropdownMenuItem key={chart.id} onClick={() => handleInsertChart(chart.template)}>
            <chart.icon className="h-4 w-4 mr-2" />
            {chart.label}
          </DropdownMenuItem>
        ));
      }
      return (
        <DropdownMenu key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" tabIndex={-1}>
                  <item.icon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>{item.label}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start">
            {CHART_TEMPLATES.map((chart) => (
              <DropdownMenuItem key={chart.id} onClick={() => handleInsertChart(chart.template)}>
                <chart.icon className="h-4 w-4 mr-2" />
                {chart.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    if (inDropdown) {
      return (
        <DropdownMenuItem key={item.id} onClick={() => executeCommand(item.id)}>
          <item.icon className="h-4 w-4 mr-2" />
          <span className="flex-1">{item.label}</span>
          {shortcutText && <span className="ml-auto text-xs text-muted-foreground">{shortcutText}</span>}
        </DropdownMenuItem>
      );
    }

    if (item.isText) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              tabIndex={-1}
              onClick={() => executeCommand(item.id)}
            >
              {item.text}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {item.label}
            {shortcutText && <span className="ml-2 text-muted-foreground">{shortcutText}</span>}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Tooltip key={item.id}>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" tabIndex={-1} onClick={() => executeCommand(item.id)}>
            <item.icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {item.label}
          {shortcutText && <span className="ml-2 text-muted-foreground">{shortcutText}</span>}
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderMeasureItem = (item: FlatItem, index: number) => {
    if (item === 'separator') {
      return <Separator key={`sep-${index}`} orientation="vertical" className="h-5 mx-1" />;
    }
    return (
      <div key={item.id} className="inline-flex">
        {item.isText ? (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" tabIndex={-1}>
            {item.text}
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-7 w-7" tabIndex={-1}>
            <item.icon className="h-4 w-4" />
          </Button>
        )}
      </div>
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
          {FLAT_ITEMS_WITH_SEPARATOR.map(renderMeasureItem)}
        </div>

        {/* 隐藏的展开按钮测量 */}
        <div ref={moreButtonRef} className="absolute left-0 top-0 invisible pointer-events-none" aria-hidden="true">
          <Button variant="ghost" size="icon" className="h-7 w-7 ml-0.5" tabIndex={-1}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* 可见的工具栏 */}
        <div className="flex items-center gap-0.5">
          {visibleItems.map((item, index) =>
            item === 'separator' ? (
              <Separator key={`sep-${index}`} orientation="vertical" className="h-5 mx-1" />
            ) : (
              renderButton(item)
            ),
          )}

          {/* 展开按钮 */}
          {overflowItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 ml-0.5" tabIndex={-1}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {overflowItems.map((item) => renderButton(item, true))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
