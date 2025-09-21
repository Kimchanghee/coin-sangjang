# Docker Images

- `Dockerfile.backend`: NestJS API service, exposed on port 3000.
- `Dockerfile.frontend`: Next.js application served via `next start` on port 3000.
- `Dockerfile.listing-ingest`: Worker that streams listing events to the backend API.
- `Dockerfile.trade-orchestrator`: Trade orchestration worker consuming BullMQ jobs.
- `Dockerfile.risk-manager`: Risk policy worker (placeholder).

Build example:

```bash
# Backend
docker build -f infrastructure/docker/Dockerfile.backend -t coin-sangjang-backend .

# Frontend
docker build -f infrastructure/docker/Dockerfile.frontend -t coin-sangjang-frontend .
```
