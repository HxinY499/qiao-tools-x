import { useDebounceFn } from 'ahooks';
import type { Variants } from 'framer-motion';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronDown, Laptop, Moon, Search, Shield, Sun, Zap } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SEO } from '@/components/seo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/constant';
import { toolRoutes } from '@/router';
import { useThemeStore } from '@/store/theme';
import { ToolCategory } from '@/type';
import { cn } from '@/utils';

// ─── 分类卡片样式 ─────────────────────────────────────────────
const CARD_ACCENT: Record<ToolCategory, { icon: string; bg: string; dot: string }> = {
  image: {
    icon: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    dot: 'bg-rose-500',
  },
  css: {
    icon: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    dot: 'bg-violet-500',
  },
  dev: {
    icon: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    dot: 'bg-blue-500',
  },
  text: {
    icon: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    dot: 'bg-amber-500',
  },
  life: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    dot: 'bg-emerald-500',
  },
  other: {
    icon: 'text-muted-foreground',
    bg: 'bg-muted/60',
    dot: 'bg-muted-foreground',
  },
};

// ─── Hero 背景图 + 视差 ──────────────────────────────────────
function HeroBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 300]);
  const scale = useTransform(scrollY, [0, 800], [1, 1.15]);
  const opacity = useTransform(scrollY, [0, 600], [1, 0.3]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div ref={ref} className="absolute inset-0 -top-8 -bottom-8" style={{ y, scale }}>
        <img src="/green-hero.jpg" alt="" className="h-full w-full object-cover" loading="eager" decoding="async" />
      </motion.div>
      <motion.div className="absolute inset-0" style={{ opacity }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-background via-background/50 via-30% to-transparent" />
    </div>
  );
}

// ─── 滚动指示箭头 ────────────────────────────────────────────
function ScrollIndicator() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.6 }}
    >
      <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">Scroll</span>
      <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
        <ChevronDown className="h-4 w-4 text-white/40" />
      </motion.div>
    </motion.div>
  );
}

// ─── 工具卡片 ─────────────────────────────────────────────────
function ToolCard({ route }: { route: (typeof toolRoutes)[0] }) {
  const navigate = useNavigate();
  const Icon = route.icon;
  const accent = CARD_ACCENT[route.category];
  const description = route.subtitle || route.seo?.description || '';

  return (
    <motion.button
      onClick={() => navigate(route.path)}
      className="group relative flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-5 text-left transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-black/[0.03] hover:-translate-y-0.5 dark:hover:shadow-black/20"
      variants={gridItem}
    >
      {/* 图标 */}
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', accent.bg)}>
        <Icon className={cn('h-5 w-5', accent.icon)} strokeWidth={1.5} />
      </div>

      {/* 标题 + 箭头 */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-foreground">{route.title}</span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-60" />
      </div>

      {/* 描述 */}
      {description && (
        <p className="text-xs leading-relaxed text-muted-foreground/80 line-clamp-2">{description}</p>
      )}
    </motion.button>
  );
}

// ─── 分类标题 ──────────────────────────────────────────────────
function SectionTitle({ label, category }: { label: string; category: ToolCategory }) {
  const dot = CARD_ACCENT[category].dot;
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className={cn('h-2 w-2 rounded-full', dot)} />
      <h2 className="text-sm font-semibold text-foreground">{label}</h2>
    </div>
  );
}

// ─── Hero 文案入场动画容器 ────────────────────────────────────
const heroStagger: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const heroChild: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] },
  },
};

