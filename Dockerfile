# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-bookworm-slim AS deps
SHELL ["/bin/bash", "-c"]
WORKDIR /workspace
ENV NODE_ENV=development \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_CACHE=/root/.npm
RUN npm install -g npm@11.5.2
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY services/listing-ingest/package.json services/listing-ingest/package.json
COPY services/trade-orchestrator/package.json services/trade-orchestrator/package.json
COPY services/risk-manager/package.json services/risk-manager/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

FROM deps AS builder
ARG TURBO_FILTERS=""
ENV NEXT_TELEMETRY_DISABLED=1 \
    TURBO_TELEMETRY_DISABLED=1 \
    CI=true \
    TURBO_CACHE_DIR=/workspace/.turbo \
    TURBO_FILTERS=$TURBO_FILTERS
COPY . .
RUN npx turbo run build

FROM builder AS final
ENV NODE_ENV=production \
    PORT=8080
EXPOSE 8080
WORKDIR /workspace/backend
CMD ["node", "dist/main"]
