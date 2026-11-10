output "service_account_email" {
  description = "Email of the admin panel Cloud Run service account"
  value       = google_service_account.default.email
}

output "cloud_run_service_uri" {
  description = "The Cloud Run service's own (internal, non-LB) URI"
  value       = module.server.service_uri
}

output "load_balancer_ip" {
  description = "The external IPv4 address of the admin panel load balancer — point domain_name's DNS record here"
  value       = module.lb_http.external_ip
}

output "app_url" {
  description = "The public URL for the admin panel once DNS is pointed at load_balancer_ip"
  value       = "https://${var.domain_name}"
}

output "backend_service_generated_id" {
  description = "Numeric backend service id used in the IAP JWT audience — also stored in the iap_admin_panel_load_balancer_service_id secret"
  value       = module.lb_http.backend_services["default"].generated_id
  # Derived from module.lb_http.backend_services, marked sensitive in
  # vendor/lb-http/outputs.tf.
  sensitive = true
}

output "artifact_registry_repository" {
  description = "Full path of the admin panel Artifact Registry repository"
  value       = "${var.location}-docker.pkg.dev/${var.artifact_registry_project_id}/${var.artifact_registry_repository_id}"
}

output "query_jobs_kms_key" {
  description = "KMS key resource name for this admin panel's BigQuery query jobs, to satisfy this project's CMEK requirement (see bigquery-results.tf) -- pass as --destination_kms_key (with no --destination_table) when manually verifying via bq query"
  value       = google_kms_key_handle.query_jobs.kms_key
}
