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

resource "google_project_service" "certificate_manager" {
  project            = var.project_id
  service            = "certificatemanager.googleapis.com"
  disable_on_destroy = false
}

module "waf" {
  source  = "../../modules/waf-policy"
  name    = "meetings-server-waf"
  project = var.project_id
  region  = var.location
}

module "lb_backend" {
  source = "../../vendor/regional-lb-http-backend"

  name       = "meetings-server"
  project_id = var.project_id
  region     = var.location

  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"

  security_policy = module.waf.id

  serverless_neg_backends = [{
    region       = var.location
    type         = "cloud-run"
    service_name = module.server.service_name
  }]

  log_config = {
    enable      = true
    sample_rate = 1.0
  }
}

module "lb_frontend" {
  source = "../../vendor/regional-lb-http-frontend"

  depends_on = [google_project_service.certificate_manager]

  name       = "meetings-server"
  project_id = var.project_id
  region     = var.location
  network    = "default"

  load_balancing_scheme = "EXTERNAL_MANAGED"

  # We have one already created in apps/shared-infra since it's not specific to meetings- every
  # load balancer in the same region and VPC network uses the same proxy-only subnetwork
  create_proxy_only_subnet = false

  ssl                             = true
  managed_ssl_certificate_domains = [var.domain_name]
  https_redirect                  = true
  random_certificate_suffix       = true

  url_map_input = module.lb_backend.backend_service_info
}
