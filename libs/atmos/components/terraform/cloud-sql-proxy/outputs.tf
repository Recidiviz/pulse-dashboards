output "cluster_name" {
  value       = google_container_cluster.primary.name
  description = "Name of the GKE cluster that runs the proxy"
}

output "cloud_sql_proxy_ip" {
  value       = google_compute_address.internal_sql_proxy_ip.address
  description = "Internal (private) IP to use to connect to the proxy"
}

output "ports" {
  value       = var.sql_instance_connections
  description = "Map of database name -> proxy port"
}
