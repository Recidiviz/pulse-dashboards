# =============================================================================
# Static egress IP for the synthetic-monitor functions.
#
# By default Cloud Functions egress through Google's shared serverless IP pool,
# so the source IP the staff app / Auth0 see is unpredictable and rotates. To let
# Auth0 allowlist the monitor's test-user logins to a known source, we route the
# functions' outbound traffic through a Serverless VPC Access connector -> Cloud
# Router -> Cloud NAT pinned to a reserved static external IP (exported as
# `egress_ip`). All per-state functions in a project share this one egress IP.
#
# We deliberately do NOT use the `default` network: both projects already run
# `typesense-us-east1-nat` there (ALL_SUBNETWORKS_ALL_IP_RANGES, AUTO_ONLY). Two
# Cloud NATs can't serve overlapping subnet ranges in the same network+region,
# and that NAT would also grab our connector subnet and hand out an ephemeral IP.
# A dedicated network makes our NAT the only one in it (and GCP auto-creates the
# connector's firewall rules when the connector owns its ip_cidr_range).
#
# Gated by var.static_egress_enabled so it can be rolled out per-env (apply
# staging -> allowlist its IP in the staging Auth0 tenant -> then production) and
# reverted to the shared pool by flipping the flag off.
# =============================================================================

locals {
  egress_enabled = var.static_egress_enabled ? 1 : 0
}

# Isolated network whose only occupant is the egress connector subnet, so our
# Cloud NAT can safely NAT "all subnetworks" without colliding with typesense's.
resource "google_compute_network" "egress" {
  count                   = local.egress_enabled
  project                 = var.project_id
  name                    = "${var.function_name}-egress"
  auto_create_subnetworks = false
  description             = "Dedicated network for the staff synthetic monitor's static egress (connector + Cloud NAT)."
}

# Serverless VPC Access connector the functions route egress through. Owning its
# /28 ip_cidr_range (vs. referencing a pre-made subnet) lets GCP auto-manage the
# connector's required firewall rules. Connector names are capped at 25 chars;
# "staff-synthetic-monitor" is 23, so var.function_name fits as-is.
resource "google_vpc_access_connector" "monitor" {
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

# The reserved static IP that all monitor egress is NAT'd through. Allowlist this
# in Auth0 (see the egress_ip output).
resource "google_compute_address" "egress" {
  count        = local.egress_enabled
  project      = var.project_id
  name         = "${var.function_name}-egress"
  region       = var.region
  address_type = "EXTERNAL"
  description  = "Static outbound IP for the staff synthetic monitor functions; allowlisted in Auth0."
}

resource "google_compute_router" "egress" {
  count   = local.egress_enabled
  project = var.project_id
  name    = "${var.function_name}-egress"
  region  = var.region
  network = google_compute_network.egress[0].id
}

resource "google_compute_router_nat" "egress" {
  count   = local.egress_enabled
  project = var.project_id
  name    = "${var.function_name}-egress"
  router  = google_compute_router.egress[0].name
  region  = var.region

  # Pin egress to the reserved address rather than an auto-assigned ephemeral one.
  nat_ip_allocate_option = "MANUAL_ONLY"
  nat_ips                = [google_compute_address.egress[0].self_link]

  # Safe here because this network only contains the connector subnet.
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}
