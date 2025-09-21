variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "repositories" {
  type = list(object({
    name     = string
    format   = string
    location = string
  }))
}

resource "google_artifact_registry_repository" "this" {
  for_each   = { for repo in var.repositories : repo.name => repo }
  project    = var.project_id
  location   = each.value.location
  repository_id = each.value.name
  format     = each.value.format
}

output "repository_ids" {
  value = [for repo in google_artifact_registry_repository.this : repo.id]
}
