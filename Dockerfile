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

# CI/Build stage
FROM deps AS ci
ARG TURBO_FILTERS=""
ENV NEXT_TELEMETRY_DISABLED=1 \
    TURBO_TELEMETRY_DISABLED=1 \
    CI=true \
    TURBO_CACHE_DIR=/workspace/.turbo \
    TURBO_FILTERS=$TURBO_FILTERS
COPY . .
# Run lint/build similarly to the Cloud Build CI image. Custom filters can be provided
# via `--build-arg TURBO_FILTERS="backend frontend"` to narrow the workload.
RUN ./infrastructure/docker/run-turbo-checks.sh

# Production stage for backend
FROM node:${NODE_VERSION}-bookworm-slim AS backend-runtime
WORKDIR /workspace
ENV NODE_ENV=production
# 필요한 파일들만 복사
COPY --from=ci /workspace/package*.json ./
COPY --from=ci /workspace/turbo.json ./
COPY --from=ci /workspace/backend ./backend
COPY --from=ci /workspace/packages ./packages
COPY --from=ci /workspace/node_modules ./node_modules
COPY --from=ci /workspace/backend/node_modules ./backend/node_modules
# PORT 환경변수 설정 (Cloud Run에서 자동으로 설정하지만 기본값 제공)
ENV PORT=8080
EXPOSE 8080
WORKDIR /workspace/backend
# NestJS 애플리케이션 실행
CMD ["node", "dist/main"]

# Production stage for frontend (Next.js)
FROM node:${NODE_VERSION}-bookworm-slim AS frontend-runtime
WORKDIR /workspace
ENV NODE_ENV=production
# 필요한 파일들만 복사
COPY --from=ci /workspace/package*.json ./
COPY --from=ci /workspace/turbo.json ./
COPY --from=ci /workspace/frontend ./frontend
COPY --from=ci /workspace/packages ./packages
COPY --from=ci /workspace/node_modules ./node_modules
COPY --from=ci /workspace/frontend/node_modules ./frontend/node_modules
COPY --from=ci /workspace/frontend/.next ./frontend/.next
# PORT 환경변수 설정
ENV PORT=8080
EXPOSE 8080
WORKDIR /workspace/frontend
# Next.js 애플리케이션 실행
CMD ["npm", "run", "start"]

# 기본적으로 backend를 실행하도록 설정
# Cloud Run 배포 시 --target 옵션으로 선택 가능
FROM backend-runtime AS final
