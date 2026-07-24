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

data "sops_file" "action_configs" {
  source_file = "${path.module}/secrets/recidiviz-${var.deploy_environment}-auth0-action-configs.enc.yaml"
}

resource "auth0_action_module" "recidiviz_action_helpers" {
  name    = "recidiviz-action-helpers"
  publish = true
  code    = file("${path.module}/modules/recidiviz-action-helpers.js")
  dependencies {
    name    = "crypto-js"
    version = "4.1.1"
  }
  dependencies {
    name    = "google-auth-library"
    version = "7.3.0"
  }
  secrets {
    name  = "IDAHO_TH_CLIENT_ID"
    value = data.sops_file.action_configs.data["IDAHO_TH_CLIENT_ID"]
  }
  secrets {
    name  = "GOOGLE_APPLICATION_CREDENTIALS_JSON"
    value = data.sops_file.action_configs.data["GOOGLE_APPLICATION_CREDENTIALS_JSON"]
  }
  secrets {
    name  = "RECIDIVIZ_ADMIN_PANEL_TARGET_AUDIENCE"
    value = data.sops_file.action_configs.data["RECIDIVIZ_ADMIN_PANEL_TARGET_AUDIENCE"]
  }
  secrets {
    name  = "RECIDIVIZ_ADMIN_PANEL_URL"
    value = data.sops_file.action_configs.data["RECIDIVIZ_ADMIN_PANEL_URL"]
  }
}
