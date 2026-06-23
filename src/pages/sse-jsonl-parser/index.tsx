import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { CodeArea } from '@/components/code-area';
import { Badge } from '@/components/ui/badge';

import {
  BlockListLayout,
  PasteInputDialog,
  PlainCodeBlock,
  RawTextDialog,
  useBlockViewer,
} from '../_shared/block-viewer';
import {
  type LjsonLineBlock,
  looksLikeStream,
  type ParseResult,
  parseStream,
  type SseDataBlock,
  type StreamBlock,
} from './utils';

// ─── SSE 单块 ───────────────────────────────────────────────

const SseBlockView = memo(function SseBlockView({
  block,
  collapsed,
  highlight,
  onToggle,
}: {
  block: SseDataBlock;
  collapsed: boolean;
  highlight: boolean;
  onToggle: (index: number) => void;
}) {
  const { t } = useTranslation('tools');
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
            {t('streamParser.parseFailed')}
          </Badge>
        )}
      </div>
      {!collapsed && (
        <>
          {block.type === 'json' &&
            (highlight ? (
              <CodeArea
                code={block.formatted ?? ''}
                language="json"
                className="min-h-0"
                codeClassName="!text-[11px]"
                showCopyButton={false}
              />
            ) : (
              <PlainCodeBlock code={block.formatted ?? ''} />
            ))}
          {block.type === 'signal' && (
            <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-md px-3 py-2 font-mono">
              {t('streamParser.signal', { raw: block.raw })}
            </div>
          )}
          {block.type === 'text' && !block.valid && (
            <div className="space-y-1.5">
              <div className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2 font-mono">
                {block.error}
              </div>
              <PlainCodeBlock code={block.raw} />
            </div>
          )}
        </>
      )}
    </div>
  );
});

// ─── JSONL 单块 ─────────────────────────────────────────────

const LjsonBlockView = memo(function LjsonBlockView({
  block,
  collapsed,
  highlight,
  onToggle,
}: {
  block: LjsonLineBlock;
  collapsed: boolean;
  highlight: boolean;
  onToggle: (index: number) => void;
}) {
  const { t } = useTranslation('tools');
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
            {t('streamParser.parseFailed')}
          </Badge>
        )}
      </div>
      {!collapsed && (
        <>
          {block.valid &&
            (highlight ? (
              <CodeArea
                code={block.formatted ?? ''}
                language="json"
                className="min-h-0"
                codeClassName="!text-[11px]"
                showCopyButton={false}
              />
            ) : (
              <PlainCodeBlock code={block.formatted ?? ''} />
            ))}
          {!block.valid && (
            <div className="space-y-1.5">
              <div className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2 font-mono">
                {block.error}
              </div>
              <PlainCodeBlock code={block.raw} />
            </div>
          )}
        </>
      )}
    </div>
  );
});

// ─── 静态配置（保持稳定引用，避免 hook 依赖每次变化） ─────────────

const EMPTY_RESULT: ParseResult = {
  blocks: [],
  format: 'unknown',
  validCount: 0,
  invalidCount: 0,
  signalCount: 0,
};

const isMergeable = (b: StreamBlock) => {
  if (b.kind === 'sse') return b.type === 'json' && b.valid;
  return b.valid;
};

const getSearchText = (b: StreamBlock) => b.formatted ?? b.raw;

const PASTE_PLACEHOLDER = `// SSE 示例
event: message
data: {"key": "value"}

event: message
data: {"another": "object"}

// 或 JSONL 示例
{"id":"1","type":"message","text":"hello"}
{"id":"2","type":"topic","topic":"greeting"}`;

// ─── 主页面 ─────────────────────────────────────────────────

export default function StreamParserPage() {
  const { t } = useTranslation('tools');
  const successMessage = useCallback((count: number) => t('streamParser.parsedSuccess', { count }), [t]);

  const controller = useBlockViewer<StreamBlock, ParseResult>({
    emptyResult: EMPTY_RESULT,
    parse: parseStream,
    looksLike: looksLikeStream,
    isMergeable,
    successMessage,
    getSearchText,
  });

  const { result, open, setOpen, rawText, rawTextOpen, setRawTextOpen, handleConfirmFromDialog, toggleBlock } =
    controller;
  const { blocks, format, validCount, invalidCount, signalCount } = result;

  const renderBlock = useCallback(
    (block: StreamBlock, collapsed: boolean, highlight: boolean) => {
      if (block.kind === 'sse') {
        return <SseBlockView block={block} collapsed={collapsed} highlight={highlight} onToggle={toggleBlock} />;
      }
      return <LjsonBlockView block={block} collapsed={collapsed} highlight={highlight} onToggle={toggleBlock} />;
    },
    [toggleBlock],
  );

  return (
    <>
      <PasteInputDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirmFromDialog}
        title={t('streamParser.pasteTitle')}
        description={t('streamParser.pasteDesc')}
        placeholder={PASTE_PLACEHOLDER}
      />
      <RawTextDialog
        open={rawTextOpen}
        onOpenChange={setRawTextOpen}
        rawText={rawText}
        title={t('streamParser.rawTitle')}
        description={t('streamParser.rawDesc')}
      />

      <BlockListLayout
        controller={controller}
        emptyIcon={Layers}
        dataLabel="SSE / JSONL"
        rawTextTitle={t('streamParser.viewRaw')}
        renderBlock={renderBlock}
        renderStats={() => (
          <>
            {/* 当前识别到的格式 */}
            {format === 'sse' && (
              <Badge className="text-[10px] h-5 bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-500/15">
                {t('streamParser.formatSse')}
              </Badge>
            )}
            {format === 'ljson' && (
              <Badge className="text-[10px] h-5 bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/15">
                {t('streamParser.formatLjson')}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] h-5">
              {t('streamParser.total', { count: blocks.length })}
            </Badge>
            {validCount > 0 && (
              <Badge className="text-[10px] h-5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15">
                {t('streamParser.success', { count: validCount })}
              </Badge>
            )}
            {signalCount > 0 && (
              <Badge className="text-[10px] h-5 bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15">
                {t('streamParser.signalCount', { count: signalCount })}
              </Badge>
            )}
            {invalidCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5">
                {t('streamParser.fail', { count: invalidCount })}
              </Badge>
            )}
          </>
        )}
      />
    </>
  );
}
