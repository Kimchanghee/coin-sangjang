# ===================================
# 파일 경로: ./Dockerfile (프로젝트 루트)
# 목적: Google Cloud Run 배포용
# ===================================

ARG NODE_VERSION=20

# Dependencies stage
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY services/listing-ingest/package*.json ./services/listing-ingest/
COPY services/trade-orchestrator/package*.json ./services/trade-orchestrator/
COPY services/risk-manager/package*.json ./services/risk-manager/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install --legacy-peer-deps

# Production stage
FROM node:${NODE_VERSION}-alpine
WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy application
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript files
RUN cd services/listing-ingest && \
    npm install -g typescript && \
    npx tsc || echo "TypeScript build skipped"

# Create minimal backend .env
RUN echo "PORT=8080" > backend/.env && \
    echo "REDIS_HOST=localhost" >> backend/.env && \
    echo "REDIS_PORT=6379" >> backend/.env && \
    echo "ENABLE_AUTO_TRADING=false" >> backend/.env && \
    echo "ENABLE_TEST_MODE=true" >> backend/.env

# Cloud Run requires PORT environment variable
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Build the Next.js frontend while devDependencies such as TypeScript remain
# available, then prune them so the final image stays lean.
RUN npm run build --workspace frontend \
  && npm prune --omit=dev

# Start Next.js server for Cloud Run
CMD ["npm", "run", "start", "--workspace", "frontend"]
