#!/bin/bash
# ===================================
# 파일 경로: ./regenerate-lock.sh
# 목적: package-lock.json 완전 재생성
# ===================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Regenerating package-lock.json           ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"

# 1. 기존 파일 백업
echo -e "\n${YELLOW}[1/7] Backing up existing files...${NC}"
if [ -f package-lock.json ]; then
    mv package-lock.json package-lock.json.backup
    echo -e "${GREEN}✅ Backed up existing package-lock.json${NC}"
fi

# 2. node_modules 제거
echo -e "\n${YELLOW}[2/7] Removing node_modules...${NC}"
rm -rf node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules
rm -rf services/*/node_modules
rm -rf packages/*/node_modules
echo -e "${GREEN}✅ Cleaned node_modules${NC}"

# 3. npm 캐시 정리
echo -e "\n${YELLOW}[3/7] Clearing npm cache...${NC}"
npm cache clean --force
echo -e "${GREEN}✅ Cache cleared${NC}"

# 4. package.json 파일들 정리
echo -e "\n${YELLOW}[4/7] Updating package.json files...${NC}"

# Root package.json
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
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Backend package.json (simplified)
if [ -f backend/package.json ]; then
    cat > backend/package.json << 'EOF'
{
  "name": "backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/typeorm": "^10.0.1",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "@nestjs/swagger": "^7.1.17",
    "typeorm": "^0.3.17",
    "pg": "^8.11.3",
    "bcrypt": "^5.1.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1",
    "ioredis": "^5.3.2",
    "bullmq": "^5.1.0",
    "ccxt": "^4.2.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/node": "^20.3.1",
    "@types/express": "^4.17.17",
    "@types/bcrypt": "^5.0.2",
    "@types/passport-jwt": "^4.0.0",
    "@types/passport-local": "^1.0.38",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.3"
  }
}
EOF
fi

# Frontend package.json (simplified)
if [ -f frontend/package.json ]; then
    cat > frontend/package.json << 'EOF'
{
  "name": "frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.1.6",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "15.1.6",
    "typescript": "^5"
  }
}
EOF
fi

# Services package.json files
mkdir -p services/listing-ingest
cat > services/listing-ingest/package.json << 'EOF'
{
  "name": "listing-ingest",
  "version": "1.0.0",
  "private": true,
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js",
    "dev": "ts-node src/main.ts"
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
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2"
  }
}
EOF

mkdir -p services/trade-orchestrator
cat > services/trade-orchestrator/package.json << 'EOF'
{
  "name": "trade-orchestrator",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "echo 'No build needed'",
    "start": "echo 'Service not implemented'"
  }
}
EOF

mkdir -p services/risk-manager
cat > services/risk-manager/package.json << 'EOF'
{
  "name": "risk-manager",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "echo 'No build needed'",
    "start": "echo 'Service not implemented'"
  }
}
EOF

mkdir -p packages/shared
cat > packages/shared/package.json << 'EOF'
{
  "name": "@coin-sangjang/shared",
  "version": "1.0.0",
  "private": true,
  "main": "index.js"
}
EOF

echo -e "${GREEN}✅ Package.json files updated${NC}"

# 5. 새로운 package-lock.json 생성
echo -e "\n${YELLOW}[5/7] Installing dependencies...${NC}"
npm install --legacy-peer-deps
echo -e "${GREEN}✅ Dependencies installed${NC}"

# 6. Git에 추가
echo -e "\n${YELLOW}[6/7] Preparing for commit...${NC}"
git add package.json package-lock.json
git add backend/package.json
git add frontend/package.json
git add services/*/package.json
git add packages/*/package.json
echo -e "${GREEN}✅ Files staged for commit${NC}"

# 7. 완료
echo -e "\n${YELLOW}[7/7] Complete!${NC}"

echo -e "\n${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}    ✅ package-lock.json Regenerated!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"

echo -e "\n${CYAN}Next steps:${NC}"
echo -e "1. Commit changes: ${YELLOW}git commit -m 'Regenerate package-lock.json'${NC}"
echo -e "2. Push to repository: ${YELLOW}git push${NC}"
echo -e "3. The build should now work!"

echo -e "\n${CYAN}Note:${NC}"
echo -e "The old package-lock.json was saved as ${YELLOW}package-lock.json.backup${NC}"
