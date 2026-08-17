output "function_names" {
  description = "Deployed Cloud Function names, keyed by trigger."
  value       = { for k, f in google_cloudfunctions2_function.sync : k => f.name }
}

output "function_uris" {
  description = "HTTPS URLs of the deployed functions. Event-triggered, so these are for inspection rather than invocation."
  value       = { for k, f in google_cloudfunctions2_function.sync : k => f.service_config[0].uri }
}

output "service_account_email" {
  description = "SA the functions run as, and the identity Eventarc uses to deliver triggers."
  value       = google_service_account.sync.email
}
