variable "project_id" {
  type        = string
  description = "Google Cloud project ID"
}

variable "region" {
  type        = string
  description = "Primary region for Cloud Run and Artifact Registry"
  default     = "asia-northeast3"
}

variable "db_instance_name" {
  type        = string
  description = "Cloud SQL instance name"
  default     = "coin-sangjang"
}
