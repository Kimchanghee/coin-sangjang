# Cloud Build Templates (TODO)

이 디렉터리에는 Cloud Run 배포를 위한 Cloud Build 설정 파일(`backend.yaml`, `frontend.yaml`, `workers.yaml` 등)을 추가할 예정입니다.

예상 구성 요소
- Artifact Registry에 컨테이너 이미지 빌드 및 푸시
- 테스트 실행 (npm run lint / npm run build)
- 환경별 배포 단계 (staging → production)

향후 실제 파이프라인 작성 시 이 README를 업데이트하세요.
