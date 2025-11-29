import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROUTER_PATH = path.resolve(__dirname, '../src/router.ts');
const SITEMAP_PATH = path.resolve(__dirname, '../public/sitemap.xml');
const BASE_URL = 'https://qiaotools.com';

function getRoutes() {
  const content = fs.readFileSync(ROUTER_PATH, 'utf-8');
  const routes = [];

  // 正则匹配 path: '/...'
  // 能够匹配: path: '/image-compressor', 或 path: "/image-compressor"
  const regex = /path:\s*['"](\/[^'"]+)['"]/g;

  let match;
  while ((match = regex.exec(content)) !== null) {
    routes.push(match[1]);
  }

  return routes;
}

function generateSitemap() {
  const routes = getRoutes();
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 首页 -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;

  routes.forEach((route) => {
    // 排除首页重复（如果有）
    if (route === '/') return;

    xml += `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`;
  });

  xml += '\n</urlset>';

  fs.writeFileSync(SITEMAP_PATH, xml);
  console.log(`✅ Sitemap generated at: ${SITEMAP_PATH}`);
  console.log(`📊 Total URLs: ${routes.length + 1} (including home)`);
}

generateSitemap();
