import { MoreHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

/** flex gap-2 = 8px，测量「能否再展开一项」时需要把列间距算进去 */
const FLEX_GAP = 8;
/** 展开判定的安全余量，避免临界抖动 */
const EXPAND_SAFETY = 4;

export interface ToolbarUnit {
  /** 稳定的唯一标识（用于测量缓存与折叠状态） */
  id: string;
  /** 工具栏内的形态（一个 flex 分组，内部可含分隔线与按钮） */
  toolbar: ReactNode;
  /** 折叠进「更多」菜单后的形态（通常是一个 DropdownMenuItem） */
  menu: ReactNode;
}

interface AdaptiveToolbarProps {
  /** 始终可见的左侧内容 */
  leading: ReactNode;
  /** 始终可见的右侧内容（如统计） */
  trailing: ReactNode;
  /** 可折叠单元，按「保留优先级」从高到低排列；空间不足时从末尾开始收起 */
  units: ToolbarUnit[];
  /** 「更多」按钮的无障碍标题 */
  moreLabel: string;
  /**
   * 测量重置键：当其变化（语言切换、单元增减、按钮文案变化等）时，
   * 重新从「全部展开」开始测量，避免使用过期的宽度缓存。
   */
  measureKey: string;
}

/**
 * 自适应工具栏：以容器「实际可用宽度」为准做 priority+ 溢出折叠。
 * 放得下就全部平铺；放不下才按优先级把末尾的单元依次收进「更多」菜单。
 *
 * 测量策略：
 * - 折叠判定用 `scrollWidth > clientWidth`（精确，shrink-0 的单元不会被压缩）；
 * - 展开判定用「弹性间隔」实际剩余宽度（flex-1 会吃掉空白，故不能用 scrollWidth 求剩余）；
 * - 用 noExpand 闸门避免同一宽度下 n ↔ n+1 反复横跳。
 */
export function AdaptiveToolbar({ leading, trailing, units, moreLabel, measureKey }: AdaptiveToolbarProps) {
  const total = units.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const widthsRef = useRef<Map<string, number>>(new Map());
  const lastWidthRef = useRef(0);
  const noExpandRef = useRef(false);

  const [visibleCount, setVisibleCount] = useState(total);

  // 单元集合/文案变化时，重置为「全部展开」并清空宽度缓存重新测量
  useLayoutEffect(() => {
    widthsRef.current.clear();
    noExpandRef.current = false;
    lastWidthRef.current = 0;
    setVisibleCount(total);
  }, [measureKey, total]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // 缓存当前可见单元的宽度（含 flex 列间距），供后续「展开」决策使用
    container.querySelectorAll<HTMLElement>('[data-unit-id]').forEach((node) => {
      widthsRef.current.set(node.dataset.unitId as string, node.offsetWidth);
    });

    const cw = container.clientWidth;
    if (cw !== lastWidthRef.current) {
      lastWidthRef.current = cw;
      noExpandRef.current = false; // 宽度变化，解除展开闸门
    }

    const overflow = container.scrollWidth - cw;
    if (overflow > 1 && visibleCount > 0) {
      noExpandRef.current = true; // 在该宽度下记下「再多就放不下」
      setVisibleCount((c) => Math.max(0, c - 1));
      return;
    }

    if (!noExpandRef.current && visibleCount < total) {
      const nextW = widthsRef.current.get(units[visibleCount].id);
      if (nextW == null) return; // 该单元尚无测量值，保守不展开
      const slack = spacerRef.current?.offsetWidth ?? 0;
      // 展开到「全部」时，「更多」按钮会消失，释放出它的宽度 + 一个间距
      const freed = visibleCount + 1 === total ? (moreRef.current?.offsetWidth ?? 0) + FLEX_GAP : 0;
      if (slack + freed >= nextW + FLEX_GAP + EXPAND_SAFETY) {
        setVisibleCount((c) => Math.min(total, c + 1));
      }
    }
  }, [units, visibleCount, total]);

  // 每次 visibleCount 变化后重新测量，直至收敛；并监听容器尺寸变化
  useLayoutEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  // 字体加载完成后再测一次（中文字体可能晚于首帧）
  useEffect(() => {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fonts?.ready) return;
    let alive = true;
    fonts.ready.then(() => {
      if (alive) measure();
    });
    return () => {
      alive = false;
    };
  }, [measure]);

  const visibleUnits = units.slice(0, visibleCount);
  const overflowUnits = units.slice(visibleCount);

  return (
    <div ref={containerRef} className="flex items-center gap-2 px-4 py-2">
      {leading}

      {visibleUnits.map((u) => (
        <div key={u.id} data-unit-id={u.id} className="flex items-center shrink-0">
          {u.toolbar}
        </div>
      ))}

      {/* 弹性间隔：其实际宽度即为可用于「再展开一项」的剩余空间 */}
      <div ref={spacerRef} className="flex-1 min-w-0" />

      <div className="flex items-center gap-1.5 shrink-0">
        {trailing}

        {overflowUnits.length > 0 && (
          <div ref={moreRef} className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" title={moreLabel}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {overflowUnits.map((u) => (
                  <div key={u.id}>{u.menu}</div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
