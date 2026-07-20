output "load_balancer_ip" {
  description = "Global anycast IP of the load balancer"
  value       = google_compute_global_address.frontend.address
}

output "url_map_name" {
  description = "URL map name, used by the deploy tool for CDN cache invalidation"
  value       = google_compute_url_map.frontend.name
}

output "bucket_name" {
  description = "Private origin bucket the deploy tool uploads builds to"
  value       = google_storage_bucket.frontend.name
}

output "index_bucket_name" {
  description = "Public bucket the deploy tool uploads index.html to (SPA fallback origin)"
  value       = google_storage_bucket.frontend_index.name
}

# DNS is managed outside this repo — create these records manually.
output "required_dns_records" {
  description = "A records to create (outside this repo) to serve the frontend"
  value = [
    for domain in var.domain_names :
    "A ${domain} -> ${google_compute_global_address.frontend.address}"
  ]
}

# Hand these to the DNS team BEFORE any real-domain cutover: once each CNAME
# exists, the corresponding Certificate Manager certificate provisions to
# ACTIVE without the domain's A record moving off Firebase.
output "cert_dns_authorization_records" {
  description = "CNAME records (per domain) that validate the Certificate Manager certs"
  value = {
    for domain, auth in google_certificate_manager_dns_authorization.frontend :
    domain => "${auth.dns_resource_record[0].type} ${auth.dns_resource_record[0].name} -> ${auth.dns_resource_record[0].data}"
  }
}

output "certificate_map_state" {
  description = "Per-domain Certificate Manager provisioning state"
  value = {
    for domain, cert in google_certificate_manager_certificate.frontend :
    domain => cert.managed[0].state
  }
}
