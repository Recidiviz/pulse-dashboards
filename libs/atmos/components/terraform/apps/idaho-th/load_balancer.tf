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
  count = var.enable_load_balancer ? 1 : 0

  project            = var.project_id
  service            = "certificatemanager.googleapis.com"
  disable_on_destroy = false
}

module "waf" {
  count  = var.enable_load_balancer ? 1 : 0
  source = "../../modules/waf-policy"

  name    = "${var.server_name}-waf"
  project = var.project_id
  region  = var.location

  # Known false positives on this exact path: the SQLi ruleset flags common
  # English words that are also SQL keywords (e.g. "union"), and the RCE
  # ruleset flags certain wording/punctuation patterns in free-text form
  # fields. Only these two categories are skipped here — every other
  # category and the rate limiter (main.tf, waf-policy module) still apply.
  category_exclusions = [
    {
      priority     = 1000 # SQL Injection
      exclude_when = "request.path.matches('^/api/trpc/housingApplication[.]submitDraft$')"
    },
    {
      priority     = 1004 # Remote code execution
      exclude_when = "request.path.matches('^/api/trpc/housingApplication[.]submitDraft$')"
    },
  ]
}

module "lb_backend_api" {
  count  = var.enable_load_balancer ? 1 : 0
  source = "../../vendor/regional-lb-http-backend"

  name       = "${var.server_name}-api"
  project_id = var.project_id
  region     = var.location

  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"
  security_policy       = module.waf[0].id

  host_path_mappings = [
    { host = "*", path = "/api/*" },
    { host = "*", path = "/internal/*" },
  ]

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

module "lb_backend_frontend" {
  count  = var.enable_load_balancer ? 1 : 0
  source = "../../vendor/regional-lb-http-backend"

  name       = var.frontend_name
  project_id = var.project_id
  region     = var.location

  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"
  security_policy       = module.waf[0].id

  host_path_mappings = [{ host = "*", path = "/*" }]

  serverless_neg_backends = [{
    region       = var.location
    type         = "cloud-run"
    service_name = module.frontend[0].service_name
  }]

  log_config = {
    enable      = true
    sample_rate = 1.0
  }
}

resource "google_compute_region_ssl_policy" "idaho_th" {
  count = var.enable_load_balancer ? 1 : 0

  project         = var.project_id
  region          = var.location
  name            = "${var.server_name}-ssl-policy"
  profile         = "RESTRICTED"
  min_tls_version = "TLS_1_2"
}

module "lb_frontend" {
  count  = var.enable_load_balancer ? 1 : 0
  source = "../../vendor/regional-lb-http-frontend"

  depends_on = [google_project_service.certificate_manager]

  name       = var.server_name
  project_id = var.project_id
  region     = var.location
  network    = "default"

  load_balancing_scheme = "EXTERNAL_MANAGED"
  ssl_policy            = google_compute_region_ssl_policy.idaho_th[0].self_link

  create_proxy_only_subnet = var.lb_create_proxy_only_subnet
  proxy_only_subnet_ip     = var.lb_proxy_only_subnet_ip

  ssl                             = true
  managed_ssl_certificate_domains = [var.domain_name]
  https_redirect                  = true
  random_certificate_suffix       = true

  url_map_input = concat(
    module.lb_backend_api[0].backend_service_info,
    module.lb_backend_frontend[0].backend_service_info,
  )
}
