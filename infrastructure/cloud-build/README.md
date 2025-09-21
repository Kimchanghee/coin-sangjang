# Cloud Build Pipelines

This directory contains the Docker tooling and build configurations that package the monorepo for Google Cloud Build and Cloud Run deployments.

## Files

- `Dockerfile.ci` – reproducible builder image that runs `turbo run lint`/`turbo run build` inside Cloud Build before packaging. It accepts a comma separated `TURBO_FILTERS` build arg (for example `backend...,frontend...`).
- `backend.yaml` – builds and tags the NestJS API container.
- `frontend.yaml` – builds and tags the Next.js application container.
- `workers.yaml` – builds the three worker services (`listing-ingest`, `trade-orchestrator`, `risk-manager`).

All pipelines rely on the Dockerfiles under `infrastructure/docker/` and respect the root `.dockerignore` so that local build artefacts and `node_modules` are excluded from the Cloud Build context.

## Prerequisites

1. Artifact Registry repositories (defaults assume `coin-sangjang-backend`, `coin-sangjang-frontend`, and `coin-sangjang-workers`).
2. Cloud Build Service Account with permissions to read the repository and push to Artifact Registry.
3. (Optional) Override `_PROMOTE_TAG` if you want tags other than `latest`.

## Usage

Run the pipelines with `gcloud builds submit` from the repository root. You can override any substitution defined in each YAML file. Examples:

```bash
# Backend API
gcloud builds submit \
  --config infrastructure/cloud-build/backend.yaml \
  --substitutions=_REGION=asia-northeast3,_PROMOTE_TAG=staging

# Frontend
gcloud builds submit \
  --config infrastructure/cloud-build/frontend.yaml \
  --substitutions=_REGION=asia-northeast3

# Worker images
gcloud builds submit \
  --config infrastructure/cloud-build/workers.yaml \
  --substitutions=_REGION=asia-northeast3,_PROMOTE_TAG=staging
```

Each build step automatically tags images with both `$COMMIT_SHA` and the `_PROMOTE_TAG` value so they can be promoted between environments. Override `_TURBO_FILTERS` if you need to narrow the scope of the monorepo tasks executed during the CI verification stage.
