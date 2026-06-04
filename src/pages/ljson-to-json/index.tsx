import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, FileType2 } from 'lucide-react';
import { memo, useCallback } from 'react';

import { CodeArea } from '@/components/code-area';

import {
  BlockListLayout,
  PasteInputDialog,
  RawTextDialog,
  useBlockViewer,
} from '../_shared/block-viewer';
import { type LjsonLineBlock, looksLikeLjson, type ParseResult, parseLjsonToJson } from './utils';

// ─── 单条 ljson 行 ──────────────────────────────────────────

const LjsonBlock = memo(function LjsonBlock({
  block,
  collapsed,
  onToggle,
}: {
  block: LjsonLineBlock;
  collapsed: boolean;
  onToggle: (index: number) => void;
}) {
  const handleToggle = useCallback(() => onToggle(block.index), [onToggle, block.index]);

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 mb-1">
        <button
          onClick={handleToggle}
          className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          <span>L{block.lineNo}</span>
        </button>
        {!block.valid && (
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
            解析失败
          </Badge>
        )}
      </div>
      {!collapsed && (
        <>
          {block.valid && (
            <CodeArea
              code={block.formatted ?? ''}
              language="json"
              className="min-h-0"
              codeClassName="!text-[11px]"
              showCopyButton={false}
            />
          )}
          {!block.valid && (
            <div className="space-y-1.5">
              <div className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2 font-mono">
                {block.error}
              </div>
              <CodeArea code={block.raw} language="text" className="min-h-0" codeClassName="!text-[11px]" />
            </div>
          )}
        </>
      )}
    </div>
  );
});

// ─── 静态配置（保持稳定引用，避免 hook 依赖每次变化） ─────────────

const EMPTY_RESULT: ParseResult = { blocks: [], validCount: 0, invalidCount: 0 };
const isMergeable = (b: LjsonLineBlock) => b.valid;
const successMessage = (count: number) => `已解析 ${count} 条 ljson 数据`;

const PASTE_PLACEHOLDER = `{"id":"1","type":"message","text":"hello"}\n{"id":"2","type":"topic","topic":"greeting"}`;

// ─── 主页面 ─────────────────────────────────────────────────

export default function LjsonToJsonPage() {
  const controller = useBlockViewer<LjsonLineBlock, ParseResult>({
    emptyResult: EMPTY_RESULT,
    parse: parseLjsonToJson,
    looksLike: looksLikeLjson,
    isMergeable,
    successMessage,
  });

  const { result, open, setOpen, rawText, rawTextOpen, setRawTextOpen, handleConfirmFromDialog, toggleBlock } =
    controller;
  const { blocks, validCount, invalidCount } = result;

  return (
    <>
      <PasteInputDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirmFromDialog}
        title="粘贴 ljson 原始数据"
        description="将 ljson (JSON Lines / NDJSON) 原始文本粘贴到下方，一行一个 JSON 对象"
        placeholder={PASTE_PLACEHOLDER}
      />
      <RawTextDialog
        open={rawTextOpen}
        onOpenChange={setRawTextOpen}
        rawText={rawText}
        title="ljson 原始文本"
        description="以下是导入时的 ljson 原始数据"
      />

      <BlockListLayout
        controller={controller}
        emptyIcon={FileType2}
        dataLabel="ljson"
        rawTextTitle="查看原始 ljson 文本"
        renderBlock={(block, collapsed) => (
          <LjsonBlock block={block} collapsed={collapsed} onToggle={toggleBlock} />
        )}
        renderStats={() => (
          <>
            <Badge variant="secondary" className="text-[10px] h-5">
              共 {blocks.length} 条
            </Badge>
            {validCount > 0 && (
              <Badge className="text-[10px] h-5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15">
                {validCount} 成功
              </Badge>
            )}
            {invalidCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5">
                {invalidCount} 失败
              </Badge>
            )}
          </>
        )}
      />
    </>
  );
}
