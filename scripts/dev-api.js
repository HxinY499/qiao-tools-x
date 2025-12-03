/**
 * 本地 API 开发服务器
 * 用于测试 Vercel Serverless Functions
 *
 * 使用方法: node scripts/dev-api.js
 */

import http from 'http';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3001;

async function startServer() {
  // 动态导入 API handler（需要先编译 TypeScript）
  const { default: fetchHtmlHandler } = await import('../api/fetch-html.ts');

  const server = http.createServer(async (req, res) => {
    // 解析 URL
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // 路由处理
    if (url.pathname === '/api/fetch-html') {
      // 模拟 Vercel 的 request/response 对象
      const mockReq = {
        method: req.method,
        query: Object.fromEntries(url.searchParams),
        body: null,
      };

      // 如果是 POST，读取 body
      if (req.method === 'POST') {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        try {
          mockReq.body = JSON.parse(Buffer.concat(chunks).toString());
        } catch {
          mockReq.body = {};
        }
      }

      const mockRes = {
        statusCode: 200,
        headers: {},
        setHeader(name, value) {
          this.headers[name] = value;
        },
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          res.writeHead(this.statusCode, {
            'Content-Type': 'application/json',
            ...this.headers,
          });
          res.end(JSON.stringify(data));
        },
        end() {
          res.writeHead(this.statusCode, this.headers);
          res.end();
        },
      };

      try {
        await fetchHtmlHandler(mockReq, mockRes);
      } catch (error) {
        console.error('Handler error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  server.listen(PORT, () => {
    console.log(`\n🚀 API 服务器已启动: http://localhost:${PORT}`);
    console.log(`\n📡 可用接口:`);
    console.log(`   GET  http://localhost:${PORT}/api/fetch-html?url=https://example.com`);
    console.log(`   POST http://localhost:${PORT}/api/fetch-html`);
    console.log(`\n💡 前端开发时，在另一个终端运行 pnpm dev`);
    console.log(`   然后修改前端代码，将 API 请求指向 http://localhost:${PORT}\n`);
  });
}

startServer().catch(console.error);
