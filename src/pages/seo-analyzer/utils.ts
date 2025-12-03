import type {
  CheckWeight,
  HeadingInfo,
  HtmlStructureInfo,
  ImageInfo,
  IssueSeverity,
  LinkInfo,
  MetaInfo,
  OpenGraphInfo,
  SeoAnalysisResult,
  SeoCategory,
  SeoCheckItem,
  StructuredDataInfo,
  TwitterCardInfo,
} from './types';

/**
 * 解析 HTML 字符串为 DOM
 */
export function parseHtml(html: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

/**
 * 提取 Meta 信息
 */
export function extractMetaInfo(doc: Document): MetaInfo {
  const title = doc.querySelector('title')?.textContent?.trim() || null;
  const getMeta = (name: string) =>
    doc.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ||
    doc.querySelector(`meta[property="${name}"]`)?.getAttribute('content') ||
    null;

  const description = getMeta('description');
  const charset =
    doc.querySelector('meta[charset]')?.getAttribute('charset') ||
    doc
      .querySelector('meta[http-equiv="Content-Type"]')
      ?.getAttribute('content')
      ?.match(/charset=([^;]+)/)?.[1] ||
    null;

  return {
    title,
    titleLength: title?.length || 0,
    description,
    descriptionLength: description?.length || 0,
    keywords: getMeta('keywords'),
    robots: getMeta('robots'),
    canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
    viewport: getMeta('viewport'),
    charset,
    author: getMeta('author'),
    generator: getMeta('generator'),
  };
}

/**
 * 提取 Open Graph 信息
 */
export function extractOpenGraphInfo(doc: Document): OpenGraphInfo {
  const getOg = (property: string) =>
    doc.querySelector(`meta[property="og:${property}"]`)?.getAttribute('content') || null;

  return {
    title: getOg('title'),
    description: getOg('description'),
    image: getOg('image'),
    url: getOg('url'),
    type: getOg('type'),
    siteName: getOg('site_name'),
    locale: getOg('locale'),
  };
}

/**
 * 提取 Twitter Card 信息
 */
export function extractTwitterCardInfo(doc: Document): TwitterCardInfo {
  const getTwitter = (name: string) =>
    doc.querySelector(`meta[name="twitter:${name}"]`)?.getAttribute('content') || null;

  return {
    card: getTwitter('card'),
    title: getTwitter('title'),
    description: getTwitter('description'),
    image: getTwitter('image'),
    site: getTwitter('site'),
    creator: getTwitter('creator'),
  };
}

/**
 * 提取标题层级
 */
export function extractHeadings(doc: Document): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  const elements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

  elements.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    headings.push({
      tag,
      text: el.textContent?.trim() || '',
      level: parseInt(tag.charAt(1)),
    });
  });

  return headings;
}

/**
 * 提取图片信息
 */
export function extractImages(doc: Document): ImageInfo[] {
  const images: ImageInfo[] = [];
  const elements = doc.querySelectorAll('img');

  elements.forEach((img) => {
    const src = img.getAttribute('src') || '';
    const alt = img.getAttribute('alt');
    const width = img.getAttribute('width');
    const height = img.getAttribute('height');

    images.push({
      src,
      alt,
      width,
      height,
      hasAlt: alt !== null && alt.trim() !== '',
      hasDimensions: !!(width && height),
    });
  });

  return images;
}

/**
 * 提取链接信息
 */
export function extractLinks(doc: Document, baseUrl?: string): LinkInfo[] {
  const links: LinkInfo[] = [];
  const elements = doc.querySelectorAll('a[href]');
  let baseHost = '';

  try {
    if (baseUrl) {
      baseHost = new URL(baseUrl).host;
    }
  } catch {
    // 忽略无效 URL
  }

  elements.forEach((a) => {
    const href = a.getAttribute('href') || '';
    const rel = a.getAttribute('rel') || '';
    let isExternal = false;

    try {
      if (href.startsWith('http://') || href.startsWith('https://')) {
        const linkHost = new URL(href).host;
        isExternal = baseHost ? linkHost !== baseHost : true;
      }
    } catch {
      // 忽略无效 URL
    }

    links.push({
      href,
      text: a.textContent?.trim() || '',
      isExternal,
      hasNofollow: rel.includes('nofollow'),
      isNoopener: rel.includes('noopener'),
    });
  });

  return links;
}

