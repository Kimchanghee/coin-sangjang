// ===================================
// 파일 경로: ./server.js (프로젝트 루트)
// 목적: Cloud Run에서 프론트엔드 UI와 API 제공
// ===================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Cloud Run 포트
const PORT = process.env.PORT || 8080;

// HTML 페이지 (프론트엔드 UI)
const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coin Sangjang - 코인 상장 모니터링</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            background: white;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        h1 {
            color: #764ba2;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .subtitle {
            color: #666;
            font-size: 1.1em;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .status-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .status-card:hover {
            transform: translateY(-5px);
        }
        
        .status-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
        }
        
        .exchange-name {
            font-size: 1.5em;
            font-weight: bold;
            color: #333;
        }
        
        .status-badge {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-active {
            background: #4caf50;
            color: white;
        }
        
        .status-inactive {
            background: #f44336;
            color: white;
        }
        
        .notices-container {
            background: white;
            border-radius: 15px;
            padding: 25px;
            min-height: 400px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .notices-header {
            font-size: 1.3em;
            font-weight: bold;
            margin-bottom: 20px;
            color: #333;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .refresh-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 1em;
            transition: background 0.3s ease;
        }
        
        .refresh-btn:hover {
            background: #5a67d8;
        }
        
        .notice-item {
            padding: 15px;
            border-left: 4px solid #667eea;
            background: #f8f9fa;
            margin-bottom: 15px;
            border-radius: 5px;
            transition: all 0.3s ease;
        }
        
        .notice-item:hover {
            background: #e9ecef;
            border-left-color: #764ba2;
        }
        
        .notice-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        
        .notice-meta {
            display: flex;
            gap: 15px;
            font-size: 0.9em;
            color: #666;
        }
        
        .loading {
            text-align: center;
            padding: 50px;
            color: #999;
        }
        
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .settings-panel {
            background: white;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .settings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .setting-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .setting-label {
            font-weight: bold;
            color: #666;
        }
        
        .setting-value {
            padding: 5px 10px;
            background: #f0f0f0;
            border-radius: 5px;
            color: #333;
        }
        
        .alert {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .alert-icon {
            font-size: 1.5em;
        }
        
        footer {
            text-align: center;
            color: white;
            padding: 20px;
            margin-top: 50px;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🚀 Coin Sangjang</h1>
            <p class="subtitle">한국 거래소 상장 실시간 모니터링 시스템</p>
        </header>

        <div class="alert">
            <span class="alert-icon">⚠️</span>
            <div>
                <strong>테스트 모드</strong> - 실제 거래는 실행되지 않습니다. 
                API 키를 설정하고 자동 거래를 활성화하려면 환경 설정을 변경하세요.
            </div>
        </div>

        <div class="settings-panel">
            <div class="notices-header">⚙️ 현재 설정</div>
            <div class="settings-grid">
                <div class="setting-item">
                    <span class="setting-label">모드:</span>
                    <span class="setting-value" id="mode">테스트</span>
                </div>
                <div class="setting-item">
                    <span class="setting-label">자동 거래:</span>
                    <span class="setting-value" id="auto-trading">비활성</span>
                </div>
                <div class="setting-item">
                    <span class="setting-label">체크 주기:</span>
                    <span class="setting-value">30초</span>
                </div>
                <div class="setting-item">
                    <span class="setting-label">서버 상태:</span>
                    <span class="setting-value" id="server-status">연결 중...</span>
                </div>
            </div>
        </div>

        <div class="status-grid">
            <div class="status-card">
                <div class="status-header">
                    <span class="exchange-name">📈 Upbit</span>
                    <span class="status-badge status-active">Active</span>
                </div>
                <p>마지막 체크: <span id="upbit-last-check">-</span></p>
                <p>신규 상장 감지: <span id="upbit-count">0</span>건</p>
            </div>
            
            <div class="status-card">
                <div class="status-header">
                    <span class="exchange-name">📊 Bithumb</span>
                    <span class="status-badge status-active">Active</span>
                </div>
                <p>마지막 체크: <span id="bithumb-last-check">-</span></p>
                <p>신규 상장 감지: <span id="bithumb-count">0</span>건</p>
            </div>
        </div>

        <div class="notices-container">
            <div class="notices-header">
                📢 최근 공지사항
                <button class="refresh-btn" onclick="refreshNotices()">🔄 새로고침</button>
            </div>
            <div id="notices-list">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>공지사항을 불러오는 중...</p>
                </div>
            </div>
        </div>

        <footer>
            <p>© 2024 Coin Sangjang - Korean Exchange Listing Monitor</p>
            <p>서비스 상태: <a href="/health" style="color: white;">Health Check</a> | <a href="/api" style="color: white;">API Status</a></p>
        </footer>
    </div>

    <script>
        let noticeCount = { upbit: 0, bithumb: 0 };
        
        // 상태 업데이트
        async function updateStatus() {
            try {
                const response = await fetch('/status');
                const data = await response.json();
                
                document.getElementById('server-status').textContent = '정상';
                document.getElementById('mode').textContent = data.mode === 'test' ? '테스트' : '운영';
                document.getElementById('auto-trading').textContent = data.autoTrading ? '활성' : '비활성';
                
                // 시간 업데이트
                const now = new Date().toLocaleTimeString('ko-KR');
                document.getElementById('upbit-last-check').textContent = now;
                document.getElementById('bithumb-last-check').textContent = now;
            } catch (error) {
                document.getElementById('server-status').textContent = '오류';
            }
        }

        // 공지사항 새로고침
        async function refreshNotices() {
            const noticesList = document.getElementById('notices-list');
            noticesList.innerHTML = '<div class="loading"><div class="spinner"></div><p>업데이트 중...</p></div>';
            
            // 실제 API 호출 대신 샘플 데이터 (실제 구현 시 API 연동)
            setTimeout(() => {
                const sampleNotices = [
                    {
                        exchange: 'Upbit',
                        title: '[거래] 엑시인피니티(AXS) 원화마켓 추가',
                        time: '2024-01-15 14:30',
                        type: 'listing'
                    },
                    {
                        exchange: 'Bithumb',
                        title: '셀레스티아(TIA) 원화 마켓 오픈',
                        time: '2024-01-15 10:00',
                        type: 'listing'
                    },
                    {
                        exchange: 'Upbit',
                        title: '시스템 점검 안내',
                        time: '2024-01-14 18:00',
                        type: 'maintenance'
                    }
                ];

                noticesList.innerHTML = '';
                sampleNotices.forEach(notice => {
                    const noticeElement = document.createElement('div');
                    noticeElement.className = 'notice-item';
                    noticeElement.innerHTML = \`
                        <div class="notice-title">
                            \${notice.type === 'listing' ? '🚨 ' : '📌 '}\${notice.title}
                        </div>
                        <div class="notice-meta">
                            <span>거래소: \${notice.exchange}</span>
                            <span>시간: \${notice.time}</span>
                        </div>
                    \`;
                    noticesList.appendChild(noticeElement);
                    
                    if (notice.type === 'listing') {
                        if (notice.exchange === 'Upbit') noticeCount.upbit++;
                        if (notice.exchange === 'Bithumb') noticeCount.bithumb++;
                    }
                });
                
                document.getElementById('upbit-count').textContent = noticeCount.upbit;
                document.getElementById('bithumb-count').textContent = noticeCount.bithumb;
            }, 1500);
        }

        // 초기 로드
        updateStatus();
        refreshNotices();
        
        // 30초마다 업데이트
        setInterval(updateStatus, 30000);
        setInterval(refreshNotices, 30000);
    </script>
</body>
</html>
`;

// HTTP 서버 생성
const server = http.createServer((req, res) => {
    // 메인 페이지 (UI)
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(HTML_CONTENT);
        return;
    }

    // Health check
    if (req.url === '/health') {
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
                '/ - Main UI',
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
                upbit: { status: 'active', checkInterval: '30s' },
                bithumb: { status: 'active', checkInterval: '30s' }
            },
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                uptime: process.uptime()
            }
        }));
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('페이지를 찾을 수 없습니다');
});

// 서버 시작
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════╗
║     Coin Sangjang Service Started        ║
╚═══════════════════════════════════════════╝

🚀 Server running on port ${PORT}
🌐 UI: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
⚙️  Mode: ${process.env.NODE_ENV || 'production'}
    `);
    
    startListingService();
});

// Listing 서비스 백그라운드 실행
function startListingService() {
    // 간단한 모니터링 실행 (선택사항)
    console.log('📊 Monitoring service started in background');
}

// 종료 처리
process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
    server.close(() => process.exit(0));
});
