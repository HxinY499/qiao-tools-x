import { useDebounceFn } from 'ahooks';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** FindBar 只依赖 controller 的查找相关字段，用窄接口解耦泛型 */
interface FindBarController {
  query: string;
  setQuery: (q: string) => void;
  matches: number[];
  activeMatchIdx: number;
  gotoMatch: (dir: 1 | -1) => void;
  setFindOpen: (open: boolean) => void;
}

/** 内置查找栏：在全量数据中搜索并定位到目标块（不依赖浏览器 Ctrl+F） */
export function FindBar({ controller }: { controller: FindBarController }) {
  const { query, setQuery, matches, activeMatchIdx, gotoMatch, setFindOpen } = controller;
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(query);

  // 打开时自动聚焦
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const { run: debouncedSetQuery } = useDebounceFn((q: string) => setQuery(q), { wait: 200 });

  const handleChange = (q: string) => {
    setValue(q);
    debouncedSetQuery(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      gotoMatch(e.shiftKey ? -1 : 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setFindOpen(false);
    }
  };

  const count = matches.length;
  const current = activeMatchIdx >= 0 ? activeMatchIdx + 1 : 0;

  return (
    <div className="mb-3 flex items-center gap-2 rounded-md border bg-card px-2 py-1.5">
      <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="查找内容并定位到对应块…"
        className="h-7 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
      />
      <span className="text-xs text-muted-foreground tabular-nums shrink-0 min-w-[3.5rem] text-right">
        {value.trim() ? `${current} / ${count}` : ''}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0"
        disabled={count === 0}
        onClick={() => gotoMatch(-1)}
        title="上一个 (Shift+Enter)"
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0"
        disabled={count === 0}
        onClick={() => gotoMatch(1)}
        title="下一个 (Enter)"
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0"
        onClick={() => setFindOpen(false)}
        title="关闭 (Esc)"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
