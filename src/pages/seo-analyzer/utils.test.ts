import { describe, expect, it } from 'vitest';

import type {
  HeadingInfo,
  HtmlStructureInfo,
  ImageInfo,
  LinkInfo,
  MetaInfo,
  OpenGraphInfo,
  SeoAnalysisResult,
  SeoCheckItem,
  StructuredDataInfo,
  TwitterCardInfo,
} from './types';
import {
  buildReportText,
  checkHeadings,
  checkHtmlStructure,
  checkImages,
  checkLinks,
  checkMeta,
  checkSocial,
  checkStructuredData,
  generateSeoCategories,
  SEO_THRESHOLDS,
} from './utils';

// ─── 测试夹具 ─────────────────────────────────────────────
const emptyMeta: MetaInfo = {
  title: null,
  titleLength: 0,
  description: null,
  descriptionLength: 0,
  keywords: null,
  robots: null,
  canonical: null,
  viewport: null,
  charset: null,
  author: null,
  generator: null,
};

const perfectMeta: MetaInfo = {
  title: '这是一个长度刚好合适的页面标题用于测试 SEO 检测逻辑是否正确运行',
  titleLength: 40,
  description: '这是一段长度合适的页面描述，用于测试 meta description 的检测逻辑，长度控制在 120 到 160 字符之间是最理想的状态，这里凑够五十字以上。',
  descriptionLength: 80,
  keywords: null,
  robots: null,
  canonical: 'https://example.com/page',
  viewport: 'width=device-width, initial-scale=1',
  charset: 'utf-8',
  author: null,
  generator: null,
};

const emptyOg: OpenGraphInfo = {
  title: null,
  description: null,
  image: null,
  url: null,
  type: null,
  siteName: null,
  locale: null,
};

const emptyTwitter: TwitterCardInfo = {
  card: null,
  title: null,
  description: null,
  image: null,
  site: null,
  creator: null,
};

const emptyHtmlStructure: HtmlStructureInfo = {
  hasDoctype: false,
  hasHtmlLang: false,
  htmlLang: null,
  hasHead: true,
  hasBody: true,
  semanticTags: { header: 0, nav: 0, main: 0, article: 0, section: 0, aside: 0, footer: 0 },
};

function findItem(items: SeoCheckItem[], id: string) {
  return items.find((i) => i.id === id);
}

describe('checkMeta', () => {
  it('空 meta 应报告缺少 title / description / viewport', () => {
    const items = checkMeta(emptyMeta);
    expect(findItem(items, 'title')?.severity).toBe('error');
    expect(findItem(items, 'description')?.severity).toBe('error');
    expect(findItem(items, 'viewport')?.severity).toBe('error');
    expect(findItem(items, 'canonical')?.severity).toBe('warning');
  });

  it('完整 meta 应全部通过', () => {
    const items = checkMeta(perfectMeta);
    expect(findItem(items, 'title')?.severity).toBe('success');
    expect(findItem(items, 'description')?.severity).toBe('success');
    expect(findItem(items, 'viewport')?.severity).toBe('success');
    expect(findItem(items, 'canonical')?.severity).toBe('success');
  });

  it('title 长度边界判定正确', () => {
    expect(findItem(checkMeta({ ...perfectMeta, title: 'abc', titleLength: 3 }), 'title')?.severity).toBe('error');
    expect(findItem(checkMeta({ ...perfectMeta, title: 'x'.repeat(20), titleLength: 20 }), 'title')?.severity).toBe(
      'warning',
    );
    expect(findItem(checkMeta({ ...perfectMeta, title: 'x'.repeat(80), titleLength: 80 }), 'title')?.severity).toBe(
      'warning',
    );
  });

  it('robots 含 noindex 应警告但权重为 none（不扣分）', () => {
    const item = findItem(checkMeta({ ...perfectMeta, robots: 'noindex' }), 'robots');
    expect(item?.severity).toBe('warning');
    expect(item?.weight).toBe('none');
  });

  it('存在 keywords 应作为 info 项展示', () => {
    const item = findItem(checkMeta({ ...perfectMeta, keywords: 'a,b,c' }), 'keywords');
    expect(item?.severity).toBe('info');
  });
});

