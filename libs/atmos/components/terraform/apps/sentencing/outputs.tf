output "database_connection_name" {
  description = "The connection name for the created database"
  value       = module.database.connection_name
}

output "service_account_email" {
  description = "The email of the service account"
  value       = google_service_account.default.email
}

output "database_user_name" {
  description = "The connection name for the created database"
  value       = module.database.database_user_name
  sensitive   = true
}

output "database_user_password" {
  description = "The connection name for the created database"
  value       = module.database.database_user_password
  sensitive   = true
}
