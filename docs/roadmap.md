# Implementation Roadmap

## Phase 0 - Tooling & Foundations (Week 1)
- Establish monorepo tooling (Nx or Turborepo) with shared TypeScript configs.
- Configure linting (ESLint), formatting (Prettier), commit hooks (Husky), and GitHub Actions for PR lint/test gates.
- Provision local docker-compose stack (Postgres, Redis, Mock Exchange, Pub/Sub emulator).
- Write baseline Terraform modules for VPC, Cloud SQL instance, Artifact Registry, Pub/Sub topics, Secret Manager skeleton.

## Phase 1 - Auth & Admin Core (Weeks 2-3)
- Implement NestJS auth module (JWT + refresh tokens, bcrypt passwords, optional 2FA).
- Create admin approval workflow: user registration, UID submission, admin review endpoints, email notifications.
- Frontend: build onboarding pages, admin dashboard, and language switcher with stub translations for all 15 locales.
- Add RBAC middleware and integration tests covering approval required state.

## Phase 2 - Listing Pipeline (Weeks 3-4)
- Develop Upbit/Bithumb websocket/HTTP pollers; normalize payloads to unified `ListingEvent` shape.
- Integrate Google Pub/Sub publisher; persist events to Postgres; expose feed via backend WebSocket.
- Create monitoring alerts for feed downtime; implement replay/backfill jobs.
- Frontend: render real-time listing ticker and history view.

## Phase 3 - Trading MVP (Weeks 4-6)
- Build Binance futures adapter (testnet first): auth signatures, contract lookup, leverage setting, market entry, TP/SL orders.
- Trade orchestrator service listens to `listing.processed` events, checks symbol availability, computes order size (USDT-based) and executes trades.
- Implement risk manager with configurable leverage caps, order dedupe, and fail-safe stop cancellations.
- Store trade lifecycle in Postgres; push updates to frontend.
- Add Jest + integration tests using Binance testnet sandbox.

## Phase 4 - Multi-Exchange Expansion (Weeks 6-8)
- Extend adapters for Bybit, OKX, Gate.io, Bitget (testnet + mainnet toggles per account).
- Unify credential storage with Secret Manager integration and rotation jobs.
- Build UI controls for per-exchange activation, leverage, TP/SL, and account health.
- Expand orchestrator logic to fail over between exchanges and support parallel entries.

## Phase 5 - UX Polish & Content (Weeks 8-9)
- Complete multilingual pages with localized usage guide and introduction sections.
- Add dedicated banner management in admin UI; allow scheduling ads per language/device.
- Finalize responsive layouts with separate mobile/desktop templates and QA across devices.
- Integrate analytics (privacy-compliant) to measure engagement.

## Phase 6 - Observability, Security, Compliance (Weeks 9-10)
- Instrument services with OpenTelemetry; export metrics to Cloud Monitoring/Grafana.
- Set up alerting for trade failures, API errors, and websocket disconnects.
- Conduct security review: secrets management, principle of least privilege IAM roles, logging of admin actions.
- Run load tests simulating burst of listing events and trading demand.

## Phase 7 - Productionization & Launch (Weeks 10-12)
- Finalize Terraform for production/staging environments; implement automated Cloud Build deploys with manual promotion gates.
- Perform end-to-end testnet drills; execute readiness checklist (runbooks, support procedures, legal disclaimers).
- Migrate to mainnet credentials for whitelisted users; enable feature flags for phased rollout.

## Testing & QA
- Unit tests: >=80% coverage for critical services (listing ingestion, trade orchestration, risk checks).
- Contract tests: Pact between backend API and frontend data requirements.
- Integration suite triggered nightly using sandbox exchange credentials.
- Manual QA checklist per release: localization review, device layout verification, admin approval flow, trade simulation.

## Immediate Action Items for the Team
1. Confirm websocket/public API availability for Upbit/Bithumb announcements, or plan for scraping/proxy service.
2. Decide on monorepo tooling preference (Nx vs Turbo) and initialize base project.
3. Gather required API keys and sandbox credentials for targeted exchanges.
4. Draft legal/compliance notices for automated trading and user agreements.
