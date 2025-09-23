#!/bin/bash
# ===================================
# 파일 위치: 프로젝트 루트 디렉토리에 생성
# 파일 경로: ./stop.sh
# 파일 타입: 새로 생성
# ===================================

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}Stopping Coin Sangjang Services...${NC}"

# PM2 프로세스 중지
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Stopping PM2 processes...${NC}"
    pm2 stop all
    pm2 delete all
    echo -e "${GREEN}✅ PM2 processes stopped${NC}"
else
    echo -e "${YELLOW}PM2 not found${NC}"
fi

# Docker 컨테이너 중지
if command -v docker &> /dev/null; then
    echo -e "${YELLOW}Stopping Docker containers...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Docker containers stopped${NC}"
else
    echo -e "${YELLOW}Docker not found${NC}"
fi

echo -e "${GREEN}All services stopped!${NC}"
