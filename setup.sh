#!/bin/bash
# ===================================
# 파일 위치: 프로젝트 루트 디렉토리에 생성
# 파일 경로: ./setup.sh
# 파일 타입: 새로 생성
# ===================================

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로고 출력
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════╗"
echo "║                                           ║"
echo "║      🚀 Coin Sangjang Setup Script 🚀      ║"
echo "║                                           ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# 1. Node.js 확인
echo -e "${YELLOW}[1/8] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo -e "${CYAN}Please install Node.js v18+ from https://nodejs.org/${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION}${NC}"

# 2. NPM 확인
echo -e "\n${YELLOW}[2/8] Checking NPM...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ NPM is not installed${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ NPM ${NPM_VERSION}${NC}"

# 3. PM2 설치
echo -e "\n${YELLOW}[3/8] Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
else
    PM2_VERSION=$(pm2 -v)
    echo -e "${GREEN}✅ PM2 ${PM2_VERSION}${NC}"
fi

# 4. 디렉토리 생성
echo -e "\n${YELLOW}[4/8] Creating directories...${NC}"
mkdir -p logs
mkdir -p data
mkdir -p services/listing-ingest/src/collectors
mkdir -p backend
mkdir -p frontend
mkdir -p infrastructure/sql
echo -e "${GREEN}✅ Directories created${NC}"

# 5. 기본 package.json 생성 (루트)
echo -e "\n${YELLOW}[5/8] Creating root package.json...${NC}"
if [ ! -f "package.json" ]; then
    cat > package.json << 'EOF'
{
  "name": "coin-sangjang",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "backend",
    "frontend",
    "services/*"
  ],
  "scripts": {
    "dev": "echo 'Run npm run dev in each workspace'",
    "build": "echo 'Run npm run build in each workspace'",
    "start": "pm2 start ecosystem.config.js"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
EOF
    echo -e "${GREEN}✅ Created package.json${NC}"
fi

# 6. 환경변수 파일 생성
echo -e "\n${YELLOW}[6/8] Creating environment files...${NC}"

# Backend .env
if [ ! -f "backend/.env" ]; then
    cat > backend/.env << 'EOF'
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=StrongPassword123!
DATABASE_NAME=coin_sangjang

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_ACCESS_SECRET=jwt_secret_2024_change_this
JWT_REFRESH_SECRET=jwt_refresh_2024_change_this
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# Application
PORT=3001
WS_PORT=3002
NODE_ENV=production
BACKEND_API_URL=http://localhost:3001

# Korean Exchanges
UPBIT_API_URL=https://api.upbit.com
UPBIT_WEBSOCKET_URL=wss://api.upbit.com/websocket/v1
UPBIT_NOTICE_URL=https://api-manager.upbit.com
BITHUMB_API_URL=https://api.bithumb.com

# Trading
DEFAULT_TRADE_AMOUNT_USDT=100
DEFAULT_LEVERAGE=10
DEFAULT_STOP_LOSS_PERCENT=5
DEFAULT_TAKE_PROFIT_PERCENT=20
ENABLE_AUTO_TRADING=false
ENABLE_TEST_MODE=true

# Exchange API Keys - CHANGE THESE!
BINANCE_API_KEY=your_binance_api_key_here
BINANCE_SECRET_KEY=your_binance_secret_key_here
BINANCE_TESTNET=false

BYBIT_API_KEY=your_bybit_api_key_here
BYBIT_SECRET_KEY=your_bybit_secret_key_here
BYBIT_TESTNET=false

OKX_API_KEY=your_okx_api_key_here
OKX_SECRET_KEY=your_okx_secret_key_here
OKX_PASSPHRASE=your_okx_passphrase_here
OKX_TESTNET=false

GATE_API_KEY=your_gate_api_key_here
GATE_SECRET_KEY=your_gate_secret_key_here
GATE_TESTNET=false

BITGET_API_KEY=your_bitget_api_key_here
BITGET_SECRET_KEY=your_bitget_secret_key_here
BITGET_PASSPHRASE=your_bitget_passphrase_here
BITGET_TESTNET=false
EOF
    echo -e "${GREEN}✅ Created backend/.env${NC}"
    echo -e "${MAGENTA}⚠️  Remember to add your exchange API keys to backend/.env${NC}"
fi

# Frontend .env.local
if [ ! -f "frontend/.env.local" ]; then
    cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_LISTING_WS=ws://localhost:3002
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=CoinSangjang
EOF
    echo -e "${GREEN}✅ Created frontend/.env.local${NC}"
fi

# 7. Docker Compose 파일 생성
echo -e "\n${YELLOW}[7/8] Creating docker-compose.yml...${NC}"
if [ ! -f "docker-compose.yml" ]; then
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: coin-sangjang-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: StrongPassword123!
      POSTGRES_DB: coin_sangjang
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: coin-sangjang-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:
EOF
    echo -e "${GREEN}✅ Created docker-compose.yml${NC}"
fi

# 8. NPM 설치
echo -e "\n${YELLOW}[8/8] Installing dependencies...${NC}"
npm install

# 완료 메시지
echo -e "\n${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}        ✅ Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}📋 Next Steps:${NC}"
echo -e "1. ${YELLOW}Add your exchange API keys:${NC}"
echo -e "   ${BLUE}nano backend/.env${NC}"
echo ""
echo -e "2. ${YELLOW}Start the services:${NC}"
echo -e "   ${BLUE}./start.sh${NC}"
echo ""
echo -e "3. ${YELLOW}Check logs:${NC}"
echo -e "   ${BLUE}pm2 logs${NC}"

echo -e "\n${GREEN}Ready to start! Run: ${BLUE}./start.sh${NC}\n"
