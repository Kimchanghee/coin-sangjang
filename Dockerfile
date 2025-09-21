# syntax=docker/dockerfile:1.7
# Shared dependency install layer mirroring the CI builder used by Cloud Build.
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-bookworm-slim AS deps
SHELL ["/bin/bash", "-c"]
WORKDIR /workspace
ENV NODE_ENV=development \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_CACHE=/root/.npm
# Align npm version with the monorepo lockfile to keep installs deterministic.
RUN npm install -g npm@11.5.2
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
# Workspace package manifests for deterministic npm ci. Update when adding new packages.
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY services/listing-ingest/package.json services/listing-ingest/package.json
COPY services/trade-orchestrator/package.json services/trade-orchestrator/package.json
COPY services/risk-manager/package.json services/risk-manager/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

# Build stage
FROM deps AS builder
ARG TURBO_FILTERS=""
ENV NEXT_TELEMETRY_DISABLED=1 \
    TURBO_TELEMETRY_DISABLED=1 \
    CI=true \
    TURBO_CACHE_DIR=/workspace/.turbo \
    TURBO_FILTERS=$TURBO_FILTERS
COPY . .
# Build all packages
RUN npx turbo run build

# ========================================
# Backend Runtime (NestJS)
# ========================================
FROM node:${NODE_VERSION}-bookworm-slim AS backend
WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --omit=dev --workspace=backend --workspace=@coin-sangjang/shared

# Copy built backend
COPY --from=builder /workspace/backend/dist ./backend/dist
COPY --from=builder /workspace/backend/node_modules ./backend/node_modules
COPY --from=builder /workspace/packages/shared ./packages/shared

# Cloud Run requires PORT environment variable
ENV PORT=8080
EXPOSE 8080

WORKDIR /app/backend
# NestJS main.js는 dist/main.js에 위치
CMD ["node", "dist/main.js"]

# ========================================
# Frontend Runtime (Next.js)
# ========================================
FROM node:${NODE_VERSION}-bookworm-slim AS frontend
WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
RUN npm ci --omit=dev --workspace=frontend

# Copy built frontend
COPY --from=builder /workspace/frontend/.next ./frontend/.next
COPY --from=builder /workspace/frontend/public ./frontend/public
COPY --from=builder /workspace/frontend/node_modules ./frontend/node_modules
COPY --from=builder /workspace/frontend/package.json ./frontend/package.json

# Next.js 설정 파일들도 복사
COPY --from=builder /workspace/frontend/next.config.ts ./frontend/next.config.ts
COPY --from=builder /workspace/frontend/next-env.d.ts ./frontend/next-env.d.ts

ENV PORT=8080
EXPOSE 8080

WORKDIR /app/frontend
# Next.js start 명령
CMD ["npx", "next", "start", "-p", "8080"]

# ========================================
# Default: Backend를 기본으로 사용
# ========================================
FROM backend AS final
