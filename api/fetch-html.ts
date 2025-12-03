import type { VercelRequest, VercelResponse } from '@vercel/node';

// 常见的浏览器 User-Agent
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 请求超时时间（毫秒）
// Vercel Hobby 版限制：最大 10 秒；Pro 版：最大 60 秒
// 这里设置 9 秒，留 1 秒余量给响应处理
const TIMEOUT = 9000;

// 最大响应体大小
// Vercel 限制：响应体最大 4.5MB（所有版本相同）
const MAX_CONTENT_LENGTH = 4.5 * 1024 * 1024;

// 允许的协议
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

// 禁止访问的主机名（防止 SSRF 攻击）
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata.google.internal', // GCP metadata
  'metadata.goog',
  'kubernetes.default.svc',
  'kubernetes.default',
  'kubernetes',
]);

interface FetchResult {
  success: boolean;
  html?: string;
  url?: string;
  finalUrl?: string;
  contentType?: string;
  error?: string;
  statusCode?: number;
}

/**
 * 检查 IP 地址是否为私有/保留地址
 * 防止 SSRF 攻击访问内部网络
 */
function isPrivateOrReservedIP(ip: string): boolean {
  // 移除 IPv6 前缀（如 ::ffff:）
  const cleanIP = ip.replace(/^::ffff:/i, '');

  // IPv4 检查
  const ipv4Match = cleanIP.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match.map(Number);

    // 验证每个段在 0-255 范围内
    if ([a, b, c, d].some((n) => n > 255)) return true;

    // 私有地址范围
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16

    // 环回地址
    if (a === 127) return true; // 127.0.0.0/8

    // 链路本地地址（AWS/云元数据常用）
    if (a === 169 && b === 254) return true; // 169.254.0.0/16

    // 其他保留地址
    if (a === 0) return true; // 0.0.0.0/8 (当前网络)
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGN)
    if (a === 192 && b === 0 && c === 0) return true; // 192.0.0.0/24 (IETF)
    if (a === 192 && b === 0 && c === 2) return true; // 192.0.2.0/24 (TEST-NET-1)
    if (a === 198 && b === 51 && c === 100) return true; // 198.51.100.0/24 (TEST-NET-2)
    if (a === 203 && b === 0 && c === 113) return true; // 203.0.113.0/24 (TEST-NET-3)
    if (a >= 224) return true; // 224.0.0.0+ (组播和保留)

    return false;
  }

  // IPv6 检查
  const ipv6Lower = cleanIP.toLowerCase();

  // 环回地址 ::1
  if (ipv6Lower === '::1' || ipv6Lower === '0:0:0:0:0:0:0:1') return true;

  // 未指定地址 ::
  if (ipv6Lower === '::' || ipv6Lower === '0:0:0:0:0:0:0:0') return true;

  // 链路本地 fe80::/10
  if (
    ipv6Lower.startsWith('fe8') ||
    ipv6Lower.startsWith('fe9') ||
    ipv6Lower.startsWith('fea') ||
    ipv6Lower.startsWith('feb')
  )
    return true;

  // 唯一本地地址 fc00::/7 (类似 IPv4 私有地址)
  if (ipv6Lower.startsWith('fc') || ipv6Lower.startsWith('fd')) return true;

  // 站点本地地址（已弃用但仍需阻止）fec0::/10
  if (
    ipv6Lower.startsWith('fec') ||
    ipv6Lower.startsWith('fed') ||
    ipv6Lower.startsWith('fee') ||
    ipv6Lower.startsWith('fef')
  )
    return true;

  return false;
}

/**
 * 将各种 IP 格式标准化（处理八进制、十六进制、十进制整数等绕过手法）
 */
function normalizeIP(input: string): string | null {
  // 尝试解析为十进制整数（如 2130706433 = 127.0.0.1）
  if (/^\d+$/.test(input)) {
    const num = parseInt(input, 10);
    if (num >= 0 && num <= 0xffffffff) {
      return [(num >>> 24) & 0xff, (num >>> 16) & 0xff, (num >>> 8) & 0xff, num & 0xff].join('.');
    }
  }

  // 尝试解析点分格式（可能包含八进制或十六进制）
  const parts = input.split('.');
  if (parts.length === 4) {
    const normalized = parts.map((part) => {
      // 十六进制 0x...
      if (part.toLowerCase().startsWith('0x')) {
        return parseInt(part, 16);
      }
      // 八进制 0...（但不是单独的 0）
      if (part.startsWith('0') && part.length > 1 && !/[89]/.test(part)) {
        return parseInt(part, 8);
      }
      return parseInt(part, 10);
    });

    if (normalized.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
      return normalized.join('.');
    }
  }

  // 处理简写形式如 127.1 = 127.0.0.1
  if (parts.length >= 2 && parts.length < 4) {
    // 这种情况比较复杂，保守处理：如果看起来像 IP 就阻止
    const firstPart = parseInt(parts[0], 10);
    if (!isNaN(firstPart) && firstPart >= 0 && firstPart <= 255) {
      // 可能是 IP 简写，返回原样让后续检查处理
      return input;
    }
  }

  return null;
}

