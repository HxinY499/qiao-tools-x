import { useDebounceFn } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, Pin, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';

import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { CATEGORY_ICONS, CATEGORY_ORDER } from '@/constant';
import { toolRoutes } from '@/router';
import { useMenuStore } from '@/store/menu';
import { type ToolCategory } from '@/type';
import { cn } from '@/utils';

// ─── 内部小组件 ─────────────────────────────────────────────

function SidebarHeaderBar() {
  return (
    <SidebarHeader className="border-b border-sidebar-border h-16 flex flex-row items-center justify-between px-3 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center">
      {/* Logo 仅展开态显示，icon 模式下隐藏（shadcn 的 collapsible=icon 通过 data 属性控制） */}
      <NavLink
        to="/"
        className="group flex items-center gap-1.5 transition-opacity hover:opacity-80 min-w-0 group-data-[collapsible=icon]:hidden"
      >
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] uppercase tracking-[0.3em] text-sidebar-foreground/50 font-medium">QIAO</span>
          <span className="text-base font-semibold tracking-wide text-sidebar-foreground">Tools</span>
        </div>
        <ArrowLeft className="ml-1 h-3.5 w-3.5 text-sidebar-foreground/0 transition-all duration-200 group-hover:text-sidebar-foreground/50 group-hover:-translate-x-0.5" />
      </NavLink>
      {/* 展开/收起按钮始终保留，icon 模式下居中 */}
      <SidebarTrigger className="shrink-0" />
    </SidebarHeader>
  );
}

interface SearchBoxProps {
  value: string;
  onChange: (v: string) => void;
}

function SearchBox({ value, onChange }: SearchBoxProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K 快捷键聚焦搜索框
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onChange('');
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onChange]);

  return (
    <div className="px-2 pt-2 pb-1">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/50" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('sidebar.searchPlaceholder')}
          className="w-full h-8 pl-8 pr-12 text-sm rounded-md bg-sidebar-accent/40 border border-transparent focus:border-sidebar-ring focus:bg-sidebar-accent/60 focus:outline-none transition-colors placeholder:text-sidebar-foreground/40 text-sidebar-foreground"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-sm hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/60"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-sidebar-foreground/40 font-mono pointer-events-none select-none">
            ⌘K
          </kbd>
        )}
      </div>
    </div>
  );
}

interface MenuItemProps {
  route: (typeof toolRoutes)[0];
  pinned: boolean;
  isActive: boolean;
  title: string;
  onTogglePin: (path: string) => void;
}

function ToolMenuItem({ route, pinned, isActive, title, onTogglePin }: MenuItemProps) {
  const { t } = useTranslation();
  const Icon = route.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={title}>
        <NavLink to={route.path}>
          <Icon />
          <span>{title}</span>
        </NavLink>
      </SidebarMenuButton>
      <SidebarMenuAction
        showOnHover={!pinned}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin(route.path);
        }}
        className={cn(pinned && 'text-sidebar-accent-foreground')}
        aria-label={t(pinned ? 'sidebar.unpin' : 'sidebar.pin')}
        title={t(pinned ? 'sidebar.unpin' : 'sidebar.pin')}
      >
        <Pin className={cn('h-3.5 w-3.5 transition-transform', pinned && 'fill-current')} />
      </SidebarMenuAction>
    </SidebarMenuItem>
  );
}

interface CategorySectionProps {
  category: ToolCategory;
  routes: typeof toolRoutes;
  pinnedSet: Set<string>;
  activePath: string;
  onTogglePin: (path: string) => void;
  collapsed: boolean;
  onToggleCollapsed: (category: ToolCategory) => void;
}

