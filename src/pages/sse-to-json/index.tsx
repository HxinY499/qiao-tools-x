import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Radio } from 'lucide-react';
import { memo, useCallback } from 'react';

import { CodeArea } from '@/components/code-area';

import {
  BlockListLayout,
  PasteInputDialog,
  RawTextDialog,
  useBlockViewer,
} from '../_shared/block-viewer';
import { looksLikeSse, type ParseResult, parseSseToJson, type SseDataBlock } from './utils';

// ─── 单条 SSE 块 ────────────────────────────────────────────

const SseBlock = memo(function SseBlock({
  block,
  collapsed,
  onToggle,
}: {
  block: SseDataBlock;
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
          <span>#{block.index + 1}</span>
        </button>
        {block.event && (
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">
            {block.event}
          </Badge>
        )}
        {block.id && (
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono text-muted-foreground">
            id: {block.id}
          </Badge>
        )}
        {block.type === 'signal' && (
          <Badge className="text-[10px] h-4 px-1.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15">
            {block.raw}
          </Badge>
        )}
        {block.type === 'text' && !block.valid && (
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
            解析失败
          </Badge>
        )}
      </div>
      {!collapsed && (
        <>
          {block.type === 'json' && (
            <CodeArea
              code={block.formatted ?? ''}
              language="json"
              className="min-h-0"
              codeClassName="!text-[11px]"
              showCopyButton={false}
            />
          )}
          {block.type === 'signal' && (
            <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-md px-3 py-2 font-mono">
              流信号: {block.raw}
            </div>
          )}
          {block.type === 'text' && !block.valid && (
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

const EMPTY_RESULT: ParseResult = { blocks: [], validCount: 0, invalidCount: 0, signalCount: 0 };
const isMergeable = (b: SseDataBlock) => b.type === 'json' && b.valid;
const successMessage = (count: number) => `已解析 ${count} 条 SSE 数据`;

const PASTE_PLACEHOLDER = `event: message\ndata: {"key": "value"}\n\nevent: message\ndata: {"another": "object"}`;

// ─── 主页面 ─────────────────────────────────────────────────

export default function SseToJsonPage() {
  const controller = useBlockViewer<SseDataBlock, ParseResult>({
    emptyResult: EMPTY_RESULT,
    parse: parseSseToJson,
    looksLike: looksLikeSse,
    isMergeable,
    successMessage,
  });

  const { result, open, setOpen, rawText, rawTextOpen, setRawTextOpen, handleConfirmFromDialog, toggleBlock } =
    controller;
  const { blocks, validCount, invalidCount, signalCount } = result;

  return (
    <>
      <PasteInputDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirmFromDialog}
        title="粘贴 SSE 原始数据"
        description="将 SSE (Server-Sent Events) 原始文本粘贴到下方，点击解析后提取所有 data 字段"
        placeholder={PASTE_PLACEHOLDER}
      />
      <RawTextDialog
        open={rawTextOpen}
        onOpenChange={setRawTextOpen}
        rawText={rawText}
        title="SSE 原始文本"
        description="以下是导入时的 SSE 原始数据"
      />

      <BlockListLayout
        controller={controller}
        emptyIcon={Radio}
        dataLabel="SSE"
        rawTextTitle="查看原始 SSE 文本"
        renderBlock={(block, collapsed) => (
          <SseBlock block={block} collapsed={collapsed} onToggle={toggleBlock} />
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
            {signalCount > 0 && (
              <Badge className="text-[10px] h-5 bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15">
                {signalCount} 信号
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
