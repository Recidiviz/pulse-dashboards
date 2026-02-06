output "server_url" {
  description = "The URL of the load balancer (with IAP)"
  value       = "https://${var.domain_name}"
}

output "load_balancer_ip" {
  description = "The IP address of the load balancer (for DNS configuration)"
  value       = module.lb_http.external_ip
}

output "cloud_run_url" {
  description = "The direct Cloud Run URL (not publicly accessible due to IAP)"
  value       = module.server.service_uri
}

output "database_connection_name" {
  description = "The connection name of the labeling Cloud SQL instance"
  value       = module.database.connection_name
}