// ─── 卡片网格容器 + 子元素 stagger ────────────────────────────
const gridContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const gridItem: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ─── 主页 ────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const { themeSetting, setThemeSetting } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');

  const { run: debouncedSearch } = useDebounceFn((value: string) => setDebouncedQuery(value), { wait: 200 });

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      debouncedSearch(e.target.value);
    },
    [debouncedSearch],
  );

  const filteredRoutes = useMemo(() => {
    let routes = toolRoutes;
    if (activeCategory !== 'all') routes = routes.filter((r) => r.category === activeCategory);
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      routes = routes.filter((r) =>
        [r.title, r.subtitle || '', r.seo?.description || '', r.seo?.keywords || '']
          .join(' ')
          .toLowerCase()
          .includes(q),
      );
    }
    return routes;
  }, [activeCategory, debouncedQuery]);

  const groupedByCategory = useMemo(() => {
    if (activeCategory !== 'all' || debouncedQuery.trim()) return null;
    const groups: { category: ToolCategory; label: string; routes: typeof toolRoutes }[] = [];
    for (const cat of CATEGORY_ORDER) {
      const catRoutes = filteredRoutes.filter((r) => r.category === cat);
      if (catRoutes.length > 0) groups.push({ category: cat, label: CATEGORY_LABELS[cat], routes: catRoutes });
    }
    return groups;
  }, [activeCategory, filteredRoutes, debouncedQuery]);

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = { all: toolRoutes.length };
    for (const r of toolRoutes) c[r.category] = (c[r.category] || 0) + 1;
    return c;
  }, []);

  const handleRandomTool = useCallback(() => {
    navigate(toolRoutes[Math.floor(Math.random() * toolRoutes.length)].path);
  }, [navigate]);

  return (
    <>
      <SEO
        title="首页"
        description="Qiao Tools 免费在线工具集合 — 图片压缩、JSON 格式化、CSS 生成器、文本处理、Base64 编解码等 20+ 实用开发工具，数据全程本地处理，保护您的隐私安全。"
        keywords="在线工具,开发工具,前端工具,图片压缩,JSON格式化,CSS生成器,Base64,URL编码,时间戳转换,UUID生成器"
        path="/"
      />

      <div className="min-h-screen bg-background">
        {/* ─── Hero（全屏高度）─────────────────────────── */}
        <section className="relative h-screen min-h-[600px] max-h-[1000px] flex flex-col">
          <HeroBackground />
          <ScrollIndicator />

          {/* Header */}
          <motion.header
            className="relative z-20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.25em] text-white/50 font-medium leading-none">
                  QIAO
                </span>
                <span className="text-sm font-bold tracking-wide text-white leading-tight">Tools</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex text-xs gap-1.5 text-white/80 hover:text-white hover:bg-white/10"
                  onClick={handleRandomTool}
                >
                  <Zap className="h-3.5 w-3.5" />
                  手气不错
                </Button>
                <div className="flex items-center gap-0.5 p-0.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 h-8">
                  {(['light', 'dark', 'system'] as const).map((mode) => {
                    const icons = { light: Sun, dark: Moon, system: Laptop };
                    const ModeIcon = icons[mode];
                    return (
                      <Button
                        key={mode}
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-6 w-8 rounded-md hover:bg-white/15 text-white/60',
                          themeSetting === mode && 'bg-white/20 shadow-sm text-white hover:bg-white/20',
                        )}
                        onClick={() => setThemeSetting(mode)}
                      >
                        <ModeIcon className="h-3.5 w-3.5" />
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.header>

          {/* Hero 内容 */}
          <div className="relative z-10 flex-1 flex items-center">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 w-full">
              <motion.div
                className="flex flex-col items-center text-center"
                variants={heroStagger}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={heroChild}>
                  <Badge
                    variant="secondary"
                    className="mb-6 gap-1.5 px-3 py-1 text-xs font-medium bg-white/10 backdrop-blur-sm text-white/90 border-white/15 hover:bg-white/10"
                  >
                    <Shield className="h-3 w-3" />
                    数据全程本地处理，隐私安全无忧
                  </Badge>
                </motion.div>

                <motion.h1
                  variants={heroChild}
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-lg"
                >
                  More Tools,{' '}
                  <span className="bg-gradient-to-r from-emerald-300 via-green-200 to-teal-300 bg-clip-text text-transparent">
                    Less Tabs
                  </span>
                </motion.h1>

                <motion.p
                  variants={heroChild}
                  className="mt-5 max-w-lg text-sm sm:text-base lg:text-lg text-white/70 leading-relaxed drop-shadow"
                >
                  Fast, private, no install required.
                </motion.p>

                <motion.div variants={heroChild} className="relative mt-10 w-full max-w-md">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    type="text"
                    placeholder="搜索工具名称、功能描述..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="h-12 pl-10 pr-4 rounded-2xl border-white/15 bg-white/10 backdrop-blur-md shadow-xl shadow-black/10 text-sm text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:border-white/25"
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── 分类筛选 ──────────────────────────────── */}
        <section className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex items-center gap-1 overflow-x-auto py-2.5 custom-scrollbar">
              {(['all', ...CATEGORY_ORDER] as const).map((cat) => {
                const count = categoryCounts[cat] || 0;
                if (cat !== 'all' && count === 0) return null;
                const label = cat === 'all' ? '全部' : CATEGORY_LABELS[cat as ToolCategory];
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat as ToolCategory | 'all')}
                    className={cn(
                      'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200',
                      activeCategory === cat
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/80',
                    )}
                  >
                    {label}
                    <span className="ml-1 text-[10px] opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── 工具列表 ──────────────────────────────── */}
        <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-16 sm:pt-14 sm:pb-24">
          {filteredRoutes.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center py-24 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Search className="h-10 w-10 text-muted-foreground/15 mb-3" />
              <p className="text-sm text-muted-foreground">没有找到匹配「{debouncedQuery}」的工具</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedQuery('');
                  setActiveCategory('all');
                }}
              >
                清除筛选条件
              </Button>
            </motion.div>
          ) : groupedByCategory ? (
            <div className="space-y-12">
              {groupedByCategory.map((group) => (
                <section key={group.category}>
                  <SectionTitle label={group.label} category={group.category} />
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={gridContainer}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.05 }}
                  >
                    {group.routes.map((route) => (
                      <ToolCard key={route.path} route={route} />
                    ))}
                  </motion.div>
                </section>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={gridContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.05 }}
            >
              {filteredRoutes.map((route) => (
                <ToolCard key={route.path} route={route} />
              ))}
            </motion.div>
          )}
        </main>

        {/* ─── Footer ────────────────────────────────── */}
        <footer className="border-t border-border/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/60">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3" />
                <span>所有工具均在浏览器本地运行，不上传任何数据</span>
              </div>
              <span>© Qiao Tools</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
