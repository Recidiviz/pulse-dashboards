output "cluster_name" {
  value = google_container_cluster.primary.name
}

output "cloud_sql_proxy_ip" {
  value = google_compute_address.internal_sql_proxy_ip.address
}

output "ports" {
  value = var.sql_instance_connections
}
