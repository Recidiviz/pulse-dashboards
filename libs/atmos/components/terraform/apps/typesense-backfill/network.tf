# =============================================================================
# Static egress IP for the backfill function.
#
# The typesense cluster's Cloud Armor policy rate-limits per source IP
# (apps/typesense/exposure.tf, 600/min). With SRE sign-off we allowlist this
# function past that limit so it can bulk-import faster — but Cloud Armor
# allowlists by source IP, and a Cloud Function's default egress comes from a
# shared, unpredictable Google pool. So we pin outbound traffic to a reserved
# static IP: route ALL function egress through a Serverless VPC Access connector
# into a dedicated network whose Cloud NAT translates everything to one reserved
# address. That address (the egress_ip output) is what typesense allowlists.
#
# Everything here is gated on var.static_egress_enabled, so the function falls
# back to the shared Google pool (no static IP, subject to the rate limit) when
# disabled.
# =============================================================================

locals {
  egress_enabled = var.static_egress_enabled ? 1 : 0
}

# Isolated network whose only occupant is the egress connector's subnet, so our
# Cloud NAT can safely NAT "all subnetworks" without colliding with anything else.
resource "google_compute_network" "egress" {
  count                   = local.egress_enabled
  project                 = var.project_id
  name                    = "${var.function_name}-egress"
  auto_create_subnetworks = false
  description             = "Dedicated network for the typesense-backfill function's static egress (connector + Cloud NAT)."
}

# Serverless VPC Access connector the function routes egress through. Owning its
# /28 ip_cidr_range (vs. referencing a pre-made subnet) lets GCP auto-manage the
# connector's required firewall rules. Connector names are capped at 25 chars;
# "typesense-backfill" is 18, so var.function_name fits as-is.
resource "google_vpc_access_connector" "backfill" {
  count         = local.egress_enabled
  project       = var.project_id
  name          = var.function_name
  region        = var.region
  network       = google_compute_network.egress[0].name
  ip_cidr_range = var.egress_subnet_cidr
  machine_type  = var.connector_machine_type
  min_instances = var.connector_min_instances
  max_instances = var.connector_max_instances
}

# Cloud Router hosting the NAT for the egress network.
resource "google_compute_router" "egress" {
  count   = local.egress_enabled
  project = var.project_id
  name    = "${var.function_name}-egress"
  region  = var.region
  network = google_compute_network.egress[0].name
}

# NATs the connector subnet's traffic through the reserved static IP below.
# MANUAL_ONLY pins the egress to our reserved address (vs. AUTO_ONLY's ephemeral,
# unpredictable pool) so the source IP Cloud Armor sees is stable and allowlistable.
resource "google_compute_router_nat" "egress" {
  count                              = local.egress_enabled
  project                            = var.project_id
  name                               = "${var.function_name}-egress"
  router                             = google_compute_router.egress[0].name
  region                             = var.region
  nat_ip_allocate_option             = "MANUAL_ONLY"
  nat_ips                            = [google_compute_address.egress[0].self_link]
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# The reserved static IP that all backfill egress is NAT'd through. Allowlisted
# in the typesense Cloud Armor policy — see the egress_ip output.
resource "google_compute_address" "egress" {
  count        = local.egress_enabled
  project      = var.project_id
  name         = "${var.function_name}-egress"
  region       = var.region
  address_type = "EXTERNAL"
  description  = "Static outbound IP for the typesense-backfill function; allowlisted past the typesense Cloud Armor rate limit."
}
