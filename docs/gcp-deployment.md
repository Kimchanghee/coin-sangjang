# Google Cloud 배포 가이드

## 개요
Coin-Sangjang은 Google Cloud Console 내에서 다음 구성요소로 운영하도록 설계되었습니다.

- **Cloud Run**: 프론트엔드(Next.js), 백엔드(NestJS), 워커(listing-ingest, trade-orchestrator, risk-manager)를 각각 독립 서비스로 배포합니다.
- **Cloud SQL (PostgreSQL)**: 사용자/거래 데이터 영구 저장소.
- **Pub/Sub**: 한국 거래소 상장 이벤트 전파(`listing.raw` 토픽). listing-ingest → Pub/Sub 게시, 백엔드 → Push 엔드포인트 `/api/listings/push/gcp` 수신.
- **Secret Manager**: 거래소 API Key, JWT 시크릿, DB 비밀번호 등 민감 정보 관리.
- **Artifact Registry**: Docker 이미지를 저장하고 Cloud Run에 배포.
- **Cloud Build**: GitHub 트리거 기반 CI/CD 파이프라인.

## 배포 절차 (요약)
1. **리포지토리 준비**
   ```bash
   npm install
   npm run build --workspace backend
   npm run build --workspace frontend
   ```

2. **Artifact Registry 푸시**
   ```bash
   gcloud builds submit --config infrastructure/cloud-build/backend.yaml \
     --substitutions=_SERVICE=backend,_REGION=asia-northeast3
   ```
   (Cloud Build 설정은 사용자 환경에 맞게 작성하며, Terraform 모듈에 따라 저장소명 `coin-sangjang-backend`, `coin-sangjang-frontend`를 사용합니다.)

3. **Cloud Run 서비스 생성 예시**
   ```bash
   gcloud run deploy coin-sangjang-backend \
     --image=asia-northeast3-docker.pkg.dev/$PROJECT/coin-sangjang-backend/backend:latest \
     --region=asia-northeast3 \
     --platform=managed \
     --allow-unauthenticated \
     --set-env-vars=PORT=3000,AUTH_JWT_SECRET=secret-from-secret-manager \
     --set-secrets=DB_PASSWORD=projects/$PROJECT/secrets/coin-db-password:latest
   ```
   동일하게 `frontend`, `listing-ingest`, `trade-orchestrator`, `risk-manager`를 각각 배포합니다.

4. **Pub/Sub → Cloud Run Push 연결**
   ```bash
   gcloud pubsub subscriptions create listing-raw-backend \
     --topic=listing.raw \
     --push-endpoint="https://<backend-domain>/api/listings/push/gcp" \
     --push-auth-service-account=<service-account>@$PROJECT.iam.gserviceaccount.com
   ```
   - `backend-domain`은 Cloud Run 백엔드 URL.
   - Push 인증을 위해 Cloud Run 서비스 계정 혹은 별도 서비스 계정을 사용합니다.

5. **Secret Manager 구성**
   - `coin-jwt-secret`, `coin-db-password`, `binance-api-key-<uid>` 등 이름으로 비밀을 생성합니다.
   - Cloud Run 서비스 계정에 `Secret Manager Secret Accessor` 권한을 부여합니다.

6. **Cloud Scheduler / Monitoring (선택)**
   - 크롤러 헬스체크, 백업 작업을 위해 Cloud Scheduler + Cloud Run(혹은 Cloud Functions) 활용.
   - Cloud Logging/Monitoring 대시보드를 구성하고 알림 정책을 설정합니다.

## Terraform 연동
- `infrastructure/terraform` 디렉터리에서 `terraform init`, `terraform apply`로 Artifact Registry·Cloud SQL·Pub/Sub을 초기 생성합니다.
- Secret Manager, Cloud Run, Cloud Build는 환경에 따라 추가 모듈 작성이 필요합니다.

## 네트워크/보안 참고
- Cloud SQL은 VPC 커넥터를 통해 Private IP로 연결하거나 Cloud SQL Auth Proxy를 Cloud Run에 설정합니다.
- Cloud Run ↔ Pub/Sub Push 인증 시 서비스 계정에 `roles/run.invoker`, `roles/iam.serviceAccountTokenCreator` 권한을 부여합니다.
- 관리자 페이지 접근 제어를 위해 Cloud Armor 또는 Identity-Aware Proxy(IAP) 적용을 고려합니다.

## TODO
- Cloud Build 설정 파일 작성(`infrastructure/cloud-build/*.yaml`).
- Secret Manager와 KMS를 활용한 API Key 암복호화 로직 도입.
- Redis(BullMQ)용 Memorystore 인스턴스 Terraform 모듈 추가.