/**
 * 提取结构化数据
 */
export function extractStructuredData(doc: Document): StructuredDataInfo[] {
  const data: StructuredDataInfo[] = [];

  // JSON-LD
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  jsonLdScripts.forEach((script) => {
    const content = script.textContent?.trim() || '';
    let parsed: Record<string, unknown> | undefined;
    let schemaType: string | undefined;

    try {
      parsed = JSON.parse(content);
      schemaType = (parsed?.['@type'] as string) || undefined;
    } catch {
      // 解析失败
    }

    data.push({
      type: 'json-ld',
      content,
      parsed,
      schemaType,
    });
  });

  // Microdata (简单检测)
  const microdataElements = doc.querySelectorAll('[itemscope]');
  microdataElements.forEach((el) => {
    const itemtype = el.getAttribute('itemtype') || '';
    data.push({
      type: 'microdata',
      content: el.outerHTML.substring(0, 500),
      schemaType: itemtype.split('/').pop(),
    });
  });

  return data;
}

/**
 * 提取 HTML 结构信息
 */
export function extractHtmlStructure(doc: Document, html: string): HtmlStructureInfo {
  const htmlEl = doc.documentElement;

  return {
    hasDoctype: html.toLowerCase().includes('<!doctype'),
    hasHtmlLang: !!htmlEl.getAttribute('lang'),
    htmlLang: htmlEl.getAttribute('lang'),
    hasHead: !!doc.head,
    hasBody: !!doc.body,
    semanticTags: {
      header: doc.querySelectorAll('header').length,
      nav: doc.querySelectorAll('nav').length,
      main: doc.querySelectorAll('main').length,
      article: doc.querySelectorAll('article').length,
      section: doc.querySelectorAll('section').length,
      aside: doc.querySelectorAll('aside').length,
      footer: doc.querySelectorAll('footer').length,
    },
  };
}

/**
 * 计算页面文字数量
 */
