# Private GKE nodes have no public IPs, so they need Cloud NAT to pull the
# Typesense / operator images (Docker Hub, quay.io) and reach external services.
resource "google_compute_router" "typesense" {
  name    = "${local.cluster_name}-router"
  region  = var.region
  network = "default"
}

resource "google_compute_router_nat" "typesense" {
  name                               = "${local.cluster_name}-nat"
  router                             = google_compute_router.typesense.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}