describe('checkSocial', () => {
  it('完全无 OG 应警告', () => {
    expect(findItem(checkSocial(emptyOg, emptyTwitter), 'og')?.severity).toBe('warning');
  });

  it('OG 完整应通过', () => {
    const og: OpenGraphInfo = { ...emptyOg, title: 't', description: 'd', image: 'i', url: 'u' };
    expect(findItem(checkSocial(og, emptyTwitter), 'og')?.severity).toBe('success');
  });
});

describe('checkHeadings', () => {
  it('缺少 H1 应报 critical error', () => {
    const item = findItem(checkHeadings([]), 'h1');
    expect(item?.severity).toBe('error');
    expect(item?.weight).toBe('critical');
  });

  it('多个 H1 应报 error', () => {
    const headings: HeadingInfo[] = [
      { tag: 'h1', text: 'a', level: 1 },
      { tag: 'h1', text: 'b', level: 1 },
    ];
    expect(findItem(checkHeadings(headings), 'h1')?.severity).toBe('error');
  });

  it('层级跳跃应警告', () => {
    const headings: HeadingInfo[] = [
      { tag: 'h1', text: 'a', level: 1 },
      { tag: 'h4', text: 'b', level: 4 },
    ];
    expect(findItem(checkHeadings(headings), 'heading-hierarchy')?.severity).toBe('warning');
  });

  it('正常层级应通过', () => {
    const headings: HeadingInfo[] = [
      { tag: 'h1', text: 'a', level: 1 },
      { tag: 'h2', text: 'b', level: 2 },
    ];
    expect(findItem(checkHeadings(headings), 'h1')?.severity).toBe('success');
    expect(findItem(checkHeadings(headings), 'heading-hierarchy')?.severity).toBe('success');
  });
});

describe('checkImages', () => {
  const img = (hasAlt: boolean, hasDimensions = true): ImageInfo => ({
    src: 'x.png',
    alt: hasAlt ? 'alt' : null,
    width: hasDimensions ? '1' : null,
    height: hasDimensions ? '1' : null,
    hasAlt,
    hasDimensions,
  });

  it('无图片应为 info', () => {
    expect(findItem(checkImages([]), 'images')?.severity).toBe('info');
  });

  it('超过 50% 缺 alt 应报 error', () => {
    const images = [img(false), img(false), img(true)];
    expect(findItem(checkImages(images), 'img-alt')?.severity).toBe('error');
  });

  it('少量缺 alt 应报 warning', () => {
    const images = [img(true), img(true), img(false)];
    expect(findItem(checkImages(images), 'img-alt')?.severity).toBe('warning');
  });

  it('全部有 alt 应通过', () => {
    expect(findItem(checkImages([img(true), img(true)]), 'img-alt')?.severity).toBe('success');
  });
});

describe('checkLinks', () => {
  const link = (isExternal: boolean, isNoopener = true): LinkInfo => ({
    href: 'https://x.com',
    text: 't',
    isExternal,
    hasNofollow: false,
    isNoopener,
  });

  it('外链缺少 noopener 应警告', () => {
    expect(findItem(checkLinks([link(true, false)]), 'link-security')?.severity).toBe('warning');
  });

  it('外链安全应通过', () => {
    expect(findItem(checkLinks([link(true, true)]), 'link-security')?.severity).toBe('success');
  });
});

describe('checkStructuredData', () => {
  it('无结构化数据应为 info', () => {
    expect(findItem(checkStructuredData([]), 'structured-data')?.severity).toBe('info');
  });

  it('JSON-LD 解析失败应报 error', () => {
    const data: StructuredDataInfo[] = [{ type: 'json-ld', content: '{bad', parsed: undefined }];
    expect(findItem(checkStructuredData(data), 'structured-data-error')?.severity).toBe('error');
  });
});

