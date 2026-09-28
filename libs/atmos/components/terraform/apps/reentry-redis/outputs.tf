output "instance_name" {
  description = "The Memorystore instance name"
  value       = google_redis_instance.redis.name
}

output "host" {
  description = "The instance's private IP on the authorized network"
  value       = google_redis_instance.redis.host
}

output "port" {
  description = "The instance's TLS port (6378 with transit encryption enabled)"
  value       = google_redis_instance.redis.port
}

output "url_secret_id" {
  description = "Secret Manager secret holding the rediss:// URL, referenced by cloudbuild --set-secrets"
  value       = google_secret_manager_secret.secrets["url"].secret_id
}

output "server_ca_secret_id" {
  description = "Secret Manager secret holding the server CA bundle, mounted as a file in Cloud Run"
  value       = google_secret_manager_secret.secrets["server_ca"].secret_id
}
