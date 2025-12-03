/** 输入源类型 */
export type InputSource = 'url' | 'code' | 'file';

/** SEO 问题严重程度 */
export type IssueSeverity = 'error' | 'warning' | 'info' | 'success';

/** SEO 检测项权重 */
export type CheckWeight = 'critical' | 'high' | 'medium' | 'low' | 'none';

/** SEO 检测项 */
export interface SeoCheckItem {
  id: string;
  name: string;
  description: string;
  severity: IssueSeverity;
  value?: string | number | null;
  suggestion?: string;
  weight?: CheckWeight;
  scoreModifier?: number; // 分数修正值（负数表示扣分）
}

/** SEO 检测分类 */
export interface SeoCategory {
  id: string;
  name: string;
  icon: string;
  items: SeoCheckItem[];
}

/** Meta 标签信息 */
export interface MetaInfo {
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  keywords: string | null;
  robots: string | null;
  canonical: string | null;
  viewport: string | null;
  charset: string | null;
  author: string | null;
  generator: string | null;
}

/** Open Graph 标签信息 */
export interface OpenGraphInfo {
  title: string | null;
  description: string | null;
  image: string | null;
  url: string | null;
  type: string | null;
  siteName: string | null;
  locale: string | null;
}

/** Twitter Card 标签信息 */
export interface TwitterCardInfo {
  card: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  site: string | null;
  creator: string | null;
}

/** 标题层级信息 */
export interface HeadingInfo {
  tag: string;
  text: string;
  level: number;
}

/** 图片信息 */
export interface ImageInfo {
  src: string;
  alt: string | null;
  width: string | null;
  height: string | null;
  hasAlt: boolean;
  hasDimensions: boolean;
}

/** 链接信息 */
export interface LinkInfo {
  href: string;
  text: string;
  isExternal: boolean;
  hasNofollow: boolean;
  isNoopener: boolean;
}

/** 结构化数据信息 */
export interface StructuredDataInfo {
  type: 'json-ld' | 'microdata';
  content: string;
  parsed?: Record<string, unknown>;
  schemaType?: string;
}

/** HTML 结构信息 */
export interface HtmlStructureInfo {
  hasDoctype: boolean;
  hasHtmlLang: boolean;
  htmlLang: string | null;
  hasHead: boolean;
  hasBody: boolean;
  semanticTags: {
    header: number;
    nav: number;
    main: number;
    article: number;
    section: number;
    aside: number;
    footer: number;
  };
}

/** 完整的 SEO 分析结果 */
export interface SeoAnalysisResult {
  url?: string;
  finalUrl?: string;
  analyzedAt: Date;
  meta: MetaInfo;
  openGraph: OpenGraphInfo;
  twitterCard: TwitterCardInfo;
  headings: HeadingInfo[];
  images: ImageInfo[];
  links: LinkInfo[];
  structuredData: StructuredDataInfo[];
  htmlStructure: HtmlStructureInfo;
  wordCount: number;
  categories: SeoCategory[];
  score: number;
}

/** 抓取 API 响应 */
export interface FetchHtmlResponse {
  success: boolean;
  html?: string;
  url?: string;
  finalUrl?: string;
  contentType?: string;
  error?: string;
  statusCode?: number;
}
