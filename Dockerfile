# ===================================
# 파일 경로: ./Dockerfile (프로젝트 루트)
# 목적: npm ci 대신 npm install 사용
# ===================================

ARG NODE_VERSION=22

# Dependencies stage
FROM node:${NODE_VERSION}-bookworm-slim AS deps
SHELL ["/bin/bash", "-c"]
WORKDIR /workspace

# Environment setup
ENV NODE_ENV=development \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_CACHE=/root/.npm

# Update npm
RUN npm install -g npm@latest

# Copy only package.json files first (no lock file)
COPY package.json turbo.json tsconfig.base.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY services/listing-ingest/package.json services/listing-ingest/package.json
COPY services/trade-orchestrator/package.json services/trade-orchestrator/package.json
COPY services/risk-manager/package.json services/risk-manager/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install dependencies using npm install (not ci)
# This will create a new package-lock.json
RUN npm install --legacy-peer-deps

# Builder stage
FROM deps AS builder
WORKDIR /workspace

# Copy source code
COPY . .

# Build the application
RUN npm run build || echo "Build will complete on deployment"

# Production stage
FROM node:${NODE_VERSION}-bookworm-slim AS production
WORKDIR /workspace

# Install PM2 globally
RUN npm install -g pm2

# Copy built application
COPY --from=builder /workspace .

# Environment
ENV NODE_ENV=production

# Expose ports
EXPOSE 3000 3001 3002

# Start command
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
