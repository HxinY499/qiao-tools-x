import { useDebounceFn } from 'ahooks';
import { CaseSensitive, ChevronDown, ChevronUp, Plus, Regex, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/utils';

import { type ConditionOp, createEmptyCondition, type FindCondition } from './query-matcher';
import { useBlockViewerSettings } from './settings-store';

interface FindBarController {
  conditions: FindCondition[];
  setConditions: (conditions: FindCondition[]) => void;
  matches: number[];
  queryError: string | null;
  activeMatchIdx: number;
  gotoMatch: (dir: 1 | -1) => void;
  setFindOpen: (open: boolean) => void;
}

/**
 * 紧凑的多条件查找面板。
 * - 第一行：[op] [输入] [Aa] [.*] [↑] [↓] [×]   ← 开关与上下条只在首行
 * - 后续行：[op] [输入] [-]
 * - 底部：[+ 添加条件]
 */
export function FindBar({ controller }: { controller: FindBarController }) {
  const { conditions, setConditions, matches, queryError, activeMatchIdx, gotoMatch, setFindOpen } = controller;
  const { caseSensitive, regexMode, setCaseSensitive, setRegexMode } = useBlockViewerSettings();
  const { t } = useTranslation('blockViewer');

  const count = matches.length;
  const current = activeMatchIdx >= 0 ? activeMatchIdx + 1 : 0;
  const hasError = !!queryError;
  const hasInput = conditions.some((c) => c.value.length > 0);
  const isOnlyRow = conditions.length <= 1;

  const handleAdd = () => {
    setConditions([...conditions, createEmptyCondition('include')]);
  };

  const handleRemove = (id: string) => {
    if (isOnlyRow) {
      // 仅剩一行时不删除，而是清空内容（保证 UI 上至少有一行）
      setConditions(conditions.map((c) => (c.id === id ? { ...c, value: '' } : c)));
      return;
    }
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const handleUpdate = (id: string, patch: Partial<Pick<FindCondition, 'op' | 'value'>>) => {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)));
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

  return (
    <div className={cn('mb-3 rounded-md border bg-card px-2 py-2 space-y-1.5', hasError && 'border-destructive/60')}>
      {conditions.map((cond, idx) => (
        <div key={cond.id} className="flex items-center gap-1.5">
          <ConditionRow
            condition={cond}
            autoFocus={idx === 0 && conditions.length === 1 && !cond.value}
            regexMode={regexMode}
            isOnlyRow={isOnlyRow}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
            onKeyDown={handleKeyDown}
          />

          {/* 第一行附带：开关 + 计数 + 上下条 + 关闭 */}
          {idx === 0 && (
            <>
              <div className="h-5 w-px bg-border shrink-0 mx-0.5" />
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  'h-7 w-7 shrink-0',
                  caseSensitive &&
                    'border border-primary/60 text-primary bg-primary/5 hover:bg-primary/10 hover:text-primary',
                )}
                onClick={() => setCaseSensitive(!caseSensitive)}
                title={t('find.caseSensitive')}
              >
                <CaseSensitive className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  'h-7 w-7 shrink-0',
                  regexMode &&
                    'border border-primary/60 text-primary bg-primary/5 hover:bg-primary/10 hover:text-primary',
                )}
                onClick={() => setRegexMode(!regexMode)}
                title={t('find.regexMode')}
              >
                <Regex className="h-3.5 w-3.5" />
              </Button>

              <span className="text-[11px] text-muted-foreground tabular-nums shrink-0 min-w-[3.25rem] text-right pl-1">
                {hasInput && !hasError ? `${current} / ${count}` : ''}
              </span>

              <div className="h-5 w-px bg-border shrink-0 mx-0.5" />

              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                disabled={count === 0}
                onClick={() => gotoMatch(-1)}
                title={t('find.prev')}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                disabled={count === 0}
                onClick={() => gotoMatch(1)}
                title={t('find.next')}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                onClick={() => setFindOpen(false)}
                title={t('find.close')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      ))}

      <div>
        <Button size="sm" variant="ghost" className="h-6 text-xs text-muted-foreground" onClick={handleAdd}>
          <Plus className="h-3 w-3 mr-1" />
          {t('find.addCondition')}
        </Button>
      </div>

      {hasError && (
        <div className="text-[11px] text-destructive font-mono pt-1 border-t border-destructive/30">{queryError}</div>
      )}
    </div>
  );
}

interface ConditionRowProps {
  condition: FindCondition;
  autoFocus: boolean;
  regexMode: boolean;
  isOnlyRow: boolean;
  onUpdate: (id: string, patch: Partial<Pick<FindCondition, 'op' | 'value'>>) => void;
  onRemove: (id: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function ConditionRow({
  condition,
  autoFocus,
  regexMode,
  isOnlyRow,
  onUpdate,
  onRemove,
  onKeyDown,
}: ConditionRowProps) {
  const { t } = useTranslation('blockViewer');
  const inputRef = useRef<HTMLInputElement>(null);
  // 输入框使用本地状态 + debounce 推到上层，减少高频重算
  const [localValue, setLocalValue] = useState(condition.value);

  // 外部 value 变化时同步（清空、reset 等场景）
  useEffect(() => {
    setLocalValue(condition.value);
  }, [condition.value]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const { run: debouncedPush } = useDebounceFn((v: string) => onUpdate(condition.id, { value: v }), { wait: 200 });

  const handleChange = (v: string) => {
    setLocalValue(v);
    debouncedPush(v);
  };

  return (
    <>
      <Select value={condition.op} onValueChange={(op) => onUpdate(condition.id, { op: op as ConditionOp })}>
        <SelectTrigger className="h-7 w-[80px] text-xs shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="include" className="text-xs">
            {t('find.opInclude')}
          </SelectItem>
          <SelectItem value="exclude" className="text-xs">
            {t('find.opExclude')}
          </SelectItem>
        </SelectContent>
      </Select>

      <Input
        ref={inputRef}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={regexMode ? t('find.placeholderRegex') : t('find.placeholderKeyword')}
        className="h-7 text-sm flex-1 min-w-0"
      />

      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(condition.id)}
        title={t('find.removeCondition')}
        disabled={isOnlyRow && !condition.value}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </>
  );
}
