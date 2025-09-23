#!/bin/bash
# ===================================
# 파일 위치: 프로젝트 루트 디렉토리에 생성
# 파일 경로: ./start.sh
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
echo "║    🚀 Starting Coin Sangjang Services 🚀   ║"
echo "║                                           ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# 환경변수 파일 체크
check_env_file() {
    if [ ! -f "$1" ]; then
        echo -e "${RED}❌ Error: $1 not found!${NC}"
        echo -e "${YELLOW}   Please create the environment file first${NC}"
        return 1
    fi
    return 0
}

echo -e "${YELLOW}[1/6] Checking environment files...${NC}"

# Backend .env 체크 및 생성
if ! check_env_file "backend/.env"; then
    echo -e "${YELLOW}Creating backend/.env...${NC}"
    cat > backend/.env << 'EOF'
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=StrongPassword123!
DATABASE_NAME=coin_sangjang

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_ACCESS_SECRET=jwt_access_secret_2024_change_this
JWT_REFRESH_SECRET=jwt_refresh_secret_2024_change_this
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

# Trading Settings
DEFAULT_TRADE_AMOUNT_USDT=100
DEFAULT_LEVERAGE=10
DEFAULT_STOP_LOSS_PERCENT=5
DEFAULT_TAKE_PROFIT_PERCENT=20
ENABLE_AUTO_TRADING=false
ENABLE_TEST_MODE=true

# Exchange API Keys (MUST CHANGE!)
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
else
    echo -e "${GREEN}✅ backend/.env found${NC}"
fi

# Frontend .env.local 체크 및 생성
if ! check_env_file "frontend/.env.local"; then
    echo -e "${YELLOW}Creating frontend/.env.local...${NC}"
    cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_LISTING_WS=ws://localhost:3002
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=CoinSangjang
NEXT_PUBLIC_ENABLE_TESTNET=true
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
EOF
    echo -e "${GREEN}✅ Created frontend/.env.local${NC}"
else
    echo -e "${GREEN}✅ frontend/.env.local found${NC}"
fi

# API 키 확인
echo -e "\n${YELLOW}[2/6] Checking API keys configuration...${NC}"
if grep -q "your_.*_api_key_here" backend/.env; then
    echo -e "${MAGENTA}⚠️  Warning: Exchange API keys not configured!${NC}"
    echo -e "${YELLOW}   The system will run but won't execute real trades.${NC}"
    echo -e "${YELLOW}   Edit backend/.env to add your API keys.${NC}"
else
    echo -e "${GREEN}✅ API keys configured${NC}"
fi

# Docker 서비스 시작
echo -e "\n${YELLOW}[3/6] Starting Docker services...${NC}"
if command -v docker &> /dev/null; then
    # Docker Compose 파일 확인
    if [ ! -f docker-compose.yml ]; then
        echo -e "${YELLOW}docker-compose.yml not found, creating...${NC}"
        cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: coin-sangjang-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: StrongPassword123!
      POSTGRES_DB: coin_sangjang
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - coin-network

  redis:
    image: redis:7-alpine
    container_name: coin-sangjang-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - coin-network
    command: redis-server --appendonly yes

networks:
  coin-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
EOF
        echo -e "${GREEN}✅ Created docker-compose.yml${NC}"
    fi
    
    # PostgreSQL과 Redis 시작
    echo -e "${YELLOW}   Starting PostgreSQL and Redis...${NC}"
    docker-compose up -d postgres redis
    
    # 서비스가 준비될 때까지 대기
    echo -e "${YELLOW}   Waiting for services to be ready...${NC}"
    sleep 5
    echo -e "${GREEN}✅ Docker services started${NC}"
else
    echo -e "${YELLOW}⚠️  Docker not found. Make sure PostgreSQL and Redis are running manually.${NC}"
fi

# 디렉토리 생성
echo -e "\n${YELLOW}[4/6] Creating directories...${NC}"
mkdir -p logs
mkdir -p data
echo -e "${GREEN}✅ Directories created${NC}"

# TypeScript 빌드
echo -e "\n${YELLOW}[5/6] Building applications...${NC}"

# Listing service 빌드
echo -e "${YELLOW}   Building listing service...${NC}"
if [ -d "services/listing-ingest" ]; then
    cd services/listing-ingest
    
    # package.json 확인
    if [ ! -f "package.json" ]; then
        echo -e "${YELLOW}   Creating package.json for listing service...${NC}"
        cat > package.json << 'EOF'
{
  "name": "listing-ingest",
  "version": "1.0.0",
  "main": "dist/main.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js",
    "start:dev": "ts-node src/main.ts"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "bullmq": "^5.1.0",
    "cheerio": "^1.0.0-rc.12",
    "dotenv": "^16.3.1",
    "ioredis": "^5.3.2",
    "ws": "^8.16.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@types/ws": "^8.5.10",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
EOF
    fi
    
    # TypeScript 설정 확인
    if [ ! -f "tsconfig.json" ]; then
        echo -e "${YELLOW}   Creating tsconfig.json...${NC}"
        cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
    fi
    
    # 의존성 설치
    echo -e "${YELLOW}   Installing dependencies...${NC}"
    npm install
    
    # 빌드
    echo -e "${YELLOW}   Building TypeScript...${NC}"
    npm run build || {
        echo -e "${RED}❌ Build failed${NC}"
        cd ../..
        exit 1
    }
    
    cd ../..
    echo -e "${GREEN}✅ Listing service built${NC}"
else
    echo -e "${RED}❌ services/listing-ingest directory not found${NC}"
    exit 1
fi

# PM2로 서비스 시작
echo -e "\n${YELLOW}[6/6] Starting services with PM2...${NC}"

# PM2 설치 확인
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
fi

# 기존 프로세스 정리
pm2 delete all 2>/dev/null || true

# PM2로 서비스 시작
pm2 start ecosystem.config.js

# 시작 완료 대기
sleep 3

# 서비스 상태 확인
pm2 status

# 완료 메시지
echo -e "\n${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}    ✅ All Services Started Successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"

# 설정 정보 출력
TRADING_MODE=$(grep "ENABLE_AUTO_TRADING" backend/.env | cut -d'=' -f2)
TEST_MODE=$(grep "ENABLE_TEST_MODE" backend/.env | cut -d'=' -f2)

echo -e "\n${CYAN}📊 Current Configuration:${NC}"
echo -e "   Auto Trading: ${YELLOW}${TRADING_MODE:-false}${NC}"
echo -e "   Test Mode:    ${YELLOW}${TEST_MODE:-true}${NC}"

echo -e "\n${CYAN}🌐 Access URLs:${NC}"
echo -e "   Frontend:  ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend:   ${GREEN}http://localhost:3001${NC}"

echo -e "\n${CYAN}📋 Commands:${NC}"
echo -e "   View logs:    ${BLUE}pm2 logs${NC}"
echo -e "   View status:  ${BLUE}pm2 status${NC}"
echo -e "   Stop all:     ${BLUE}pm2 stop all${NC}"
echo -e "   Restart:      ${BLUE}pm2 restart all${NC}"

echo -e "\n${GREEN}🚀 System is running!${NC}\n"