export function countWords(doc: Document): number {
  const bodyText = doc.body?.textContent || '';
  // 移除多余空白，计算中英文混合字数
  const cleaned = bodyText.replace(/\s+/g, ' ').trim();
  // 中文字符数 + 英文单词数
  const chineseChars = (cleaned.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = cleaned
    .replace(/[\u4e00-\u9fa5]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  return chineseChars + englishWords;
}

/**
 * 创建检测项
 */
function createCheckItem(
  id: string,
  name: string,
  description: string,
  severity: IssueSeverity,
  weight: CheckWeight = 'none',
  value?: string | number | null,
  suggestion?: string,
): SeoCheckItem {
  return { id, name, description, severity, weight, value, suggestion };
}

// 权重分数映射（Error 级别扣分值，Warning 减半）
const WEIGHT_SCORE_MAP: Record<CheckWeight, number> = {
  critical: 30,
  high: 15,
  medium: 10,
  low: 5,
  none: 0,
};

/**
 * 生成 SEO 检测分类和评分
 */
export function generateSeoCategories(
  meta: MetaInfo,
  og: OpenGraphInfo,
  twitter: TwitterCardInfo,
  headings: HeadingInfo[],
  images: ImageInfo[],
  links: LinkInfo[],
  structuredData: StructuredDataInfo[],
  htmlStructure: HtmlStructureInfo,
): { categories: SeoCategory[]; score: number } {
  const categories: SeoCategory[] = [];
  let currentScore = 100; // 初始满分，采用扣分制

  // 1. 基础 Meta 检测
  const metaItems: SeoCheckItem[] = [];

  // Title 检测
  if (!meta.title) {
    metaItems.push(
      createCheckItem(
        'title',
        '页面标题',
        '缺少 <title> 标签',
        'error',
        'critical',
        null,
        '添加描述性的页面标题，这对于 SEO 至关重要',
      ),
    );
  } else if (meta.titleLength < 10) {
    metaItems.push(
      createCheckItem(
        'title',
        '页面标题',
        '标题极短，无法有效描述内容',
        'error',
        'high',
        `${meta.titleLength} 字符`,
        '建议标题长度在 30-60 字符之间',
      ),
    );
  } else if (meta.titleLength < 30) {
    metaItems.push(
      createCheckItem(
        'title',
        '页面标题',
        '标题偏短，建议优化',
        'warning',
        'medium',
        `${meta.titleLength} 字符`,
        '扩展标题以包含更多关键词，建议 30-60 字符',
      ),
    );
  } else if (meta.titleLength > 70) {
    metaItems.push(
      createCheckItem(
        'title',
        '页面标题',
        '标题过长，搜索引擎可能会截断',
        'warning',
        'medium',
        `${meta.titleLength} 字符`,
        '缩短标题至 60 字符以内以获得最佳展示效果',
      ),
    );
  } else {
    metaItems.push(createCheckItem('title', '页面标题', '标题长度合适', 'success', 'none', `${meta.titleLength} 字符`));
  }

  // Description 检测
  if (!meta.description) {
    metaItems.push(
      createCheckItem(
        'description',
        'Meta 描述',
        '缺少 meta description',
        'error',
        'high',
        null,
        '添加 120-160 字符的页面描述，有助于提升点击率',
      ),
    );
  } else if (meta.descriptionLength < 50) {
    metaItems.push(
      createCheckItem(
        'description',
        'Meta 描述',
        '描述过短',
        'warning',
        'medium',
        `${meta.descriptionLength} 字符`,
        '扩展描述至 120-160 字符',
      ),
    );
  } else if (meta.descriptionLength > 180) {
    metaItems.push(
      createCheckItem(
        'description',
        'Meta 描述',
        '描述过长，可能被截断',
        'warning',
        'medium',
        `${meta.descriptionLength} 字符`,
        '缩短描述至 160 字符以内',
      ),
    );
  } else {
    metaItems.push(
      createCheckItem('description', 'Meta 描述', '描述长度合适', 'success', 'none', `${meta.descriptionLength} 字符`),
    );
  }

  // Viewport 检测
  if (!meta.viewport) {
    metaItems.push(
      createCheckItem(
        'viewport',
        'Viewport',
        '缺少 viewport 标签，移动端体验差',
        'error',
        'high',
        null,
        '添加 <meta name="viewport" content="width=device-width, initial-scale=1">',
      ),
    );
  } else if (meta.viewport.includes('width=device-width')) {
    metaItems.push(createCheckItem('viewport', 'Viewport', '移动端配置正确', 'success', 'none', meta.viewport));
  } else {
    metaItems.push(
      createCheckItem(
        'viewport',
        'Viewport',
        'Viewport 配置可能不标准',
        'warning',
        'medium',
        meta.viewport,
        '建议包含 width=device-width, initial-scale=1',
      ),
    );
  }

  // Canonical 检测
  if (meta.canonical) {
    metaItems.push(createCheckItem('canonical', 'Canonical URL', '已设置规范链接', 'success', 'none', meta.canonical));
  } else {
    metaItems.push(
      createCheckItem(
        'canonical',
        'Canonical URL',
        '未设置 canonical 标签',
        'warning',
        'medium',
        null,
        '强烈建议添加自引用 canonical 标签，防止重复内容问题',
      ),
    );
  }

  // Robots 检测
  if (meta.robots) {
    const isBlocking = meta.robots.includes('noindex') || meta.robots.includes('nofollow');
    if (isBlocking) {
      metaItems.push(
        createCheckItem(
          'robots',
          'Robots 指令',
          '页面被设置为不索引或不跟踪',
          'warning',
          'none', // 有意为之不扣分，只警告
          meta.robots,
          '请确认这是预期的行为，否则搜索引擎将忽略此页面',
        ),
      );
    } else {
      metaItems.push(createCheckItem('robots', 'Robots 指令', 'Robots 指令正常', 'success', 'none', meta.robots));
    }
  } else {
    metaItems.push(createCheckItem('robots', 'Robots 指令', '未设置 robots 标签（默认允许索引）', 'success', 'none'));
  }

  categories.push({ id: 'meta', name: '基础 Meta 信息', icon: '📝', items: metaItems });

  // 2. 社交媒体标签检测
  const socialItems: SeoCheckItem[] = [];

  // Open Graph
  const ogFields = [og.title, og.description, og.image, og.url].filter(Boolean).length;
  if (ogFields === 0) {
    socialItems.push(
      createCheckItem(
        'og',
        'Open Graph',
        '缺少 Open Graph 标签',
        'warning',
        'medium',
        null,
        '添加 og:title, og:description, og:image 以优化社交分享效果',
      ),
    );
  } else if (ogFields < 4) {
    socialItems.push(
      createCheckItem(
        'og',
        'Open Graph',
        `Open Graph 标签不完整 (${ogFields}/4)`,
        'warning',
        'low',
        `${ogFields}/4 个字段`,
        '建议补全 title, description, image, url',
      ),
    );
  } else {
    socialItems.push(
      createCheckItem('og', 'Open Graph', 'Open Graph 标签完整', 'success', 'none', `${ogFields}/4 个字段`),
    );
  }

  // Twitter Card
  const twitterFields = [twitter.card, twitter.title, twitter.description, twitter.image].filter(Boolean).length;
  if (twitterFields === 0) {
    socialItems.push(
      createCheckItem(
        'twitter',
        'Twitter Card',
        '缺少 Twitter Card 标签',
        'info',
        'none', // 只要有 OG，Twitter 也可以用，所以设为 info
        null,
        '添加 twitter:card 等标签可优化 Twitter 分享体验',
      ),
    );
  } else if (twitterFields < 4) {
    socialItems.push(
      createCheckItem(
        'twitter',
        'Twitter Card',
        `Twitter Card 标签不完整 (${twitterFields}/4)`,
        'info',
        'none',
        `${twitterFields}/4 个字段`,
      ),
    );
  } else {
    socialItems.push(
      createCheckItem(
        'twitter',
        'Twitter Card',
        'Twitter Card 标签完整',
        'success',
        'none',
        `${twitterFields}/4 个字段`,
      ),
    );
  }

  categories.push({ id: 'social', name: '社交媒体标签', icon: '📱', items: socialItems });

  // 3. 标题结构检测
  const headingItems: SeoCheckItem[] = [];
  const h1Count = headings.filter((h) => h.level === 1).length;

  if (h1Count === 0) {
    headingItems.push(
      createCheckItem(
        'h1',
        'H1 标签',
        '缺少 H1 标签',
        'error',
        'critical',
        null,
        '必须添加一个描述页面主要内容的 H1 标签',
      ),
    );
  } else if (h1Count > 1) {
    headingItems.push(
      createCheckItem(
        'h1',
        'H1 标签',
        `存在多个 H1 标签 (${h1Count} 个)`,
        'error',
        'high',
        `${h1Count} 个`,
        '每个页面应该只有一个 H1 标签',
      ),
    );
  } else {
    headingItems.push(
      createCheckItem('h1', 'H1 标签', 'H1 标签配置正确', 'success', 'none', headings.find((h) => h.level === 1)?.text),
    );
  }

  // 检查标题层级是否跳跃
  let hasSkippedLevel = false;
  let prevLevel = 0;
  for (const h of headings) {
    // 允许 h1 -> h2, h2 -> h3, h2 -> h2 (同级)
    // 不允许 h2 -> h4 (跳级)
    // 允许 h4 -> h2 (回跳)
    if (prevLevel > 0 && h.level > prevLevel + 1) {
      hasSkippedLevel = true;
      break;
    }
    prevLevel = h.level;
  }

  if (hasSkippedLevel) {
    headingItems.push(
      createCheckItem(
        'heading-hierarchy',
        '标题层级',
        '标题层级存在跳跃',
        'warning',
        'medium',
        null,
        '保持标题层级连续（如 H1 → H2 → H3），不要跳级（如 H2 → H4）',
      ),
    );
  } else if (headings.length > 0) {
    headingItems.push(
      createCheckItem(
        'heading-hierarchy',
        '标题层级',
        '标题层级结构正确',
        'success',
        'none',
        `共 ${headings.length} 个标题`,
      ),
    );
  }

  categories.push({ id: 'headings', name: '标题结构', icon: '📑', items: headingItems });

  // 4. 图片检测
  const imageItems: SeoCheckItem[] = [];
  const imagesWithoutAlt = images.filter((img) => !img.hasAlt);
  const imagesWithoutDimensions = images.filter((img) => !img.hasDimensions);

  if (images.length === 0) {
    imageItems.push(createCheckItem('images', '图片数量', '页面没有图片', 'info', 'none'));
  } else {
    if (imagesWithoutAlt.length > 0) {
      const isSevere = imagesWithoutAlt.length / images.length > 0.5; // 超过 50% 缺失算严重
      imageItems.push(
        createCheckItem(
          'img-alt',
          '图片 Alt 属性',
          `${imagesWithoutAlt.length} 张图片缺少 alt 属性`,
          isSevere ? 'error' : 'warning',
          isSevere ? 'medium' : 'low',
          `${imagesWithoutAlt.length}/${images.length}`,
          'Alt 属性对于可访问性和图片 SEO 至关重要',
        ),
      );
    } else {
      imageItems.push(
        createCheckItem(
          'img-alt',
          '图片 Alt 属性',
          '所有图片都有 alt 属性',
          'success',
          'none',
          `${images.length} 张图片`,
        ),
      );
    }

    if (imagesWithoutDimensions.length > images.length / 2) {
      imageItems.push(
        createCheckItem(
          'img-dimensions',
          '图片尺寸',
          `${imagesWithoutDimensions.length} 张图片未指定尺寸`,
          'warning',
          'low',
          null,
          '指定 width 和 height 可减少 CLS（累积布局偏移）',
        ),
      );
    }
  }

  categories.push({ id: 'images', name: '图片优化', icon: '🖼️', items: imageItems });

  // 5. 链接检测
  const linkItems: SeoCheckItem[] = [];
  const externalLinks = links.filter((l) => l.isExternal);
  const externalWithoutNoopener = externalLinks.filter((l) => !l.isNoopener);

  // 纯统计，不影响分数
  linkItems.push(
    createCheckItem(
      'link-count',
      '链接数量',
      `内链 ${links.length - externalLinks.length} 个，外链 ${externalLinks.length} 个`,
      'info',
      'none',
      `共 ${links.length} 个链接`,
    ),
  );

  if (externalWithoutNoopener.length > 0) {
    linkItems.push(
      createCheckItem(
        'link-security',
        '外链安全',
        `${externalWithoutNoopener.length} 个外链缺少 rel="noopener"`,
        'warning',
        'low',
        null,
        '为 target="_blank" 的外链添加 rel="noopener noreferrer" 以提升安全性',
      ),
    );
  } else if (externalLinks.length > 0) {
    linkItems.push(createCheckItem('link-security', '外链安全', '外链安全配置正确', 'success', 'none'));
  }

  categories.push({ id: 'links', name: '链接分析', icon: '🔗', items: linkItems });

  // 6. 结构化数据检测
  const structuredItems: SeoCheckItem[] = [];

  if (structuredData.length === 0) {
    structuredItems.push(
      createCheckItem(
        'structured-data',
        '结构化数据',
        '未检测到结构化数据',
        'info',
        'none',
        null,
        '添加 JSON-LD 结构化数据有助于获得富文本搜索结果',
      ),
    );
  } else {
    const jsonLd = structuredData.filter((d) => d.type === 'json-ld');
    const failedJsonLd = jsonLd.filter((d) => !d.parsed);

    if (failedJsonLd.length > 0) {
      structuredItems.push(
        createCheckItem(
          'structured-data-error',
          'JSON-LD 语法错误',
          `发现 ${failedJsonLd.length} 个 JSON-LD 区块解析失败`,
          'error',
          'medium',
          null,
          '请检查 JSON 语法是否正确',
        ),
      );
    }

    const types = structuredData.map((d) => d.schemaType).filter(Boolean);
    structuredItems.push(
      createCheckItem(
        'structured-data',
        '结构化数据',
        `检测到 ${structuredData.length} 个结构化数据`,
        'success',
        'none',
        types.join(', ') || `JSON-LD: ${jsonLd.length}`,
      ),
    );
  }

  categories.push({ id: 'structured', name: '结构化数据', icon: '📊', items: structuredItems });

  // 7. HTML 结构检测
  const htmlItems: SeoCheckItem[] = [];

  if (!htmlStructure.hasDoctype) {
    htmlItems.push(
      createCheckItem(
        'doctype',
        'DOCTYPE',
        '缺少 DOCTYPE 声明',
        'error',
        'low',
        null,
        '在 HTML 第一行添加 <!DOCTYPE html>',
      ),
    );
  } else {
    htmlItems.push(createCheckItem('doctype', 'DOCTYPE', 'DOCTYPE 声明正确', 'success', 'none'));
  }

  if (!htmlStructure.hasHtmlLang) {
    htmlItems.push(
      createCheckItem(
        'html-lang',
        'HTML Lang',
        '缺少 lang 属性',
        'warning',
        'low',
        null,
        '在 <html> 标签添加 lang 属性（如 lang="zh-CN"）以声明页面语言',
      ),
    );
  } else {
    htmlItems.push(
      createCheckItem('html-lang', 'HTML Lang', '已设置语言属性', 'success', 'none', htmlStructure.htmlLang),
    );
  }

  const semanticCount = Object.values(htmlStructure.semanticTags).reduce((a, b) => a + b, 0);
  if (semanticCount === 0) {
    htmlItems.push(
      createCheckItem(
        'semantic',
        '语义化标签',
        '未使用语义化标签',
        'info',
        'none',
        null,
        '合理使用 <header>, <nav>, <main>, <footer> 等标签有助于 SEO',
      ),
    );
  } else {
    htmlItems.push(
      createCheckItem('semantic', '语义化标签', '使用了语义化标签', 'success', 'none', `共 ${semanticCount} 个`),
    );
  }

  categories.push({ id: 'html', name: 'HTML 结构', icon: '🏗️', items: htmlItems });

  // --- 扣分计算逻辑 ---
  categories.forEach((cat) => {
    cat.items.forEach((item) => {
      if (!item.weight || item.weight === 'none') return;

      const baseDeduction = WEIGHT_SCORE_MAP[item.weight];
      let deduction = 0;

      if (item.severity === 'error') {
        deduction = baseDeduction;
      } else if (item.severity === 'warning') {
        // Warning 扣分减半，至少扣 1 分
        deduction = Math.max(1, Math.floor(baseDeduction / 2));
      }

      if (deduction > 0) {
        item.scoreModifier = -deduction;
        currentScore -= deduction;
      }
    });
  });

  // 确保分数在 0-100 之间
  const finalScore = Math.max(0, Math.min(100, currentScore));

  return { categories, score: finalScore };
}

/**
 * 完整分析 HTML
 */
export function analyzeHtml(html: string, url?: string): SeoAnalysisResult {
  const doc = parseHtml(html);

  const meta = extractMetaInfo(doc);
  const openGraph = extractOpenGraphInfo(doc);
  const twitterCard = extractTwitterCardInfo(doc);
  const headings = extractHeadings(doc);
  const images = extractImages(doc);
  const links = extractLinks(doc, url);
  const structuredData = extractStructuredData(doc);
  const htmlStructure = extractHtmlStructure(doc, html);
  const wordCount = countWords(doc);

  const { categories, score } = generateSeoCategories(
    meta,
    openGraph,
    twitterCard,
    headings,
    images,
    links,
    structuredData,
    htmlStructure,
  );

  return {
    url,
    analyzedAt: new Date(),
    meta,
    openGraph,
    twitterCard,
    headings,
    images,
    links,
    structuredData,
    htmlStructure,
    wordCount,
    categories,
    score,
  };
}
