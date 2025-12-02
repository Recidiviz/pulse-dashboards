output "service_account_email" {
  description = "The email of the service account"
  value       = google_service_account.default.email
}

output "database_credentials" {
  description = "A map of credential values for the created database"
  value = {
    connection_name = module.database.connection_name
    username        = module.database.database_user_name
    password        = module.database.database_user_password
  }
  sensitive = true
}
