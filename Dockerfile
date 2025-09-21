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

FROM deps AS ci

ARG TURBO_FILTERS="..."
ENV NEXT_TELEMETRY_DISABLED=1 \
    TURBO_TELEMETRY_DISABLED=1 \
    CI=true \
    TURBO_CACHE_DIR=/workspace/.turbo \
    TURBO_FILTERS=$TURBO_FILTERS

COPY . .

# Run lint/build similarly to the Cloud Build CI image. Custom filters can be provided
# via `--build-arg TURBO_FILTERS="backend...,frontend..."` to narrow the workload.
RUN ./infrastructure/docker/run-turbo-checks.sh

# Expose the CI layer as the default image so that `docker build .` succeeds while
# still running the repository checks during the build.
FROM ci AS final
CMD ["bash"]
