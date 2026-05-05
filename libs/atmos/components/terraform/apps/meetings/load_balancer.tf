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

module "waf" {
  source  = "../../modules/waf-policy"
  name    = "meetings-server-waf"
  project = var.project_id
}

resource "google_compute_region_network_endpoint_group" "serverless_neg" {
  name                  = "meetings-server-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.location
  project               = var.project_id

  cloud_run {
    service = module.server.service_name
  }
}

module "load_balancer" {
  source = "../../vendor/lb-http"

  name    = "meetings-server-lb"
  project = var.project_id

  ssl                             = true
  managed_ssl_certificate_domains = [var.domain_name]
  https_redirect                  = true

  backends = {
    default = {
      protocol    = "HTTPS"
      port_name   = "http"
      description = "Meetings server Cloud Run backend"

      enable_cdn = false

      log_config = {
        enable      = true
        sample_rate = 1.0
      }

      groups = []

      security_policy = module.waf.id

      serverless_neg_backends = [{
        region = var.location
        type   = "cloud-run"
        service = {
          name = module.server.service_name
        }
      }]

      iap_config = {
        enable = false
      }
    }
  }

  depends_on = [
    google_compute_region_network_endpoint_group.serverless_neg
  ]
}