/**
 * 验证 URL 是否安全
 */
function validateUrl(urlString: string): { valid: boolean; error?: string; url?: URL } {
  try {
    const url = new URL(urlString);

    // 检查协议
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      return { valid: false, error: `不支持的协议: ${url.protocol}，仅支持 http/https` };
    }

    const hostname = url.hostname.toLowerCase();

    // 检查是否在黑名单中
    if (BLOCKED_HOSTNAMES.has(hostname)) {
      return { valid: false, error: '禁止访问该地址' };
    }

    // 尝试将主机名解析为 IP 并检查
    const normalizedIP = normalizeIP(hostname);
    if (normalizedIP && isPrivateOrReservedIP(normalizedIP)) {
      return { valid: false, error: '禁止访问内部网络地址' };
    }

    // 即使不是标准 IP 格式，也检查原始主机名
    if (isPrivateOrReservedIP(hostname)) {
      return { valid: false, error: '禁止访问内部网络地址' };
    }

    // 检查用户名/密码（可能用于绕过）
    if (url.username || url.password) {
      return { valid: false, error: 'URL 不能包含用户名或密码' };
    }

    return { valid: true, url };
  } catch {
    return { valid: false, error: '无效的 URL 格式' };
  }
}

/**
 * 带超时的 fetch，禁用自动重定向以便手动验证
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
      redirect: 'manual', // 手动处理重定向以验证目标地址
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 安全地跟随重定向（每次都验证目标地址）
 */
async function safeFetch(
  initialUrl: string,
  timeout: number,
  maxRedirects = 5,
): Promise<{ response: Response; finalUrl: string }> {
  let currentUrl = initialUrl;
  let redirectCount = 0;

  while (redirectCount < maxRedirects) {
    const response = await fetchWithTimeout(currentUrl, timeout);

    // 检查是否是重定向
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error(`重定向响应缺少 Location 头`);
      }

      // 解析重定向目标（可能是相对路径）
      const redirectUrl = new URL(location, currentUrl).href;

      // 验证重定向目标是否安全
      const validation = validateUrl(redirectUrl);
      if (!validation.valid) {
        throw new Error(`重定向目标不安全: ${validation.error}`);
      }

      currentUrl = redirectUrl;
      redirectCount++;
      continue;
    }

    return { response, finalUrl: currentUrl };
  }

  throw new Error(`重定向次数过多（超过 ${maxRedirects} 次）`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 GET 和 POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '仅支持 GET/POST 请求' } as FetchResult);
  }

  // 获取 URL 参数
  const targetUrl = req.method === 'GET' ? (req.query.url as string) : req.body?.url;

  if (!targetUrl) {
    return res.status(400).json({ success: false, error: '缺少 url 参数' } as FetchResult);
  }

  // 验证 URL
  const validation = validateUrl(targetUrl);
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error } as FetchResult);
  }

  try {
    // 发起请求（带安全重定向跟随）
    const { response, finalUrl } = await safeFetch(targetUrl, TIMEOUT);

    // 检查状态码
    if (!response.ok) {
      return res.status(200).json({
        success: false,
        error: `请求失败: HTTP ${response.status} ${response.statusText}`,
        statusCode: response.status,
        url: targetUrl,
        finalUrl,
      } as FetchResult);
    }

    // 检查 Content-Type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      // 仍然尝试获取内容，但给出警告
      console.warn(`Content-Type 不是 HTML: ${contentType}`);
    }

    // 检查 Content-Length
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_CONTENT_LENGTH) {
      return res.status(200).json({
        success: false,
        error: `响应体过大: ${(parseInt(contentLength) / 1024 / 1024).toFixed(1)}MB，最大支持 4.5MB`,
        url: targetUrl,
        finalUrl,
      } as FetchResult);
    }

    // 读取响应体
    const html = await response.text();

    // 再次检查实际大小
    if (html.length > MAX_CONTENT_LENGTH) {
      return res.status(200).json({
        success: false,
        error: `响应体过大，最大支持 4.5MB`,
        url: targetUrl,
        finalUrl,
      } as FetchResult);
    }

    return res.status(200).json({
      success: true,
      html,
      url: targetUrl,
      finalUrl, // 重定向后的最终 URL
      contentType,
    } as FetchResult);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? (error.name === 'AbortError' ? `请求超时` : error.message) : '未知错误';

    return res.status(200).json({
      success: false,
      error: `抓取失败: ${errorMessage}`,
      url: targetUrl,
    } as FetchResult);
  }
}
