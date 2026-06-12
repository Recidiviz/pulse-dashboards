output "cluster_name" {
  value       = try(one(google_container_cluster.primary[*].name), null)
  description = "Name of the regional GKE cluster running Typesense (null in standby mode)"
}

output "cluster_endpoint" {
  value       = try(one(google_container_cluster.primary[*].endpoint), null)
  description = "GKE control plane endpoint (null in standby mode)"
  sensitive   = true
}

# Supporting infra — populated in both primary and standby modes.
output "endpoint_ip" {
  value       = google_compute_address.typesense.address
  description = "Regional external IP fronting the Typesense endpoint — point the hostname's A record at this in the recidiviz.org DNS system of record"
}

output "dns_name" {
  value       = var.hostname
  description = "Public hostname for the Typesense endpoint"
}

output "cert_dns_authorization_record" {
  value       = google_certificate_manager_dns_authorization.typesense.dns_resource_record
  description = "CNAME record (name/type/data) to add to the recidiviz.org zone so the managed cert can validate"
}

output "snapshots_bucket_name" {
  value       = google_storage_bucket.snapshots.name
  description = "GCS bucket used by the snapshot CronJob (also created in standby mode so it's ready at failover)"
}

output "namespace" {
  value       = local.typesense_namespace
  description = "Kubernetes namespace running the Typesense cluster"
}

output "snapshotter_service_account" {
  value       = google_service_account.snapshotter.email
  description = "GSA used by the snapshot/reindex workloads via Workload Identity (created in both modes)"
}

output "dashboard_url" {
  value       = try("https://console.cloud.google.com/monitoring/dashboards/builder/${reverse(split("/", one(google_monitoring_dashboard.typesense[*].id)))[0]}?project=${var.project_id}", null)
  description = "Console URL for the Typesense Cloud Monitoring dashboard (null in standby mode)"
}
