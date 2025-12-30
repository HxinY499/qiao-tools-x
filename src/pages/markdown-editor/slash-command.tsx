import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/utils';

import { ALL_COMMANDS, CommandItem, filterCommands, getCommandExecutor } from './commands';

interface SlashCommandProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  content: string;
  onSelectionChange: (selectionStart: number, selectionEnd: number) => void;
  onTableInsert: (markdown: string) => void;
}

export function useSlashCommand({ textareaRef, content, onSelectionChange, onTableInsert }: SlashCommandProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filter, setFilter] = useState('');
  const slashStartRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 删除斜杠命令文本
  const removeSlashCommand = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || slashStartRef.current === null) return;

    const start = slashStartRef.current;
    const end = textarea.selectionStart;

    textarea.setSelectionRange(start, end);
    document.execCommand('delete', false);
  }, [textareaRef]);

  // 执行命令
  const runCommand = useCallback(
    (commandId: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      removeSlashCommand();

      const executor = getCommandExecutor(commandId, { content, onTableInsert });
      if (!executor) return;

      const result = executor(textarea);
      if (result) {
        onSelectionChange(result.selectionStart, result.selectionEnd);
      }
    },
    [textareaRef, content, onSelectionChange, onTableInsert, removeSlashCommand],
  );

  // 过滤命令
  const filteredCommands = filterCommands(ALL_COMMANDS, filter);

  // 关闭菜单
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setFilter('');
    setSelectedIndex(0);
    slashStartRef.current = null;
  }, []);

  // 执行选中的命令
  const executeCommand = useCallback(
    (index: number) => {
      const command = filteredCommands[index];
      if (command) {
        runCommand(command.id);
        closeMenu();
      }
    },
    [filteredCommands, runCommand, closeMenu],
  );

  // 计算菜单位置
  const calculatePosition = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const mirror = document.createElement('div');
    const style = getComputedStyle(textarea);

    mirror.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow: hidden;
      font-family: ${style.fontFamily};
      font-size: ${style.fontSize};
      line-height: ${style.lineHeight};
      padding: ${style.padding};
      width: ${textarea.clientWidth}px;
    `;

    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
    mirror.textContent = textBeforeCursor;

    const cursorSpan = document.createElement('span');
    cursorSpan.textContent = '|';
    mirror.appendChild(cursorSpan);

    document.body.appendChild(mirror);

    const textareaRect = textarea.getBoundingClientRect();
    const cursorRect = cursorSpan.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();

    const relativeTop = cursorRect.top - mirrorRect.top;
    const relativeLeft = cursorRect.left - mirrorRect.left;

    document.body.removeChild(mirror);

    const top = textareaRect.top + relativeTop - textarea.scrollTop + 24;
    const left = textareaRect.left + relativeLeft;

    setPosition({ top, left });
  }, [textareaRef]);

  // 处理键盘输入
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case 'Enter':
          e.preventDefault();
          executeCommand(selectedIndex);
          break;
        case 'Escape':
          e.preventDefault();
          closeMenu();
          break;
        case 'Tab':
          e.preventDefault();
          executeCommand(selectedIndex);
          break;
      }
    },
    [isOpen, filteredCommands.length, selectedIndex, executeCommand, closeMenu],
  );

  // 处理输入变化
  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPos);

    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

    if (lastSlashIndex !== -1) {
      const charBeforeSlash = textBeforeCursor[lastSlashIndex - 1];
      const isValidSlash = lastSlashIndex === 0 || charBeforeSlash === '\n' || charBeforeSlash === ' ';

      if (isValidSlash) {
        const filterText = textBeforeCursor.substring(lastSlashIndex + 1);

        if (filterText.includes(' ') || filterText.includes('\n')) {
          if (isOpen) closeMenu();
          return;
        }

        slashStartRef.current = lastSlashIndex;
        setFilter(filterText);
        setSelectedIndex(0);

        if (!isOpen) {
          setIsOpen(true);
          calculatePosition();
        }
        return;
      }
    }

    if (isOpen) {
      closeMenu();
    }
  }, [textareaRef, isOpen, closeMenu, calculatePosition]);

  // 监听键盘事件
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('input', handleInput);

    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('input', handleInput);
    };
  }, [textareaRef, handleKeyDown, handleInput]);

  // 点击外部关闭菜单
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeMenu]);

  // 滚动选中项到可视区域
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const selectedItem = menuRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    selectedItem?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, selectedIndex]);

  const SlashCommandMenu = isOpen ? (
    <div
      ref={menuRef}
      className="fixed z-50 w-64 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-1">
        {filteredCommands.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">没有匹配的命令</div>
        ) : (
          filteredCommands.map((cmd: CommandItem, index: number) => (
            <button
              key={cmd.id}
              data-index={index}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
              )}
              onClick={() => executeCommand(index)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <cmd.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{cmd.label}</div>
                <div className="text-xs text-muted-foreground truncate">{cmd.description}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  ) : null;

  return { SlashCommandMenu };
}
