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

data "sops_file" "configs" {
  source_file = "${path.module}/secrets/recidiviz-dev-auth0-configs.enc.yaml"
}

resource "auth0_action" "restrict_synthetic_monitor_ip" {
  code   = file("${path.module}/actions/00-restrict-synthetic-monitor-ip.js")
  deploy = true
  # only create this action in staging
  count   = var.deploy_environment == "staging" ? 1 : 0
  name    = "[TF-managed] 00-restrict-synthetic-monitor-ip"
  runtime = "node22"
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
  secrets {
    name  = "SYNTHETIC_MONITOR_ALLOWED_IPS"
    value = data.sops_file.configs.data["synthetic_monitor_allowed_ips"]
  }
}
