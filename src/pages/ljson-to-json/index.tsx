import { ChevronDown, ChevronRight, FileType2 } from 'lucide-react';
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
import { type LjsonLineBlock, looksLikeLjson, parseLjsonToJson, type ParseResult } from './utils';

// ─── 单条 ljson 行 ──────────────────────────────────────────

const LjsonBlock = memo(function LjsonBlock({
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
            {t('ljsonToJson.parseFailed')}
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

const EMPTY_RESULT: ParseResult = { blocks: [], validCount: 0, invalidCount: 0 };
const isMergeable = (b: LjsonLineBlock) => b.valid;
const getSearchText = (b: LjsonLineBlock) => b.formatted ?? b.raw;

const PASTE_PLACEHOLDER = `{"id":"1","type":"message","text":"hello"}\n{"id":"2","type":"topic","topic":"greeting"}`;

// ─── 主页面 ─────────────────────────────────────────────────

export default function LjsonToJsonPage() {
  const { t } = useTranslation('tools');
  const successMessage = useCallback((count: number) => t('ljsonToJson.parsedSuccess', { count }), [t]);
  const controller = useBlockViewer<LjsonLineBlock, ParseResult>({
    emptyResult: EMPTY_RESULT,
    parse: parseLjsonToJson,
    looksLike: looksLikeLjson,
    isMergeable,
    successMessage,
    getSearchText,
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
        title={t('ljsonToJson.pasteTitle')}
        description={t('ljsonToJson.pasteDesc')}
        placeholder={PASTE_PLACEHOLDER}
      />
      <RawTextDialog
        open={rawTextOpen}
        onOpenChange={setRawTextOpen}
        rawText={rawText}
        title={t('ljsonToJson.rawTitle')}
        description={t('ljsonToJson.rawDesc')}
      />

      <BlockListLayout
        controller={controller}
        emptyIcon={FileType2}
        dataLabel="ljson"
        rawTextTitle={t('ljsonToJson.viewRaw')}
        renderBlock={(block, collapsed, highlight) => (
          <LjsonBlock block={block} collapsed={collapsed} highlight={highlight} onToggle={toggleBlock} />
        )}
        renderStats={() => (
          <>
            <Badge variant="secondary" className="text-[10px] h-5">
              {t('ljsonToJson.total', { count: blocks.length })}
            </Badge>
            {validCount > 0 && (
              <Badge className="text-[10px] h-5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15">
                {t('ljsonToJson.success', { count: validCount })}
              </Badge>
            )}
            {invalidCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5">
                {t('ljsonToJson.fail', { count: invalidCount })}
              </Badge>
            )}
          </>
        )}
      />
    </>
  );
}
