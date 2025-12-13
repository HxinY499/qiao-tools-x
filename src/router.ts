import {
  AlignLeft,
  Binary,
  Braces,
  CalendarClock,
  Circle,
  FileDiff,
  FileImage,
  Fingerprint,
  ImageIcon,
  Link,
  Monitor,
  Palette,
  QrCode,
  Rainbow,
  ScrollText,
  Search,
  Shield,
  Square,
} from 'lucide-react';
import { lazy } from 'react';

import { ToolKey, ToolRoute } from './type';

const ImageCompressorPage = lazy(() => import('@/pages/image-compressor'));
const ImageWatermarkPage = lazy(() => import('@/pages/image-watermark'));
const SvgConverterPage = lazy(() => import('@/pages/svg-converter'));
const ScrollBarPage = lazy(() => import('@/pages/scroll-bar'));
const ColorConverterPage = lazy(() => import('@/pages/color-converter'));
const BoxShadowPage = lazy(() => import('@/pages/box-shadow'));
const GradientGeneratorPage = lazy(() => import('@/pages/gradient-generator'));
const Base64ToolPage = lazy(() => import('@/pages/base64'));
const TimestampConverterPage = lazy(() => import('@/pages/timestamp-converter'));
const UrlEncoderPage = lazy(() => import('@/pages/url-encoder'));
const UUIDGeneratorPage = lazy(() => import('@/pages/uuid-generator'));
const WordCountAndProcessPage = lazy(() => import('@/pages/word-count-and-process'));
const TextDiffPage = lazy(() => import('@/pages/text-diff'));
const TextEscaperPage = lazy(() => import('@/pages/text-escaper'));
const UserAgentParserPage = lazy(() => import('@/pages/user-agent-parser'));
const PasswordGeneratorPage = lazy(() => import('@/pages/password-generator'));
const SeoAnalyzerPage = lazy(() => import('@/pages/seo-analyzer'));
const QRCodeToolPage = lazy(() => import('@/pages/qrcode-tool'));

