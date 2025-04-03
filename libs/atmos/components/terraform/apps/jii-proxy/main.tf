# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2025 Recidiviz, Inc.
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

module "cloud-run" {
  source = "../../vendor/cloud-run"

  service_name = "jii-proxy-server"
  location     = var.location
  project_id   = var.project_id

  containers = [
    {
      container_image = "${var.artifact_registry_repo}/jii-proxy-server:${var.server_version}"
    }
  ]

  members = var.members
}

resource "google_project_service" "compute" {
  project            = var.project_id
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

resource "google_compute_region_network_endpoint_group" "serverless_neg" {
  depends_on = [google_project_service.compute]

  name                  = "jii-proxy-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.location
  project               = var.project_id
  cloud_run {
    service = module.cloud-run.service_name
  }
}

module "load-balancer" {
  source = "../../vendor/lb-http"

  name    = "jii-proxy-lb"
  project = var.project_id

  backends = {
    default = {
      groups = [
        {
          group = google_compute_region_network_endpoint_group.serverless_neg.id
        }
      ]

      enable_cdn = false

      log_config = {
        enable      = true
        sample_rate = 1
      }
    }
  }
}
