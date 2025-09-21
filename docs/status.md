# 진행 현황 및 후속 개발 가이드

## 요구사항 대응 현황
1. **웹 애플리케이션 구축**: Next.js(프론트)와 NestJS(백엔드) 기본 구조를 마련했고, App Router 기반 다국어 랜딩/대시보드 템플릿을 구성했습니다.
2. **Google Cloud 자동 배포 & Docker**: Terraform으로 Artifact Registry·Cloud SQL·Pub/Sub 리소스 스켈레톤을 정의했고, Cloud Run 배포용 Dockerfile을 서비스별로 준비했습니다.
3. **업비트·빗썸 실시간 공지 파이프라인**: `services/listing-ingest`가 Mock 타이머로 이벤트를 생성하되, 기본적으로 Google Cloud Pub/Sub 토픽으로 게시하고 실패 시 REST 백업을 사용합니다. 백엔드는 `POST /api/listings/push/gcp` 엔드포인트로 Pub/Sub Push를 수신합니다.
4. **해외 거래소 상장 확인 및 자동 투자**: `TradeOrchestratorService` 기본 구조와 BullMQ 큐 접점을 마련했으며, 실제 거래소 어댑터/주문 로직은 TODO로 남겼습니다.
5. **API Key 기반 거래**: `ExchangeAccount` 엔티티/DTO로 거래소별 API Key, 모드(테스트넷·메인넷)를 저장할 수 있습니다.
6. **테스트넷/메인넷 지원**: UI 토글과 DTO 검증으로 `MAINNET`/`TESTNET` 전환을 지원합니다.
7. **USDT 자금·레버리지 입력**: 프론트 `TradePreferencesForm`에서 레버리지·USDT·익절·손절 비율 입력을 제공합니다.
8. **익절·손절 자동 설정**: `TradeOrder` 엔티티에 TP/SL 퍼센트 필드를 포함하고 UI에서도 입력하도록 했습니다.
9. **UID 기반 관리자 승인 요청**: 프론트 `AdminRequestForm`과 백엔드 `AdminModule`을 통해 UID·거래소 선택 후 승인 요청을 생성합니다.
10. **관리자 승인 후 사용**: JWT Guard와 역할 확인(`ensureAdmin`)으로 관리자만 승인/거절을 처리하고, 사용자 `adminApproved` 플래그를 갱신합니다.
11. **15개 언어 지원**: `frontend/i18n` 아래 언어별 카피 파일과 라우트를 분리했습니다.
12. **광고 배너 존**: `BannerSlot` 컴포넌트로 메인 배너 영역을 분리했습니다.
13. **모바일/PC 개별 디자인 관리**: `ResponsiveShell`이 `MobileLayout`/`DesktopLayout`을 선택해 별도 스타일을 유지합니다.
14. **사용 가이드·소개**: 각 언어 카피에 사용법/소개 섹션을 포함했고 랜딩 페이지에 노출합니다.

## 남은 TODO / 리스크
- 업비트·빗썸 실서비스 연동: 공식 WebSocket 부재 시 HTTP 폴링+Cloud Functions/Cloud Run 프록시 설계 필요.
- 거래소 API 어댑터: Binance → Bybit/OKX/Gate/Bitget 순으로 테스트넷부터 개발하며 시그니처/레버리지 정책을 검증해야 합니다.
- 시크릿 관리: 현재 API 키는 DB 컬럼에 평문 저장되므로 Secret Manager + Cloud KMS 연동이 필요합니다.
- 오케스트레이션 큐: BullMQ/Redis 구성, 재시도 및 백오프 정책 수립 필요.
- 리스크 매니지먼트: TP/SL 주문 전송, 포지션 추적, 강제청산 대응 로직이 미구현 상태입니다.
- 관리자 알림: 승인 요청 발생 시 이메일/Slack/텔레그램 등 알림 채널 연동 필요.
- 테스트 자동화: 유닛·통합·Playwright 테스트 케이스 작성 및 CI 파이프라인 탑재 필요.
- 번역 확정: 일부 언어는 영어 카피 재사용 중 → 전문 번역/QA 진행 필요.

## 추천 다음 단계
1. **실시간 데이터 파이프라인 완성**
   - 업비트/빗썸 데이터 소스를 확정하고 Cloud Run/Cloud Functions로 크롤러 혹은 WebSocket 브릿지를 구현한 뒤 Pub/Sub `listing.raw` 토픽으로 게시합니다.
2. **Binance 선물 어댑터 개발**
   - API Key 암호화 저장, 심볼 조회, 레버리지 설정, 시장가 주문, TP/SL 세팅까지 테스트넷에서 검증합니다.
3. **거래 오케스트레이션 E2E 검증**
   - Pub/Sub → 오케스트레이터 → 거래소 어댑터 → 상태 업데이트까지 통합 테스트를 구성합니다.
4. **관리자 UI 고도화**
   - 승인 대기 목록, 검색/필터, 즉시 승인/거절 기능을 추가합니다.
5. **GCP 배포 파이프라인 구축**
   - Cloud Build 트리거와 환경 변수/Secret Manager, 스테이징-프로덕션 프로모션 플로우를 마련합니다.
6. **보안·감사 강화**
   - 감사 로그, 2FA, 권한 세분화, API rate limit 등을 적용합니다.
