/**
 * 匹配结果展示组件
 */

import { useMemo } from 'react';

import { CopyButton } from '@/components/copy-button';
import { Badge } from '@/components/ui/badge';

import type { MatchResult } from './types';
import { highlightMatches } from './utils';

interface MatchResultViewProps {
  testText: string;
  matches: MatchResult[];
}

export function MatchResultView({ testText, matches }: MatchResultViewProps) {
  const segments = useMemo(() => highlightMatches(testText, matches), [testText, matches]);

  if (!testText) {
    return <div className="text-center text-muted-foreground py-8 text-sm">输入测试文本以查看匹配结果</div>;
  }

  return (
    <div className="space-y-4">
      {/* 匹配统计 */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={matches.length > 0 ? 'default' : 'secondary'}>{matches.length} 个匹配</Badge>
        {matches.length > 0 && (
          <span className="text-muted-foreground">
            共匹配 {matches.reduce((sum, m) => sum + m.match.length, 0)} 个字符
          </span>
        )}
      </div>

      {/* 高亮文本 */}
      <div className="p-4 rounded-lg border bg-muted/30 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all">
        {segments.map((segment, index) =>
          segment.isMatch ? (
            <mark
              key={index}
              className="bg-yellow-200 dark:bg-yellow-800/60 text-foreground px-0.5 rounded"
              title={`匹配 #${(segment.matchIndex ?? 0) + 1}`}
            >
              {segment.text}
            </mark>
          ) : (
            <span key={index}>{segment.text}</span>
          ),
        )}
      </div>

      {/* 匹配详情列表 */}
      {matches.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">匹配详情</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {matches.map((match, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card text-sm">
                <Badge variant="outline" className="shrink-0">
                  #{index + 1}
                </Badge>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-0.5 rounded bg-muted font-mono text-xs break-all">
                      {match.match || '(空匹配)'}
                    </code>
                    <CopyButton text={match.match} mode="icon" size="sm" variant="ghost" className="h-6 w-6" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    位置: {match.start} - {match.end}
                  </div>

                  {/* 捕获组 */}
                  {match.captures.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className="text-xs text-muted-foreground">捕获组:</span>
                      <div className="flex flex-wrap gap-1">
                        {match.captures.map((capture, i) => (
                          <code
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-xs font-mono"
                          >
                            ${i + 1}: {capture ?? '(未匹配)'}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 命名捕获组 */}
                  {Object.keys(match.groups).length > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className="text-xs text-muted-foreground">命名组:</span>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(match.groups).map(([name, value]) => (
                          <code
                            key={name}
                            className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-xs font-mono"
                          >
                            {name}: {value ?? '(未匹配)'}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchResultView;
