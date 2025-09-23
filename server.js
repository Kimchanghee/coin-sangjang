// ===================================
// 파일 경로: ./server.js (프로젝트 루트)
// 목적: Cloud Run에서 실행될 메인 서버
// ===================================

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

// Cloud Run이 요구하는 포트
const PORT = process.env.PORT || 8080;

// 간단한 HTTP 서버 생성 (Health check용)
const server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'coin-sangjang',
      timestamp: new Date().toISOString(),
      monitoring: {
        upbit: 'active',
        bithumb: 'active'
      }
    }));
    return;
  }

  // API 정보
  if (req.url === '/api') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'Coin Sangjang API',
      version: '1.0.0',
      endpoints: [
        '/health - Health check',
        '/api - API information',
        '/status - Service status'
      ]
    }));
    return;
  }

  // 서비스 상태
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: 'coin-sangjang',
      status: 'running',
      mode: process.env.ENABLE_TEST_MODE === 'true' ? 'test' : 'production',
      autoTrading: process.env.ENABLE_AUTO_TRADING === 'true',
      monitoring: {
        upbit: { 
          status: 'active',
          checkInterval: '30s'
        },
        bithumb: {
          status: 'active', 
          checkInterval: '30s'
        }
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime()
      }
    }));
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// 서버 시작
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════╗
║     Coin Sangjang Service Started        ║
╚═══════════════════════════════════════════╝

🚀 Server running on port ${PORT}
📊 Health check: http://localhost:${PORT}/health
🔍 Status: http://localhost:${PORT}/status
⚙️  Mode: ${process.env.NODE_ENV || 'production'}

Endpoints:
- GET / - Health check
- GET /health - Health check
- GET /api - API information
- GET /status - Service status
  `);

  // Listing 서비스 시작 (백그라운드)
  startListingService();
});

// Listing 서비스를 백그라운드에서 실행
function startListingService() {
  const listingServicePath = path.join(__dirname, 'services', 'listing-ingest', 'dist', 'main.js');
  
  // 파일이 존재하는지 확인
  const fs = require('fs');
  if (!fs.existsSync(listingServicePath)) {
    console.log('⚠️  Listing service not built, trying JavaScript version...');
    
    // JavaScript 버전 시도
    const jsPath = path.join(__dirname, 'services', 'listing-ingest', 'src', 'simple-monitor.js');
    if (fs.existsSync(jsPath)) {
      const listingProcess = spawn('node', [jsPath], {
        stdio: 'inherit',
        env: { ...process.env }
      });
      
      listingProcess.on('error', (err) => {
        console.error('Failed to start listing service:', err);
      });
      
      return;
    }
    
    console.log('⚠️  Listing service not found, running in API-only mode');
    return;
  }

  // TypeScript 빌드된 버전 실행
  const listingProcess = spawn('node', [listingServicePath], {
    stdio: 'inherit',
    env: { ...process.env }
  });

  listingProcess.on('error', (err) => {
    console.error('Failed to start listing service:', err);
  });

  listingProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Listing service exited with code ${code}, restarting...`);
      setTimeout(startListingService, 5000);
    }
  });
}

// 우아한 종료 처리
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
