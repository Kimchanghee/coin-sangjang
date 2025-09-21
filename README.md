# Coin-Sangjang

코인상장은 한국 거래소(업비트, 빗썸)의 상장 공지를 실시간으로 수집하고, 곧바로 글로벌 선물 거래소(바이낸스, 바이비트, OKX, Gate.io, Bitget)에 자동 진입하는 다국어 웹 애플리케이션입니다.

## Monorepo 개요
- `frontend/` ? Next.js 15 App Router, 15개 언어 랜딩/대시보드, 모바일·데스크톱 전용 레이아웃
- `backend/` ? NestJS 11 API (REST + WebSocket), 인증/관리자 승인/거래 설정 엔드포인트, TypeORM(PostgreSQL)
- `services/` ? 상장 수집 워커, 거래 오케스트레이터, 리스크 매니저 등 백그라운드 서비스 (Docker 이미지 분리)
- `infrastructure/` ? Google Cloud 대상 Terraform, Cloud Run 배포용 Dockerfile 모음
- `docs/` ? 아키텍처, 로드맵, 운영 가이드

### 설치 및 공통 명령어
```bash
npm install              # 모든 워크스페이스 의존성 설치
npm run dev              # turbo로 frontend/backend 동시 개발 서버 실행
npm run lint             # 전 워크스페이스 lint
npm run build            # 프로덕션 빌드
```

## 프론트엔드 하이라이트 (`frontend/`)
- 15개 언어 전용 페이지 파일을 각각 구성 (`app/(marketing)/{locale}/page.tsx`)
- `ResponsiveShell`로 모바일/PC 레이아웃을 분리 관리, 광고 배너 슬롯 별도 제공
- 실시간 상장 티커(`RealtimeFeedPanel`)가 WebSocket(`NEXT_PUBLIC_LISTING_WS`)에 연결
- USDT·레버리지·익절·손절 설정, 거래소 선택, 테스트넷 토글 등 트레이딩 폼 제공
- 관리자 승인 요청/UID 제출 UI, API 키 상태 패널, 언어별 사용 가이드 섹션 포함

## 백엔드 하이라이트 (`backend/`)
- 모듈 구조: `Users`, `Auth`, `Admin`, `Exchanges`, `Listings`, `Orchestrator`
- JWT 인증(접근/리프레시 TTL), 관리자 전용 승인 엔드포인트, 사용자 등록/프로필 조회
- TypeORM 엔티티: 사용자, 거래소 계정, 관리자 승인 요청, 상장 이벤트, 트레이드 오더
- `/api/listings` REST + Socket.IO Gateway → 실시간 방송, Mock 수집 엔드포인트 제공
- 거래 오케스트레이터 서비스가 상장 이벤트 스트림을 구독해 BullMQ 연동 준비
- `backend/.env.example`에 핵심 환경 변수 정의 (DB, JWT 비밀키 등)

## 백그라운드 서비스 (`services/`)
- `listing-ingest` ? 업비트/빗썸 상장 공지 수집 워커 (현재는 Mock, REST 전달)
- `trade-orchestrator` ? BullMQ 큐 기반 거래 실행 스텁
- `risk-manager` ? 레버리지/노출 한도 감시 스텁

각 서비스는 `npm run build --workspace services/<name>`로 빌드 가능하며, Dockerfile 템플릿 제공 (`infrastructure/docker/*`).

## 인프라 (`infrastructure/`)
- Terraform(`infrastructure/terraform`)으로 Artifact Registry, Cloud SQL, Pub/Sub 토픽 생성
- Cloud Run 배포를 위한 컨테이너 스펙: `Dockerfile.backend`, `Dockerfile.frontend`, 워커용 Dockerfile

## 남은 TODO
- Upbit/빗썸 실서비스 WebSocket/스크래퍼 연동, 실매매 거래소 어댑터 구현
- BullMQ + Redis + Pub/Sub 통합 및 실시간 위험 관리 로직
- 프런트엔드 대시보드/관리자 전용 라우트 확장 및 실제 번역 반영
- 테스트(유닛/통합/Playwright) 및 보안 검증 강화

세부 설계와 단계별 일정은 `docs/architecture.md`, `docs/roadmap.md`를 참고하세요.
