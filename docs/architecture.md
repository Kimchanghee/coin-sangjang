# Coin-Sangjang Architecture Overview

## Goals
- Detect Korean exchange listing announcements in real time and trigger automated derivatives trades on supported global exchanges (Binance, Bybit, OKX, Gate.io, Bitget).
- Provide a secure, multilingual web UI for strategy configuration, manual overrides, and administrator-controlled onboarding.
- Offer both testnet and mainnet connectivity, leverage controls, and configurable risk management (TP/SL) for each exchange account.
- Deliver a responsive experience with independent layouts for mobile and desktop, plus designated advertising placements and multi-language content management.
- Enable containerized deployment with automated pipelines targeting Google Cloud (Cloud Run & Cloud SQL) through Dockerized services.

## High-Level Architecture
```
[Upbit WS]   [Bithumb WS]                [Binance, Bybit, OKX, Gate, Bitget REST/WS]
       \         /                                   /
    Listing Ingest Service --> Event Bus (Pub/Sub) --> Trade Orchestrator --> Exchange Execution Adapters
                                               |             |
                                               |             --> Risk Manager (leverage, TP/SL, account state)
                                               |
                                              API Gateway / Backend (NestJS) --> PostgreSQL (Cloud SQL)
                                               |
                              Admin & User Auth Service --> Redis (Session Cache)
                                               |
                            Frontend (Next.js/React, 15 language bundles)
                                               |
                      Cloud Storage (GCS) for static language files & banners

Observability: Cloud Logging, Error Reporting, Prometheus exporters, Grafana dashboards
CI/CD: Cloud Build -> Artifact Registry -> Cloud Run deployments
```

## Backend Components
- **API Gateway (NestJS/TypeScript)**: central REST + WebSocket API; manages auth, admin workflows, multilingual content delivery, and user strategy configurations.
- **Listing Ingest Service (Node.js worker)**: maintains websocket connections to Upbit/Bithumb announcement feeds; normalizes listing events; deduplicates; publishes to Pub/Sub topic.
- **Trade Orchestrator (Node.js worker)**: consumes listing events, queries exchange adapters for contract availability, computes position sizing (USDT-based), sets leverage, places market entries, and registers TP/SL orders; supports dry-run/testnet and mainnet modes per user profile.
- **Exchange Execution Adapters**: modular drivers per exchange (REST + WebSocket) with API key management, account syncing, and unified request throttling. Each adapter handles both testnet/mainnet base URLs and signature schemes.
- **Risk Manager Module**: enforces user-defined leverage limits, auto-cancels conflicting orders, monitors fill status, and triggers TP/SL closures. Integrates with Pub/Sub + Redis for low-latency state.
- **Admin Service**: handles UID registration workflows; admins approve users + assign exchange UIDs; exposes admin-only dashboard endpoints.

## Frontend
- **Next.js 14 App Router** with React 18, TailwindCSS (or Chakra UI) for component styling, supporting per-device layout through responsive design and device-specific routes/layout overrides.
- **Internationalization**: `next-intl` or `react-intl` with static JSON bundles per language stored under `frontend/i18n/{lang}/`. Minimum set: Korean, English, Japanese, Chinese (Simplified), Thai, Vietnamese, Spanish, Portuguese, Hindi + 6 additional locales (e.g., Indonesian, German, French, Russian, Turkish, Arabic).
- **Pages**: Landing with banner slots, usage guide/intro per language, dashboard (signals, account controls), admin request form, admin approval panel.
- **Realtime Updates** via WebSocket or SSE to show listing alerts and order status.
- **Responsive**: Dedicate layout components `DesktopLayout` and `MobileLayout`, switching via media queries + user agent detection.

## Data Storage & Models
- **PostgreSQL (Cloud SQL)**: users, admin approvals, exchange credentials (encrypted), strategy settings, trade logs, localization metadata.
- **Secret Manager**: store encrypted API keys per user; backend fetches short-lived credentials.
- **Redis (MemoryStore)**: session cache, rate limiting, real-time state for active trades.
- **Google Cloud Storage**: static assets (language bundles, admin-uploaded banners).

Key Entities:
- `User`: profile, locale, admin-approved flag, associated exchange UIDs.
- `ExchangeAccount`: references user, exchange type, mode (test/main), API credentials, leverage defaults.
- `StrategyConfig`: per user/exchange settings for TP/SL, auto-trade toggles, amount rules.
- `ListingEvent`: normalized event record (source, coin symbol, timestamp, metadata, processed flags).
- `TradeOrder`: tracks orders placed, fill status, closes, PnL.

## Security & Compliance
- JWT-based auth with 2FA optional (email/SMS). Admin endpoints behind role checks.
- Encrypt API keys at rest using Cloud KMS; rotate via background jobs.
- Auditing: log all trade actions and admin approvals.
- Rate-limit user actions to prevent abuse; implement replay protection for webhook/websocket triggers.

## Deployment & DevOps
- **Docker**: multi-stage builds for backend, workers, and frontend static export.
- **Google Cloud Build** pipelines triggered via GitHub; pushes to Artifact Registry.
- **Cloud Run** services**:** `api-gateway`, `listing-ingest`, `trade-orchestrator`, `admin-portal`, `jobs`.
- **Pub/Sub** topics**:** `listing.raw`, `listing.processed`, `orders.executed`.
- **Cloud Scheduler** for periodic tasks (credential rotation, health checks).
- **Infrastructure-as-Code**: Terraform configs under `infrastructure/terraform` to manage Cloud SQL, Pub/Sub, Cloud Run, IAM, Secret Manager.

## Testing Strategy
- Unit tests (Jest) for NestJS services and exchange adapters using mocked HTTP/WS servers.
- Integration tests using docker-compose to spin up PostgreSQL + Redis + mock exchange endpoints.
- E2E smoke tests that simulate listing events and validate order placement paths in testnet using exchange sandbox APIs.
- Frontend testing with Playwright for critical flows (login, admin approval, trade config updates).

## Roadmap (High-Level)
1. **Foundation**: initialize repo with monorepo tooling (Nx or Turbo), base NestJS & Next.js apps, Dockerfiles, lint/test config.
2. **Auth & Admin**: implement user onboarding, admin approval flows, basic UI, role-based access.
3. **Listings Pipeline**: build ingest service with Upbit/Bithumb websocket listeners, normalization, Pub/Sub integration, store events.
4. **Trading Core**: implement exchange adapters (start with Binance testnet), orchestrator, risk manager, TP/SL logic.
5. **Frontend Dashboard**: multilingual landing, usage guide, trading controls, live alerts, banner management.
6. **Multi-Exchange Support**: extend adapters to Bybit, OKX, Gate.io, Bitget; finalize testnet/mainnet toggles.
7. **Observability & Hardening**: metrics, alerting, security audits, compliance checks.
8. **CI/CD & IaC**: finish Terraform, Cloud Build triggers, environment promotion workflows.

## Open Questions
- Clarify exact source for "listing" websocket feeds; both Upbit and Bithumb require scraping or bridging REST -> custom WS.
- Confirm leverage + position sizing logic and default safety limits.
- Define admin approval SLA and notification channel (email, SMS?).
- Determine supported order types (market only, or limit?) and hedging strategy for already listed coins.

