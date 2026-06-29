import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import { CodeArea } from '@/components/code-area';

import {
  BlockListLayout,
  PasteInputDialog,
  PlainCodeBlock,
  PrimaryBadge,
  RawTextDialog,
  StatsRow,
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

// ─── 单块通用：左侧色彩条 + 折叠按钮 + 元数据 ─────────────────

type BlockTone = 'data' | 'signal' | 'error';

const TONE_BAR: Record<BlockTone, string> = {
  data: 'bg-border',
  signal: 'bg-amber-400 dark:bg-amber-500',
  error: 'bg-destructive',
};

function BlockHeader({
  collapsed,
  onToggle,
  label,
  tone,
  meta,
  status,
}: {
  collapsed: boolean;
  onToggle: () => void;
  label: string;
  tone: BlockTone;
  meta?: React.ReactNode;
  status?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-1">
      {/* 左侧色条 */}
      <span className={`w-[3px] h-3.5 rounded-sm shrink-0 ${TONE_BAR[tone]}`} aria-hidden />
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        <span>{label}</span>
      </button>
      {meta}
      {status}
    </div>
  );
}

function MetaSeparator() {
  return <span className="text-muted-foreground/40">·</span>;
}

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

  const tone: BlockTone = block.type === 'signal' ? 'signal' : !block.valid ? 'error' : 'data';

  const meta = (
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/80 min-w-0">
      {block.event && (
        <>
          <MetaSeparator />
          <span className="truncate">{block.event}</span>
        </>
      )}
      {block.id && (
        <>
          <MetaSeparator />
          <span className="truncate">id:{block.id}</span>
        </>
      )}
    </div>
  );

  const status =
    block.type === 'signal' ? (
      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 ml-auto">{block.raw}</span>
    ) : block.type === 'text' && !block.valid ? (
      <span className="text-[10px] font-mono text-destructive ml-auto">{t('streamParser.parseFailed')}</span>
    ) : null;

  return (
    <div className="relative">
      <BlockHeader
        collapsed={collapsed}
        onToggle={handleToggle}
        label={`#${block.index + 1}`}
        tone={tone}
        meta={meta}
        status={status}
      />
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
            <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded-md px-3 py-2 font-mono">
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

  const tone: BlockTone = block.valid ? 'data' : 'error';

  const status = !block.valid ? (
    <span className="text-[10px] font-mono text-destructive ml-auto">{t('streamParser.parseFailed')}</span>
  ) : null;

  return (
    <div className="relative">
      <BlockHeader
        collapsed={collapsed}
        onToggle={handleToggle}
        label={`L${block.lineNo}`}
        tone={tone}
        status={status}
      />
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

const EXAMPLE_DATA = `event: message
data: {"id":"chatcmpl-1","choices":[{"delta":{"role":"assistant","content":"Hello"}}]}

event: message
data: {"id":"chatcmpl-1","choices":[{"delta":{"content":" world"}}]}

event: message
data: {"id":"chatcmpl-1","choices":[{"delta":{"content":"!"}}]}

event: message
data: {"id":"chatcmpl-1","choices":[{"finish_reason":"stop","delta":{}}]}

data: [DONE]`;

// ─── 主页面 ─────────────────────────────────────────────────

export default function StreamParserPage() {
  const { t } = useTranslation('tools');
  const successMessage = useCallback((count: number) => t('streamParser.parsedSuccess', { count }), [t]);

  // 格式覆盖状态：null 表示自动识别
  const [forceFormat, setForceFormat] = useState<'sse' | 'ljson' | null>(null);
  const parse = useMemo(() => (text: string) => parseStream(text, forceFormat ?? undefined), [forceFormat]);

  const controller = useBlockViewer<StreamBlock, ParseResult>({
    emptyResult: EMPTY_RESULT,
    parse,
    looksLike: looksLikeStream,
    isMergeable,
    successMessage,
    getSearchText,
  });

  const { result, open, setOpen, rawText, rawTextOpen, setRawTextOpen, handleConfirmFromDialog, toggleBlock } =
    controller;
  const { format, validCount, invalidCount, signalCount, blocks, trailingIncomplete } = result;

  const renderBlock = useCallback(
    (block: StreamBlock, collapsed: boolean, highlight: boolean) => {
      if (block.kind === 'sse') {
        return <SseBlockView block={block} collapsed={collapsed} highlight={highlight} onToggle={toggleBlock} />;
      }
      return <LjsonBlockView block={block} collapsed={collapsed} highlight={highlight} onToggle={toggleBlock} />;
    },
    [toggleBlock],
  );

  const renderPrimaryBadge = useCallback(() => {
    if (format === 'sse') return <PrimaryBadge>{t('streamParser.formatSse')}</PrimaryBadge>;
    if (format === 'ljson') return <PrimaryBadge>{t('streamParser.formatLjson')}</PrimaryBadge>;
    return null;
  }, [format, t]);

  const renderStatsDetails = useCallback(
    () => (
      <>
        <StatsRow label={t('streamParser.statsFormat')} value={format === 'unknown' ? '-' : format.toUpperCase()} />
        <StatsRow label={t('streamParser.statsTotal')} value={blocks.length} />
        {validCount > 0 && <StatsRow label={t('streamParser.statsValid')} value={validCount} tone="success" />}
        {signalCount > 0 && <StatsRow label={t('streamParser.statsSignal')} value={signalCount} tone="warning" />}
        {invalidCount > 0 && (
          <StatsRow label={t('streamParser.statsInvalid')} value={invalidCount} tone="destructive" />
        )}
        {trailingIncomplete && (
          <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
            ⚠ {t('streamParser.trailingIncomplete')}
          </div>
        )}
      </>
    ),
    [format, blocks.length, validCount, signalCount, invalidCount, trailingIncomplete, t],
  );

  const formatSelector = (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground mr-1">{t('streamParser.forceFormat')}:</span>
      {(['auto', 'sse', 'ljson'] as const).map((opt) => (
        <Button
          key={opt}
          variant={(forceFormat === null ? 'auto' : forceFormat) === opt ? 'default' : 'ghost'}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setForceFormat(opt === 'auto' ? null : opt)}
        >
          {opt === 'auto' ? t('streamParser.formatAuto') : opt.toUpperCase()}
        </Button>
      ))}
    </div>
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

      {/* 格式选择器：始终可见 */}
      <div className="px-4 pt-3 pb-1 flex items-center">
        {formatSelector}
      </div>

      <BlockListLayout
        controller={controller}
        emptyIcon={Layers}
        dataLabel="SSE / JSONL"
        rawTextTitle={t('streamParser.viewRaw')}
        renderBlock={renderBlock}
        renderPrimaryBadge={renderPrimaryBadge}
        renderStatsDetails={renderStatsDetails}
        exampleText={EXAMPLE_DATA}
      />
    </>
  );
}
