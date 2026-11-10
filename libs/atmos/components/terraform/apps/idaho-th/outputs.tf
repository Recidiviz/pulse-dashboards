output "service_account_email" {
  description = "Email of the Idaho TH server (API) service account"
  value       = google_service_account.default.email
}

output "direct_egress_subnetwork_name" {
  description = "Name of the Direct VPC Egress subnet"
  value       = local.direct_egress_subnetwork_name_resolved
}

output "frontend_service_account_email" {
  description = "Email of the Idaho TH frontend service account (null when load balancer is disabled)"
  value       = var.enable_load_balancer ? google_service_account.frontend[0].email : null
}

output "service_account_emails" {
  description = "Emails for Idaho TH workload service accounts (server, frontend, migrate_db, seed_db)"
  value = {
    server     = google_service_account.default.email
    frontend   = var.enable_load_balancer ? google_service_account.frontend[0].email : null
    migrate_db = google_service_account.migrate_db.email
    seed_db    = google_service_account.seed_db.email
  }
}

output "cloud_run_service_uri" {
  description = "The Cloud Run service URI"
  value       = module.server.service_uri
}

output "pdf_bucket_name" {
  description = "The GCS bucket used for Idaho TH PDF uploads (the clean/uploads bucket when malware_scan_enabled is false; unscanned when it is true)"
  value       = local.pdf_gcs_upload_bucket_name
}

output "pdf_clean_bucket_name" {
  description = "The GCS bucket for malware-scanned PDF files"
  value       = local.pdf_gcs_clean_bucket_name
}

output "pdf_quarantined_bucket_name" {
  description = "The GCS bucket for quarantined (infected) PDF files"
  value       = local.pdf_gcs_quarantined_bucket_name
}

output "malware_scan_webhook_config" {
  description = "Dev handoff: webhook path, OIDC audience, bucket names, and expected Eventarc caller SA"
  value = {
    "idaho-th" = {
      callback_path             = var.malware_scan_complete_callback_path
      eventarc_oidc_audience    = "${data.google_cloud_run_v2_service.server.uri}${var.malware_scan_complete_callback_path}"
      scan_events_sa_email      = local.scan_events_sa_email
      webhook_audience_env      = "IDAHO_TH_SCAN_WEBHOOK_AUDIENCE_URL"
      webhook_invoker_env       = "IDAHO_TH_SCAN_WEBHOOK_INVOKER_EMAIL"
      cloud_run_service_name    = var.server_name
      upload_bucket             = local.pdf_gcs_upload_bucket_name
      unscanned_bucket          = local.pdf_gcs_unscanned_bucket_name
      clean_bucket              = local.pdf_gcs_clean_bucket_name
      quarantined_bucket        = local.pdf_gcs_quarantined_bucket_name
      triggers_enabled          = var.malware_scan_complete_triggers_enabled
      public_lb_exposes_webhook = var.enable_load_balancer
    }
  }
}

output "load_balancer_ip" {
  description = "The external IPv4 address of the Idaho TH HTTPS load balancer"
  value       = var.enable_load_balancer ? module.lb_frontend[0].external_ip : null
}

output "app_url" {
  description = "The public URL for the Idaho TH app when served through the load balancer"
  value       = var.enable_load_balancer ? "https://${var.domain_name}" : null
}
