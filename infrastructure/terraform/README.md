# Google Cloud Terraform Stack

This configuration provisions the core infrastructure needed to deploy Coin-Sangjang:

- Artifact Registry repositories for backend/frontend container images
- Cloud SQL for PostgreSQL (regional, HA) plus initial database/user
- Pub/Sub topics for listing + trading event fanout

## Usage

```bash
cd infrastructure/terraform
terraform init
terraform plan -var="project_id=your-project" -var="region=asia-northeast3"
terraform apply
```

Outputs expose connection info for Cloud SQL and provisioned topic names.
