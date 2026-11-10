# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
# =============================================================================

# Private path from Cloud Run to Cloud SQL: PSA peering + a Direct VPC
# Egress subnet. Gated by variables so a stack can either create both fresh
# or point at ones that already exist.

resource "google_project_service" "servicenetworking" {
  count = var.create_private_service_access ? 1 : 0

  project            = var.project_id
  service            = "servicenetworking.googleapis.com"
  disable_on_destroy = false
}

resource "google_compute_global_address" "private_service_access" {
  count = var.create_private_service_access ? 1 : 0

  project       = var.project_id
  name          = "google-managed-services-default"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  address       = var.private_service_access_address
  prefix_length = var.private_service_access_prefix_length
  network       = local.vpc_network

  depends_on = [google_project_service.servicenetworking]
}

resource "google_service_networking_connection" "private_service_access" {
  count = var.create_private_service_access ? 1 : 0

  network                 = local.vpc_network
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_service_access[0].name]

  # Without this, destroying this resource attempts a real peering deletion,
  # which fails or hangs while the Cloud SQL instance still uses this range —
  # and the peering is project-wide, not scoped to this one instance.
  deletion_policy = "ABANDON"
}

resource "google_compute_subnetwork" "direct_egress" {
  count = var.create_direct_egress_subnet ? 1 : 0

  project       = var.project_id
  name          = "${var.server_name}-direct-egress-subnetwork"
  region        = var.location
  network       = local.vpc_network
  ip_cidr_range = var.direct_egress_subnet_cidr
}

data "google_compute_subnetwork" "direct_egress_existing" {
  count = var.enable_private_db_egress && !var.create_direct_egress_subnet ? 1 : 0

  project = var.project_id
  name    = var.direct_egress_subnetwork_name
  region  = var.location
}

locals {
  # Every resource in this file operates on the project's own "default" VPC —
  # pulled into one place instead of repeating the literal at each call site
  # below.
  vpc_network = "projects/${var.project_id}/global/networks/default"

  # Reads .network off the connection resource, not var.private_network, so
  # only the SQL instance depends on it. A module-level depends_on would
  # defer every data source in module.database, forcing a false replacement.
  private_network_ref = (
    var.create_private_service_access
    ? google_service_networking_connection.private_service_access[0].network
    : var.private_network
  )

  # Cloud Run's vpc_access.network_interfaces.subnetwork wants the relative
  # form (projects/*/regions/*/subnetworks/*) — a subnetwork's .self_link is
  # a full https://www.googleapis.com/compute/... URL, which GCP rejects here.
  direct_egress_subnetwork_name_resolved = var.enable_private_db_egress ? (
    var.create_direct_egress_subnet
    ? google_compute_subnetwork.direct_egress[0].name
    : data.google_compute_subnetwork.direct_egress_existing[0].name
  ) : null

  # vendor/cloud-run takes vpc_access as a single nullable object;
  # vendor/cloud-run-job-exec takes list(object(...)) — the _list variant
  # below exists only so job modules get that shape.
  direct_db_egress_vpc_access = var.enable_private_db_egress ? {
    egress = "PRIVATE_RANGES_ONLY"
    network_interfaces = {
      network    = local.vpc_network
      subnetwork = "projects/${var.project_id}/regions/${var.location}/subnetworks/${local.direct_egress_subnetwork_name_resolved}"
    }
  } : null

  direct_db_egress_vpc_access_list = (
    local.direct_db_egress_vpc_access != null
    ? [local.direct_db_egress_vpc_access]
    : []
  )
}
