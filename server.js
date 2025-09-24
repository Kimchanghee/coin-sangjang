// ===================================
// 파일 경로: ./server.js (프로젝트 루트)
// 목적: Cloud Run에서 Next.js 프론트엔드 앱 제공
// ===================================

const http = require('http');
const path = require('path');
const { parse } = require('url');
const next = require('next');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const HOST = '0.0.0.0';
const isDev = process.env.NODE_ENV !== 'production';
const nextDir = path.join(__dirname, 'frontend');

const app = next({
  dev: isDev,
  dir: nextDir,
  hostname: HOST,
  port: PORT,
});
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    server.listen(PORT, HOST, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║     Coin Sangjang Next.js Server Started ║
╚═══════════════════════════════════════════╝

🚀 Server running on http://${HOST}:${PORT}
🌐 UI: http://${HOST}:${PORT}
      `);
    });

    const gracefulShutdown = () => {
      server.close(() => process.exit(0));
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  })
  .catch((error) => {
    console.error('❌ Failed to prepare Next.js application:', error);
    process.exit(1);
  });
