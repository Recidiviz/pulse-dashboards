# TODO: Remove in favor of database_credentials output once we move to stores
output "database_connection_name" {
  description = "The connection name for the created database"
  value       = module.database.connection_name
}

# TODO: Remove in favor of database_credentials output once we move to stores
output "database_user_name" {
  description = "The connection name for the created database"
  value       = module.database.database_user_name
  sensitive   = true
}

# TODO: Remove in favor of database_credentials output once we move to stores
output "database_user_password" {
  description = "The connection name for the created database"
  value       = module.database.database_user_password
  sensitive   = true
}

output "service_account_email" {
  description = "The email of the service account"
  value       = google_service_account.default.email
}

output "database_credentials" {
  description = "A map of credential values for the created database"
  value       = {
    connection_name = module.database.connection_name
    username = module.database.database_user_name
    password = module.database.database_user_password
  }
  sensitive   = true
}
