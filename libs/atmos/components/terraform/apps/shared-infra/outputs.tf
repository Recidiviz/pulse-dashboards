output "proxy_only_subnet_self_link" {
  description = "Self-link of the regional managed proxy subnet, for use by regional external ALBs in this project/region."
  value       = google_compute_subnetwork.proxy_only.self_link
}

output "shared_waf_id" {
  description = "Identifier of the WAF policy shared amongst product services"
  value       = module.waf.id
}