describe('checkHtmlStructure - 薄内容检测', () => {
  it('0 字应警告（medium）', () => {
    const item = findItem(checkHtmlStructure(emptyHtmlStructure, 0), 'content-length');
    expect(item?.severity).toBe('warning');
    expect(item?.weight).toBe('medium');
  });

  it('字数低于阈值应警告（low）', () => {
    const item = findItem(checkHtmlStructure(emptyHtmlStructure, SEO_THRESHOLDS.thinContentWords - 1), 'content-length');
    expect(item?.severity).toBe('warning');
    expect(item?.weight).toBe('low');
  });

  it('字数充足应通过', () => {
    const item = findItem(checkHtmlStructure(emptyHtmlStructure, SEO_THRESHOLDS.thinContentWords + 100), 'content-length');
    expect(item?.severity).toBe('success');
  });
});

describe('generateSeoCategories - 评分', () => {
  it('完美页面应接近满分', () => {
    const perfectHtml: HtmlStructureInfo = {
      ...emptyHtmlStructure,
      hasDoctype: true,
      hasHtmlLang: true,
      htmlLang: 'zh-CN',
      semanticTags: { ...emptyHtmlStructure.semanticTags, main: 1 },
    };
    const og: OpenGraphInfo = { ...emptyOg, title: 't', description: 'd', image: 'i', url: 'u' };
    const { score } = generateSeoCategories(
      perfectMeta,
      og,
      emptyTwitter,
      [{ tag: 'h1', text: 'a', level: 1 }],
      [],
      [],
      [],
      perfectHtml,
      500,
    );
    expect(score).toBe(100);
  });

  it('糟糕页面应大幅扣分但不低于 0', () => {
    const { score } = generateSeoCategories(
      emptyMeta,
      emptyOg,
      emptyTwitter,
      [],
      [],
      [],
      [],
      emptyHtmlStructure,
      0,
    );
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThan(50);
  });

  it('应生成 7 个分类', () => {
    const { categories } = generateSeoCategories(
      emptyMeta,
      emptyOg,
      emptyTwitter,
      [],
      [],
      [],
      [],
      emptyHtmlStructure,
      0,
    );
    expect(categories).toHaveLength(7);
  });
});

describe('buildReportText', () => {
  it('应包含分数、地址与各分类', () => {
    const { categories, score } = generateSeoCategories(
      perfectMeta,
      emptyOg,
      emptyTwitter,
      [{ tag: 'h1', text: 'a', level: 1 }],
      [],
      [],
      [],
      emptyHtmlStructure,
      500,
    );
    const result: SeoAnalysisResult = {
      url: 'https://example.com',
      analyzedAt: new Date('2026-01-01'),
      meta: perfectMeta,
      openGraph: emptyOg,
      twitterCard: emptyTwitter,
      headings: [{ tag: 'h1', text: 'a', level: 1 }],
      images: [],
      links: [],
      structuredData: [],
      htmlStructure: emptyHtmlStructure,
      wordCount: 500,
      categories,
      score,
    };
    const report = buildReportText(result);
    expect(report).toContain('SEO 分析报告');
    expect(report).toContain('https://example.com');
    expect(report).toContain(`总分：${score}`);
    expect(report).toContain('基础 Meta 信息');
  });

  it('无 url 时应显示本地来源', () => {
    const result: SeoAnalysisResult = {
      analyzedAt: new Date(),
      meta: emptyMeta,
      openGraph: emptyOg,
      twitterCard: emptyTwitter,
      headings: [],
      images: [],
      links: [],
      structuredData: [],
      htmlStructure: emptyHtmlStructure,
      wordCount: 0,
      categories: [],
      score: 0,
    };
    expect(buildReportText(result)).toContain('本地');
  });
});
