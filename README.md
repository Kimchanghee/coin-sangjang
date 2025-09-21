# Coin-Sangjang

���λ����� �ѱ� �ŷ���(����Ʈ, ����)�� ���� ������ �ǽð����� �����ϰ�, ��ٷ� �۷ι� ���� �ŷ���(���̳���, ���̺�Ʈ, OKX, Gate.io, Bitget)�� �ڵ� �����ϴ� �ٱ��� �� ���ø����̼��Դϴ�.

## Monorepo ����
- `frontend/` ? Next.js 15 App Router, 15�� ��� ����/��ú���, ����ϡ�����ũ�� ���� ���̾ƿ�
- `backend/` ? NestJS 11 API (REST + WebSocket), ����/������ ����/�ŷ� ���� ��������Ʈ, TypeORM(PostgreSQL)
- `services/` ? ���� ���� ��Ŀ, �ŷ� ���ɽ�Ʈ������, ����ũ �Ŵ��� �� ��׶��� ���� (Docker �̹��� �и�)
- `infrastructure/` ? Google Cloud ��� Terraform, Cloud Run ������ Dockerfile ����
- `docs/` ? ��Ű��ó, �ε��, � ���̵�

### ��ġ �� ���� ��ɾ�
```bash
npm install              # ��� ��ũ�����̽� ������ ��ġ
npm run dev              # turbo�� frontend/backend ���� ���� ���� ����
npm run lint             # �� ��ũ�����̽� lint
npm run build            # ���δ��� ����
```

## ����Ʈ���� ���̶���Ʈ (`frontend/`)
- 15�� ��� ���� ������ ������ ���� ���� (`app/(marketing)/{locale}/page.tsx`)
- `ResponsiveShell`�� �����/PC ���̾ƿ��� �и� ����, ���� ��� ���� ���� ����
- �ǽð� ���� ƼĿ(`RealtimeFeedPanel`)�� WebSocket(`NEXT_PUBLIC_LISTING_WS`)�� ����
- USDT���������������������� ����, �ŷ��� ����, �׽�Ʈ�� ��� �� Ʈ���̵� �� ����
- ������ ���� ��û/UID ���� UI, API Ű ���� �г�, �� ��� ���̵� ���� ����

## �鿣�� ���̶���Ʈ (`backend/`)
- ��� ����: `Users`, `Auth`, `Admin`, `Exchanges`, `Listings`, `Orchestrator`
- JWT ����(����/�������� TTL), ������ ���� ���� ��������Ʈ, ����� ���/������ ��ȸ
- TypeORM ��ƼƼ: �����, �ŷ��� ����, ������ ���� ��û, ���� �̺�Ʈ, Ʈ���̵� ����
- `/api/listings` REST + Socket.IO Gateway �� �ǽð� ���, Mock ���� ��������Ʈ ����
- �ŷ� ���ɽ�Ʈ������ ���񽺰� ���� �̺�Ʈ ��Ʈ���� ������ BullMQ ���� �غ�
- `backend/.env.example`�� �ٽ� ȯ�� ���� ���� (DB, JWT ���Ű ��)

## ��׶��� ���� (`services/`)
- `listing-ingest` ? ����Ʈ/���� ���� ���� ���� ��Ŀ (����� Mock, REST ����)
- `trade-orchestrator` ? BullMQ ť ��� �ŷ� ���� ����
- `risk-manager` ? ��������/���� �ѵ� ���� ����

�� ���񽺴� `npm run build --workspace services/<name>`�� ���� �����ϸ�, Dockerfile ���ø� ���� (`infrastructure/docker/*`).

## ������ (`infrastructure/`)
- Terraform(`infrastructure/terraform`)���� Artifact Registry, Cloud SQL, Pub/Sub ���� ����
- Cloud Run ������ ���� �����̳� ����: `Dockerfile.backend`, `Dockerfile.frontend`, ��Ŀ�� Dockerfile

## ���� TODO
- Upbit/���� �Ǽ��� WebSocket/��ũ���� ����, �ǸŸ� �ŷ��� ����� ����
- BullMQ + Redis + Pub/Sub ���� �� �ǽð� ���� ���� ����
- ����Ʈ���� ��ú���/������ ���� ���Ʈ Ȯ�� �� ���� ���� �ݿ�
- �׽�Ʈ(����/����/Playwright) �� ���� ���� ��ȭ

���� ����� �ܰ躰 ������ `docs/architecture.md`, `docs/roadmap.md`�� �����ϼ���.
