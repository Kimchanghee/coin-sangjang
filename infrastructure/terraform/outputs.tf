output "artifact_registry_repo_ids" {
  value       = module.artifact_registry.repository_ids
  description = "Artifact Registry repository resource IDs"
}

output "cloud_sql_instance_connection_name" {
  value       = module.cloud_sql.connection_name
  description = "Cloud SQL connection string"
}

output "pubsub_topics" {
  value       = module.pubsub.topic_names
  description = "Provisioned Pub/Sub topics"
}
