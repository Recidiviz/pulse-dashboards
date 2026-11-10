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

resource "terraform_data" "validate_frontend_env_keys" {
  count = var.enable_load_balancer ? 1 : 0

  lifecycle {
    precondition {
      condition = alltrue([
        for key in var.frontend_env_keys : contains(keys(local.env_secrets), key)
      ])
      error_message = "Each entry in frontend_env_keys must exist in ${var.secrets_filename}."
    }
  }
}

module "frontend" {
  count  = var.enable_load_balancer ? 1 : 0
  source = "../../vendor/cloud-run"

  depends_on = [
    terraform_data.validate_frontend_env_keys,
    google_project_iam_member.frontend_logwriter,
    google_project_iam_member.frontend_artifactregistryreader,
  ]

  project_id                    = var.project_id
  location                      = var.location
  service_name                  = var.frontend_name
  service_account               = google_service_account.frontend[0].email
  cloud_run_deletion_protection = false
  ingress                       = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"
  service_scaling = {
    min_instance_count = var.frontend_min_instance_count
  }

  containers = [
    {
      container_image = local.frontend_image
      env_vars        = local.frontend_env_vars
      resources = {
        limits = {
          cpu    = var.frontend_cpu
          memory = var.frontend_memory
        }
      }
    }
  ]

  members = var.frontend_invoker_members
}