function CategorySection({
  category,
  routes,
  pinnedSet,
  activePath,
  onTogglePin,
  collapsed,
  onToggleCollapsed,
}: CategorySectionProps) {
  const { t } = useTranslation();
  const Icon = CATEGORY_ICONS[category];
  const open = !collapsed;

  return (
    <Collapsible open={open} onOpenChange={() => onToggleCollapsed(category)} className="group/collapsible">
      <SidebarGroup className="py-1 mt-1">
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel
            className={cn(
              'cursor-pointer flex items-center gap-1.5 transition-colors',
              '!text-xs !text-sidebar-foreground/55 font-medium',
              'hover:!text-sidebar-foreground/80',
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span className="flex-1 text-left">{t(`category.${category}`)}</span>
            <span className="text-[11px] text-sidebar-foreground/55 tabular-nums font-normal">{routes.length}</span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 shrink-0 text-sidebar-foreground/55 transition-transform duration-200 ease-out',
                !open && '-rotate-90',
              )}
              strokeWidth={2}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.18, ease: 'easeOut' },
              }}
              className="overflow-hidden"
            >
              <SidebarGroupContent>
                <SidebarMenu>
                  {routes.map((route) => (
                    <ToolMenuItem
                      key={route.path}
                      route={route}
                      pinned={pinnedSet.has(route.path)}
                      isActive={activePath === route.path}
                      title={t(`routes:${route.key}.title`, route.title)}
                      onTogglePin={onTogglePin}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarGroup>
    </Collapsible>
  );
}

// ─── 主组件 ──────────────────────────────────────────────────

export function AppSidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const pinnedPaths = useMenuStore((s) => s.pinnedPaths);
  const togglePin = useMenuStore((s) => s.togglePin);
  const collapsedCategories = useMenuStore((s) => s.collapsedCategories);
  const toggleCategory = useMenuStore((s) => s.toggleCategory);

  // 折叠分类集合（用 Set 加速查找）
  const collapsedSet = useMemo(() => new Set(collapsedCategories), [collapsedCategories]);

  // 搜索状态：本地输入 + debounce 查询
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { run: debouncedSetQuery } = useDebounceFn((v: string) => setSearchQuery(v), { wait: 150 });

  const handleSearch = useCallback(
    (v: string) => {
      setSearchInput(v);
      debouncedSetQuery(v);
    },
    [debouncedSetQuery],
  );

  // 分组逻辑：未搜索时按 pinned + category 分；搜索时输出一个扁平结果
  const grouped = useMemo(() => {
    const pinnedSet = new Set(pinnedPaths);

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const results = toolRoutes.filter((r) =>
        [r.title, r.subtitle ?? '', r.seo?.description ?? '', r.seo?.keywords ?? '']
          .join(' ')
          .toLowerCase()
          .includes(q),
      );
      return { type: 'search' as const, results, pinnedSet };
    }

    const pinnedRoutes: typeof toolRoutes = [];
    const byCategory: Record<string, typeof toolRoutes> = {};
    for (const route of toolRoutes) {
      if (pinnedSet.has(route.path)) {
        pinnedRoutes.push(route);
      } else {
        (byCategory[route.category] ??= []).push(route);
      }
    }

    return {
      type: 'normal' as const,
      pinnedSet,
      pinnedRoutes,
      categories: CATEGORY_ORDER.filter((cat) => byCategory[cat]?.length).map((cat) => ({
        id: cat,
        routes: byCategory[cat],
      })),
    };
  }, [pinnedPaths, searchQuery]);

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="[&_[data-sidebar=sidebar]]:!shadow-none [&_[data-sidebar=sidebar]]:border-sidebar-border"
    >
      <SidebarHeaderBar />

      <SidebarContent className="custom-scrollbar">
        {/* 搜索框（折叠时隐藏） */}
        <div className="group-data-[collapsible=icon]:hidden">
          <SearchBox value={searchInput} onChange={handleSearch} />
        </div>

        {grouped.type === 'search' ? (
          // ─── 搜索结果（扁平列表） ─────────────────
          <SidebarGroup>
            <SidebarGroupLabel
              className={cn(
                'flex items-center gap-1.5',
                '!text-xs !text-sidebar-foreground/55 font-medium',
              )}
            >
              <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span className="flex-1 text-left">{t('sidebar.searchResults')}</span>
              <span className="text-[11px] text-sidebar-foreground/55 tabular-nums font-normal">
                {grouped.results.length}
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {grouped.results.length === 0 ? (
                <div className="px-2 py-6 text-center text-xs text-sidebar-foreground/50">
                  {t('sidebar.searchEmpty')}
                </div>
              ) : (
                <SidebarMenu>
                  {grouped.results.map((route) => (
                    <ToolMenuItem
                      key={route.path}
                      route={route}
                      pinned={grouped.pinnedSet.has(route.path)}
                      isActive={location.pathname === route.path}
                      title={t(`routes:${route.key}.title`, route.title)}
                      onTogglePin={togglePin}
                    />
                  ))}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            {/* ─── 置顶分组 ────────────────────────── */}
            {grouped.pinnedRoutes.length > 0 ? (
              <SidebarGroup className="py-1">
                <SidebarGroupLabel
                  className={cn(
                    'flex items-center gap-1.5',
                    '!text-xs !text-sidebar-foreground/55 font-medium',
                  )}
                >
                  <Pin className="h-3.5 w-3.5 shrink-0 fill-current" strokeWidth={2} />
                  <span className="flex-1 text-left">{t('sidebar.pinned')}</span>
                  <span className="text-[11px] text-sidebar-foreground/55 tabular-nums font-normal">
                    {grouped.pinnedRoutes.length}
                  </span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {grouped.pinnedRoutes.map((route) => (
                      <ToolMenuItem
                        key={route.path}
                        route={route}
                        pinned
                        isActive={location.pathname === route.path}
                        title={t(`routes:${route.key}.title`, route.title)}
                        onTogglePin={togglePin}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ) : (
              // 没置顶过：在 sidebar 顶部给个一行提示，引导用户
              <div className="group-data-[collapsible=icon]:hidden px-3 py-2 text-[11px] text-sidebar-foreground/45 leading-relaxed">
                {t('sidebar.pinnedEmpty')}
              </div>
            )}

            {/* ─── 常规分类分组（可折叠） ───────────── */}
            {grouped.categories.map((cat) => (
              <CategorySection
                key={cat.id}
                category={cat.id}
                routes={cat.routes}
                pinnedSet={grouped.pinnedSet}
                activePath={location.pathname}
                onTogglePin={togglePin}
                collapsed={collapsedSet.has(cat.id)}
                onToggleCollapsed={toggleCategory}
              />
            ))}
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
