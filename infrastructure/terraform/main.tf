terraform {
  required_version = ">= 1.7.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.40.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 5.40.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

provider "random" {}

module "artifact_registry" {
  source = "./modules/artifact-registry"

  project_id = var.project_id
  region     = var.region
  repositories = [
    {
      name     = "coin-sangjang-backend"
      format   = "DOCKER"
      location = var.region
    },
    {
      name     = "coin-sangjang-frontend"
      format   = "DOCKER"
      location = var.region
    }
  ]
}

module "cloud_sql" {
  source = "./modules/cloud-sql"

  project_id    = var.project_id
  region        = var.region
  instance_name = var.db_instance_name
}

module "pubsub" {
  source = "./modules/pubsub"

  project_id = var.project_id
  topics = [
    "listing.raw",
    "listing.processed",
    "orders.executed"
  ]
}
