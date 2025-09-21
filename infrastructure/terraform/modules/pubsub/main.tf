variable "project_id" {
  type = string
}

variable "topics" {
  type = list(string)
}

resource "google_pubsub_topic" "topics" {
  for_each = toset(var.topics)
  name     = each.value
  project  = var.project_id
}

output "topic_names" {
  value = [for topic in google_pubsub_topic.topics : topic.name]
}
