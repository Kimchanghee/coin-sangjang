#!/bin/bash
# ===================================
# 파일 위치: 프로젝트 루트
# 파일 경로: ./quick-start.sh
# 목적: Docker 없이 빠르게 listing 서비스만 실행
# ===================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    Quick Start - Listing Service Only     ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"

# 1. Redis 확인 (필수)
echo -e "\n${YELLOW}[1/5] Checking Redis...${NC}"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✅ Redis is running${NC}"
    else
        echo -e "${YELLOW}Starting Redis...${NC}"
        if command -v docker &> /dev/null; then
            docker run -d --name redis-quick -p 6379:6379 redis:alpine
            sleep 2
            echo -e "${GREEN}✅ Redis started in Docker${NC}"
        else
            echo -e "${RED}❌ Redis not running. Please start Redis first.${NC}"
            echo -e "${CYAN}Install: sudo apt install redis-server (Ubuntu)${NC}"
            echo -e "${CYAN}Or: brew install redis (Mac)${NC}"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Redis CLI not found, assuming Redis is running${NC}"
fi

# 2. 환경변수 파일 생성
echo -e "\n${YELLOW}[2/5] Setting up environment...${NC}"
mkdir -p backend
if [ ! -f "backend/.env" ]; then
    cat > backend/.env << 'EOF'
# Minimal configuration for listing service
REDIS_HOST=localhost
REDIS_PORT=6379
BACKEND_API_URL=http://localhost:3001

# Korean Exchanges
UPBIT_API_URL=https://api.upbit.com
UPBIT_WEBSOCKET_URL=wss://api.upbit.com/websocket/v1
UPBIT_NOTICE_URL=https://api-manager.upbit.com
BITHUMB_API_URL=https://api.bithumb.com

# Trading Settings (Test Mode)
ENABLE_AUTO_TRADING=false
ENABLE_TEST_MODE=true
DEFAULT_TRADE_AMOUNT_USDT=100
DEFAULT_LEVERAGE=10
DEFAULT_STOP_LOSS_PERCENT=5
DEFAULT_TAKE_PROFIT_PERCENT=20
EOF
    echo -e "${GREEN}✅ Created backend/.env${NC}"
fi

# 3. Listing service 설정
echo -e "\n${YELLOW}[3/5] Setting up listing service...${NC}"
cd services/listing-ingest

# package.json 확인
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found in services/listing-ingest${NC}"
    exit 1
fi

# 4. 의존성 설치
echo -e "\n${YELLOW}[4/5] Installing dependencies...${NC}"
npm install

# 5. TypeScript 빌드 및 실행
echo -e "\n${YELLOW}[5/5] Building and starting service...${NC}"
npm run build

echo -e "\n${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}    ✅ Starting Listing Monitor!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Configuration:${NC}"
echo -e "  Mode: ${YELLOW}TEST MODE (No real trading)${NC}"
echo -e "  Monitoring: ${GREEN}Upbit & Bithumb${NC}"
echo -e "  Check Interval: ${GREEN}30 seconds${NC}"

echo -e "\n${CYAN}Starting service...${NC}\n"

# 서비스 실행
npm start