export const toolRoutes: ToolRoute[] = [
  {
    key: ToolKey.ImageCompressor,
    path: '/image-compressor',
    title: '图片压缩',
    subtitle: '在线图片压缩与尺寸调整工具，支持实时预览与参数调节',
    icon: ImageIcon,
    component: ImageCompressorPage,
    category: 'image',
    seo: {
      description:
        '免费在线图片压缩工具，支持 JPG、PNG、WebP 等格式，可自定义压缩质量与图片尺寸，实时预览压缩效果。所有处理在浏览器本地完成，保护您的隐私。',
      keywords: '图片压缩,在线图片压缩,图片优化,压缩图片,图片尺寸调整,JPG压缩,PNG压缩,WebP转换',
    },
  },
  {
    key: ToolKey.ImageWatermark,
    path: '/image-watermark',
    title: '图片水印添加',
    subtitle: '在图片上添加文字或图片水印，支持位置、透明度、字体和大小调节，处理全程在本地完成',
    icon: ImageIcon,
    component: ImageWatermarkPage,
    category: 'image',
    seo: {
      description:
        '免费在线图片水印工具，支持添加文字或图片水印，可自定义位置、透明度、字体和大小，批量处理图片。所有处理在本地完成，保护您的隐私。',
      keywords: '图片水印,添加水印,在线水印工具,图片批量水印,文字水印,图片水印,水印制作',
    },
  },
  {
    key: ToolKey.SvgConverter,
    path: '/svg-converter',
    title: 'SVG 转图片',
    subtitle: 'SVG 转 PNG/JPG/WebP 工具，支持批量转换、自定义尺寸、背景色和透明度',
    icon: FileImage,
    component: SvgConverterPage,
    category: 'image',
    seo: {
      description:
        '免费在线 SVG 转图片工具，支持批量转换为 PNG、JPG、WebP 格式，可自定义导出尺寸、背景色、透明度，支持独立参数模式与预设尺寸。所有处理在浏览器本地完成，保护您的隐私。',
      keywords:
        'SVG转PNG,SVG转JPG,SVG转WebP,SVG转图片,SVG转换器,矢量图转位图,SVG导出,批量SVG转换,在线SVG工具,SVG格式转换',
    },
  },
  {
    key: ToolKey.ScrollBar,
    path: '/scroll-bar',
    title: '滚动条生成器',
    subtitle: '可视化调整滚动条样式，并生成可复制的 CSS 代码',
    icon: ScrollText,
    component: ScrollBarPage,
    category: 'css',
    seo: {
      description:
        '可视化滚动条样式生成器，支持调整颜色、宽度、圆角等属性，实时预览效果并一键生成 CSS 代码，提升网页设计质量。',
      keywords: 'CSS滚动条,滚动条样式,scrollbar样式,CSS生成器,自定义滚动条,网页滚动条',
    },
  },
  {
    key: ToolKey.BoxShadow,
    path: '/box-shadow',
    title: '阴影生成器',
    subtitle: '可视化叠加多层阴影，并一键生成 CSS 与 Tailwind 代码',
    icon: Square,
    component: BoxShadowPage,
    category: 'css',
    seo: {
      description:
        '可视化 CSS 阴影生成器，支持多层阴影叠加，调整颜色、模糊度、偏移量等参数，实时预览并生成 CSS 和 Tailwind 代码。',
      keywords: 'CSS阴影,box-shadow,阴影生成器,Tailwind阴影,CSS生成器,网页阴影效果',
    },
  },
  {
    key: ToolKey.GradientGenerator,
    path: '/gradient-generator',
    title: '渐变生成器',
    subtitle: '可视化创建 linear/radial 渐变，支持多色断点与角度调整，并生成 CSS 与 Tailwind 类名',
    icon: Rainbow,
    component: GradientGeneratorPage,
    category: 'css',
    seo: {
      description:
        '可视化 CSS 渐变生成器，支持线性渐变和径向渐变，多色断点调整，实时预览并生成 CSS 和 Tailwind 代码，提升网页设计效率。',
      keywords: 'CSS渐变,渐变生成器,linear-gradient,radial-gradient,Tailwind渐变,渐变背景,CSS生成器',
    },
  },
  {
    key: ToolKey.ColorConverter,
    path: '/color-converter',
    title: '颜色格式转换',
    subtitle: '在线颜色格式转换工具，支持 Hex、RGB/RGBA、HSL/HSLA 格式互转',
    icon: Palette,
    component: ColorConverterPage,
    category: 'css',
    seo: {
      description:
        '免费在线颜色格式转换工具，支持 Hex、RGB、RGBA、HSL、HSLA 等格式互相转换，实时预览颜色效果，方便前端开发和设计使用。',
      keywords: '颜色转换,Hex转RGB,RGB转Hex,HSL转换,颜色格式转换,CSS颜色,颜色代码转换',
    },
  },
  {
    key: ToolKey.TimestampConverter,
    path: '/timestamp-converter',
    title: '时间戳转换',
    subtitle: '时间戳与日期时间互转，支持多种常用格式并可快速复制当前时间',
    icon: CalendarClock,
    component: TimestampConverterPage,
    category: 'dev',
    seo: {
      description:
        '在线时间戳转换工具，支持时间戳与日期时间互转，支持多种时间格式，可快速获取当前时间戳，方便开发调试。',
      keywords: '时间戳转换,Unix时间戳,时间戳转日期,日期转时间戳,timestamp,时间格式转换',
    },
  },
  {
    key: ToolKey.JsonFormatter,
    path: '/json-formatter',
    title: 'JSON 格式化',
    subtitle: 'JSON 美化、压缩、语法高亮与错误检测工具，也可以存储 JSON',
    icon: Braces,
    component: lazy(() => import('@/pages/json-formatter')),
    category: 'dev',
    seo: {
      description:
        '免费在线 JSON 格式化工具，支持 JSON 美化、压缩、语法高亮和错误检测，可本地存储 JSON 数据，提升开发效率。',
      keywords: 'JSON格式化,JSON美化,JSON压缩,JSON验证,JSON编辑器,JSON工具',
    },
  },
  {
    key: ToolKey.BorderRadius,
    path: '/border-radius',
    title: '圆角生成器',
    component: lazy(() => import('./pages/border-radius')),
    icon: Circle,
    category: 'css',
    seo: {
      description:
        '可视化 CSS 圆角生成器，支持独立调整四个角的圆角半径，实时预览并生成 CSS 和 Tailwind 代码，提升设计效率。',
      keywords: 'CSS圆角,border-radius,圆角生成器,Tailwind圆角,CSS生成器,网页圆角',
    },
  },
  {
    key: ToolKey.UrlEncoder,
    path: '/url-encoder',
    title: 'URL 编解码',
    subtitle: 'URL 编码/解码工具，支持 URL 参数解析与可视化展示',
    icon: Link,
    component: UrlEncoderPage,
    category: 'dev',
    seo: {
      description: '免费在线 URL 编码解码工具，支持 URL 参数解析和可视化展示，方便开发调试和测试。',
      keywords: 'URL编码,URL解码,URLEncode,URLDecode,URL参数解析,网址编码',
    },
  },
  {
    key: ToolKey.Base64,
    path: '/base64',
    title: 'Base64 编解码',
    subtitle:
      '在文本模式下支持普通文本与 Base64 间互转，在图片模式下可将本地图片转换为 Base64 Data URL，方便内联到 CSS 或 HTML 中',
    icon: Square,
    component: Base64ToolPage,
    category: 'dev',
    seo: {
      description:
        '免费在线 Base64 编解码工具，支持文本和图片的 Base64 编码解码，可将图片转换为 Data URL，方便嵌入到 CSS 或 HTML 中。',
      keywords: 'Base64编码,Base64解码,图片转Base64,Base64工具,DataURL,Base64图片',
    },
  },
  {
    key: ToolKey.UuidGenerator,
    path: '/uuid-generator',
    title: 'UUID 生成器',
    subtitle: '在线批量生成 UUID/GUID，支持自定义格式（大小写、连字符）与历史记录功能',
    icon: Fingerprint,
    component: UUIDGeneratorPage,
    category: 'dev',
    seo: {
      description:
        '免费在线 UUID 生成器，支持批量生成 UUID/GUID，可自定义格式（大小写、连字符），提供历史记录功能，方便开发使用。',
      keywords: 'UUID生成器,GUID生成器,UUID在线生成,批量生成UUID,唯一标识符',
    },
  },
  {
    key: ToolKey.WordCount,
    path: '/word-count',
    title: '文本处理和字数统计',
    subtitle: '字数、字符数统计工具，支持段落、句子分析与目标字数进度追踪，支持各种格式处理',
    icon: AlignLeft,
    component: WordCountAndProcessPage,
    category: 'text',
    seo: {
      description:
        '免费在线字数统计工具，支持字数、字符数、段落、句子统计，目标字数进度追踪，支持多种文本格式处理，快速格式化文本，快速去除转义字符。',
      keywords: '文本处理工具,文本格式化,去除转义,字数统计,字符统计,文本统计,段落统计,句子统计',
    },
  },
  {
    key: ToolKey.TextDiff,
    path: '/text-diff',
    title: '文本 Diff 对比',
    subtitle: '左右对比两段文本或代码的差异，支持行级与行内高亮显示',
    icon: FileDiff,
    component: TextDiffPage,
    category: 'text',
    seo: {
      description:
        '免费在线文本 Diff 对比工具，支持左右两栏对比代码或配置差异，提供行级与行内高亮显示，适合代码审查与配置变更检查。',
      keywords: '文本Diff,代码对比,文本对比工具,配置文件对比,行级Diff,行内Diff,差异对比',
    },
  },
  {
    key: ToolKey.TextEscaper,
    path: '/text-escaper',
    title: '文本转义工具',
    subtitle: 'HTML 实体、Unicode、JS 字符串的转义与反转义',
    icon: Binary,
    component: TextEscaperPage,
    category: 'text',
    seo: {
      description:
        '免费在线文本转义工具，支持 HTML 实体、Unicode 编码、JavaScript 字符串的转义与反转义，解决乱码和特殊字符处理问题。',
      keywords: 'HTML转义,Unicode转义,JS转义,文本转义,反转义,HTML实体,Unicode编码,字符串转义',
    },
  },
  {
    key: ToolKey.PasswordGenerator,
    path: '/password-generator',
    title: '密码生成器',
    subtitle: '根据长度与字符类型选项生成高强度随机密码，适用于网站账号和重要服务',
    icon: Shield,
    component: PasswordGeneratorPage,
    category: 'text',
    seo: {
      description:
        '免费在线密码生成器，支持自定义密码长度和字符类型，生成高强度随机密码，保护账号安全。所有处理在本地完成。',
      keywords: '密码生成器,随机密码,强密码生成,安全密码,密码工具,在线密码生成',
    },
  },
  {
    key: ToolKey.UserAgentParser,
    path: '/user-agent-parser',
    title: 'User-Agent 解析',
    subtitle: '解析 User-Agent 字符串，识别浏览器、操作系统、设备信息',
    icon: Monitor,
    component: UserAgentParserPage,
    category: 'dev',
    seo: {
      description:
        '免费在线 User-Agent 解析工具，支持识别浏览器、操作系统、设备型号、引擎版本等信息，方便开发者排查问题。',
      keywords: 'User-Agent解析,UA解析,浏览器识别,设备识别,在线UA工具',
    },
  },
  {
    key: ToolKey.SeoAnalyzer,
    path: '/seo-analyzer',
    title: 'SEO 分析',
    subtitle: '分析网页 SEO 状况，检测 Meta 标签、标题结构、图片优化、结构化数据等',
    icon: Search,
    component: SeoAnalyzerPage,
    category: 'dev',
    seo: {
      description:
        '免费在线 SEO 分析工具，支持 URL 抓取、HTML 代码分析，检测 Meta 标签、Open Graph、标题结构、图片 Alt、结构化数据等，生成详细的 SEO 优化报告。',
      keywords: 'SEO分析,SEO检测,网页SEO,Meta标签检测,Open Graph,结构化数据,SEO优化,网站分析',
    },
  },
  {
    key: ToolKey.QRCodeTool,
    path: '/qrcode-tool',
    title: '二维码工具',
    subtitle: '生成与解析二维码，支持 WiFi、联系人、短信、位置等快捷模板',
    icon: QrCode,
    component: QRCodeToolPage,
    category: 'life',
    seo: {
      description:
        '免费在线二维码生成与解析工具，支持自由文本、WiFi 连接、联系人名片、短信、地理位置等多种模板，可上传图片识别二维码内容。',
      keywords: '二维码生成,二维码解析,QR码,WiFi二维码,vCard二维码,在线二维码工具',
    },
  },
];
