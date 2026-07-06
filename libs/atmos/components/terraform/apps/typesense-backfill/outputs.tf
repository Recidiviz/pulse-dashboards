output "function_uri" {
  description = "HTTPS URL of the deployed Cloud Function. Cloud Scheduler / manual curl invocations target this URI."
  value       = google_cloudfunctions2_function.backfill.service_config[0].uri
}

output "service_account_email" {
  description = "SA the function runs as. Used by Cloud Scheduler's OIDC identity binding when the scheduler is added."
  value       = google_service_account.backfill.email
}

output "egress_ip" {
  description = "Reserved static outbound IP when static_egress_enabled. Allowlist this in the typesense Cloud Armor policy (its backfill_allowlist_ip_ranges var) so the backfill bypasses the per-IP rate limit. Empty string when static egress is disabled."
  value       = var.static_egress_enabled ? google_compute_address.egress[0].address : ""
}
