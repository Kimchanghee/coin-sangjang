# Google Cloud ���� ���̵�

## ����
Coin-Sangjang�� Google Cloud Console ������ ���� ������ҷ� ��ϵ��� ����Ǿ����ϴ�.

- **Cloud Run**: ����Ʈ����(Next.js), �鿣��(NestJS), ��Ŀ(listing-ingest, trade-orchestrator, risk-manager)�� ���� ���� ���񽺷� �����մϴ�.
- **Cloud SQL (PostgreSQL)**: �����/�ŷ� ������ ���� �����.
- **Pub/Sub**: �ѱ� �ŷ��� ���� �̺�Ʈ ����(`listing.raw` ����). listing-ingest �� Pub/Sub �Խ�, �鿣�� �� Push ��������Ʈ `/api/listings/push/gcp` ����.
- **Secret Manager**: �ŷ��� API Key, JWT ��ũ��, DB ��й�ȣ �� �ΰ� ���� ����.
- **Artifact Registry**: Docker �̹����� �����ϰ� Cloud Run�� ����.
- **Cloud Build**: GitHub Ʈ���� ��� CI/CD ����������.

## ���� ���� (���)
1. **�������丮 �غ�**
   ```bash
   npm install
   npm run build --workspace backend
   npm run build --workspace frontend
   ```

2. **Artifact Registry Ǫ��**
   ```bash
   gcloud builds submit --config infrastructure/cloud-build/backend.yaml \
     --substitutions=_SERVICE=backend,_REGION=asia-northeast3
   ```
   (Cloud Build ������ ����� ȯ�濡 �°� �ۼ��ϸ�, Terraform ��⿡ ���� ����Ҹ� `coin-sangjang-backend`, `coin-sangjang-frontend`�� ����մϴ�.)

3. **Cloud Run ���� ���� ����**
   ```bash
   gcloud run deploy coin-sangjang-backend \
     --image=asia-northeast3-docker.pkg.dev/$PROJECT/coin-sangjang-backend/backend:latest \
     --region=asia-northeast3 \
     --platform=managed \
     --allow-unauthenticated \
     --set-env-vars=PORT=3000,AUTH_JWT_SECRET=secret-from-secret-manager \
     --set-secrets=DB_PASSWORD=projects/$PROJECT/secrets/coin-db-password:latest
   ```
   �����ϰ� `frontend`, `listing-ingest`, `trade-orchestrator`, `risk-manager`�� ���� �����մϴ�.

4. **Pub/Sub �� Cloud Run Push ����**
   ```bash
   gcloud pubsub subscriptions create listing-raw-backend \
     --topic=listing.raw \
     --push-endpoint="https://<backend-domain>/api/listings/push/gcp" \
     --push-auth-service-account=<service-account>@$PROJECT.iam.gserviceaccount.com
   ```
   - `backend-domain`�� Cloud Run �鿣�� URL.
   - Push ������ ���� Cloud Run ���� ���� Ȥ�� ���� ���� ������ ����մϴ�.

5. **Secret Manager ����**
   - `coin-jwt-secret`, `coin-db-password`, `binance-api-key-<uid>` �� �̸����� ����� �����մϴ�.
   - Cloud Run ���� ������ `Secret Manager Secret Accessor` ������ �ο��մϴ�.

6. **Cloud Scheduler / Monitoring (����)**
   - ũ�ѷ� �ｺüũ, ��� �۾��� ���� Cloud Scheduler + Cloud Run(Ȥ�� Cloud Functions) Ȱ��.
   - Cloud Logging/Monitoring ��ú��带 �����ϰ� �˸� ��å�� �����մϴ�.

## Terraform ����
- `infrastructure/terraform` ���͸����� `terraform init`, `terraform apply`�� Artifact Registry��Cloud SQL��Pub/Sub�� �ʱ� �����մϴ�.
- Secret Manager, Cloud Run, Cloud Build�� ȯ�濡 ���� �߰� ��� �ۼ��� �ʿ��մϴ�.

## ��Ʈ��ũ/���� ����
- Cloud SQL�� VPC Ŀ���͸� ���� Private IP�� �����ϰų� Cloud SQL Auth Proxy�� Cloud Run�� �����մϴ�.
- Cloud Run �� Pub/Sub Push ���� �� ���� ������ `roles/run.invoker`, `roles/iam.serviceAccountTokenCreator` ������ �ο��մϴ�.
- ������ ������ ���� ��� ���� Cloud Armor �Ǵ� Identity-Aware Proxy(IAP) ������ ����մϴ�.

## TODO
- Cloud Build ���� ���� �ۼ�(`infrastructure/cloud-build/*.yaml`).
- Secret Manager�� KMS�� Ȱ���� API Key �Ϻ�ȣȭ ���� ����.
- Redis(BullMQ)�� Memorystore �ν��Ͻ� Terraform ��� �߰�.
