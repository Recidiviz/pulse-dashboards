output "function_uri" {
  description = "HTTPS URL of the deployed Cloud Function. Cloud Scheduler / manual curl invocations target this URI."
  value       = google_cloudfunctions2_function.backfill.service_config[0].uri
}

output "service_account_email" {
  description = "SA the function runs as. Used by Cloud Scheduler's OIDC identity binding when the scheduler is added."
  value       = google_service_account.backfill.email
}
