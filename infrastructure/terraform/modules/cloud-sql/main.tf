variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "instance_name" {
  type = string
}

resource "google_sql_database_instance" "primary" {
  project          = var.project_id
  name             = var.instance_name
  region           = var.region
  database_version = "POSTGRES_15"

  settings {
    tier = "db-custom-2-7680"
    availability_type = "REGIONAL"
    ip_configuration {
      ipv4_enabled    = false
      private_network = null
    }
    backup_configuration {
      enabled = true
    }
  }
}

resource "google_sql_database" "app" {
  name     = "coin_sangjang"
  instance = google_sql_database_instance.primary.name
}

resource "random_password" "db" {
  length           = 20
  special          = true
  override_characters = "!@#%^*_+-"
}

resource "google_sql_user" "app" {
  name     = "coin_app"
  instance = google_sql_database_instance.primary.name
  password = random_password.db.result
}

output "connection_name" {
  value = google_sql_database_instance.primary.connection_name
}

output "database_user" {
  value = google_sql_user.app.name
}

output "database_password" {
  value       = random_password.db.result
  description = "Sensitive password value"
  sensitive   = true
}
