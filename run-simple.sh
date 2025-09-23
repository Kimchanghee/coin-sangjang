#!/bin/bash
# ===================================
# 파일 경로: ./run-simple.sh
# 목적: 최소한의 설정으로 listing 서비스만 실행
# ===================================

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}Simple Run - Listing Monitor Only${NC}"
echo -e "${CYAN}══════════════════════════════════${NC}"

# 1. 디렉토리 생성
mkdir -p services/listing-ingest/src/collectors
mkdir -p services/listing-ingest/dist
mkdir -p backend

# 2. 최소 환경변수 생성
if [ ! -f backend/.env ]; then
    cat > backend/.env << 'EOF'
REDIS_HOST=localhost
REDIS_PORT=6379
ENABLE_AUTO_TRADING=false
ENABLE_TEST_MODE=true
EOF
fi

# 3. listing 서비스로 이동
cd services/listing-ingest

# 4. package.json 생성
cat > package.json << 'EOF'
{
  "name": "listing-ingest",
  "version": "1.0.0",
  "scripts": {
    "start": "node dist/main.js",
    "build": "tsc || echo 'TypeScript not found, using JavaScript'",
    "dev": "node src/main.js"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "cheerio": "^1.0.0-rc.12",
    "dotenv": "^16.3.1"
  }
}
EOF

# 5. 간단한 모니터 스크립트 생성 (JavaScript)
cat > src/simple-monitor.js << 'EOF'
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config({ path: '../../backend/.env' });

console.log('🚀 Simple Coin Listing Monitor');
console.log('================================');
console.log('Mode: TEST (No trading)');
console.log('Monitoring: Upbit & Bithumb');
console.log('================================\n');

// Upbit 체크
async function checkUpbit() {
    try {
        console.log('[Upbit] Checking notices...');
        const response = await axios.get('https://api-manager.upbit.com/api/v1/notices', {
            params: { page: 1, per_page: 5 }
        });
        const notices = response.data?.data?.list || [];
        
        notices.forEach(notice => {
            if (notice.title.includes('상장') || notice.title.includes('거래')) {
                console.log(`📢 [Upbit] ${notice.title}`);
            }
        });
    } catch (error) {
        console.error('[Upbit] Error:', error.message);
    }
}

// Bithumb 체크
async function checkBithumb() {
    try {
        console.log('[Bithumb] Checking notices...');
        const response = await axios.get('https://cafe.bithumb.com/view/boards/43');
        const $ = cheerio.load(response.data);
        
        $('.board-list tbody tr').slice(0, 5).each((i, el) => {
            const title = $(el).find('td.one-line a').text().trim();
            if (title && (title.includes('상장') || title.includes('거래'))) {
                console.log(`📢 [Bithumb] ${title}`);
            }
        });
    } catch (error) {
        console.error('[Bithumb] Error:', error.message);
    }
}

// 메인 루프
async function monitor() {
    await checkUpbit();
    await checkBithumb();
    console.log('\n⏰ Next check in 30 seconds...\n');
}

// 시작
monitor();
setInterval(monitor, 30000);

console.log('Press Ctrl+C to stop\n');
EOF

# 6. 의존성 설치
echo -e "${YELLOW}Installing minimal dependencies...${NC}"
npm install --no-save axios cheerio dotenv 2>/dev/null || {
    echo -e "${YELLOW}Dependencies may need manual installation${NC}"
}

# 7. 실행
echo -e "\n${GREEN}Starting monitor...${NC}\n"
node src/simple-monitor.js
