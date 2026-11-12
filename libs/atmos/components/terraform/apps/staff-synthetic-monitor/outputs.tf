output "function_uris" {
  description = "Per-state HTTPS URLs of the deployed synthetic monitor Cloud Functions, keyed by state code. The uptime checks invoke these; also callable manually with an authenticated OIDC token for debugging."
  value       = { for k, f in google_cloudfunctions2_function.monitor : k => f.service_config[0].uri }
}

output "service_account_email" {
  description = "SA all per-state functions run as. The only principal (besides project owners) granted accessor on the credential secrets."
  value       = google_service_account.monitor.email
}

output "uptime_check_ids" {
  description = "Per-state synthetic monitor uptime check IDs, keyed by state code."
  value       = { for k, c in google_monitoring_uptime_check_config.staff_signin : k => c.uptime_check_id }
}

output "alert_policy_name" {
  description = "Resource name of the aggregated synthetic-monitor alert policy (empty when monitoring is disabled)."
  value       = try(google_monitoring_alert_policy.synthetic_failing[0].name, "")
}

output "notification_channel_ids" {
  description = "Notification channel IDs the alert policy routes to (email + PagerDuty forwarder); empty strings when monitoring is disabled."
  value       = local.notification_channels
}

output "screenshot_bucket" {
  description = "Bucket the monitor uploads failure screenshots to in VERBOSE mode (CMEK-encrypted; objects expire after screenshot_retention_days)."
  value       = google_storage_bucket.screenshots.name
}

output "egress_ip" {
  description = "Reserved static outbound IP all per-state monitor functions egress through (via the Serverless VPC connector + Cloud NAT). Allowlist this in Auth0. Empty when static egress is disabled."
  value       = try(google_compute_address.egress[0].address, "")
}
