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
      env_vars = [
        for key, value in var.env_vars : {
          name  = key
          value = value
        }
      ]
    }
  ]

  members = ["allUsers"] # allow unauthenticated access: https://cloud.google.com/run/docs/authenticating/public
  ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"
}

resource "google_project_service" "compute" {
  project            = var.project_id
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}


data "google_secret_manager_secret_version" "edovo_ssl_certificate" {
  project = var.project_id
  secret  = "EDOVO_SSL_CERTIFICATE"
}

data "google_secret_manager_secret_version" "edovo_ssl_private_key" {
  project = var.project_id
  secret  = "EDOVO_SSL_PRIVATE_KEY"
}

resource "google_compute_ssl_certificate" "edovo_ssl" {
  project     = var.project_id
  name_prefix = "edovo-ssl-certificate-"
  private_key = data.google_secret_manager_secret_version.edovo_ssl_private_key.secret_data
  certificate = data.google_secret_manager_secret_version.edovo_ssl_certificate.secret_data
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
      protocol   = "HTTPS"

      log_config = {
        enable      = true
        sample_rate = 1
      }
    }
  }

  ssl                             = true
  ssl_certificates                = [google_compute_ssl_certificate.edovo_ssl.id]
  managed_ssl_certificate_domains = var.managed_certificate_domains
}
