#!/bin/bash
# ===================================
# 파일 위치: 프로젝트 루트
# 파일 경로: ./fix-dependencies.sh
# 목적: package-lock.json 재생성 및 의존성 문제 해결
# ===================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Fixing Dependency Issues...             ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"

# 1. 기존 node_modules와 lock 파일 제거
echo -e "\n${YELLOW}[1/5] Cleaning existing files...${NC}"
rm -rf node_modules
rm -rf package-lock.json
rm -rf backend/node_modules
rm -rf frontend/node_modules
rm -rf services/*/node_modules
rm -rf packages/*/node_modules
echo -e "${GREEN}✅ Cleaned${NC}"

# 2. npm 캐시 정리
echo -e "\n${YELLOW}[2/5] Clearing npm cache...${NC}"
npm cache clean --force
echo -e "${GREEN}✅ Cache cleared${NC}"

# 3. 루트 package.json 업데이트
echo -e "\n${YELLOW}[3/5] Updating root package.json...${NC}"
cat > package.json << 'EOF'
{
  "name": "coin-sangjang",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "backend",
    "frontend",
    "services/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "echo 'Run npm run dev in each workspace'",
    "build": "echo 'Run npm run build in each workspace'",
    "start": "pm2 start ecosystem.config.js"
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "typescript": "^5.3.3"
  }
}
EOF
echo -e "${GREEN}✅ Updated${NC}"

# 4. listing-ingest package.json 확인 및 생성
echo -e "\n${YELLOW}[4/5] Setting up listing-ingest...${NC}"
mkdir -p services/listing-ingest
cat > services/listing-ingest/package.json << 'EOF'
{
  "name": "listing-ingest",
  "version": "1.0.0",
  "private": true,
  "main": "dist/main.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js",
    "clean": "rm -rf dist"
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
echo -e "${GREEN}✅ Created${NC}"

# 5. 새로운 package-lock.json 생성
echo -e "\n${YELLOW}[5/5] Installing dependencies...${NC}"
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo -e "\n${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}    ✅ Dependencies Fixed!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Next steps:${NC}"
echo -e "1. Commit the new package-lock.json: ${BLUE}git add package-lock.json && git commit -m 'Fix dependencies'${NC}"
echo -e "2. Push to repository: ${BLUE}git push${NC}"
echo -e "3. Run setup: ${BLUE}./setup.sh${NC}"
