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

resource "auth0_trigger_actions" "pre_user_registration" {
  trigger = "pre-user-registration"
  actions {
    display_name = auth0_action.pre_registration_setup.name
    id           = auth0_action.pre_registration_setup.id
  }
}

resource "auth0_action" "pre_registration_setup" {
  code    = file("${path.module}/actions/01-pre-registration-setup.js")
  deploy  = true
  name    = "[TF-managed] Pre-registration Setup"
  runtime = "node22"
  dependencies {
    name    = "@google-cloud/storage"
    version = "6.12.0"
  }
  dependencies {
    name    = "@sentry/node"
    version = "6.11.0"
  }
  dependencies {
    name    = "crypto-js"
    version = "4.1.1"
  }
  dependencies {
    name    = "google-auth-library"
    version = "7.6.2"
  }
  supported_triggers {
    id      = "pre-user-registration"
    version = "v2"
  }
  secrets {
    name  = "SENTRY_DSN"
    value = data.sops_file.configs.data["SENTRY_DSN"]
  }
  secrets {
    name  = "SENTRY_ENV"
    value = data.sops_file.configs.data["SENTRY_ENV"]
  }
  secrets {
    name  = "GOOGLE_APPLICATION_CREDENTIALS_JSON"
    value = data.sops_file.configs.data["GOOGLE_APPLICATION_CREDENTIALS_JSON"]
  }
  secrets {
    name  = "RECIDIVIZ_AUTH_BUCKET_PROJECT_ID"
    value = data.sops_file.configs.data["RECIDIVIZ_AUTH_BUCKET_PROJECT_ID"]
  }
  secrets {
    name  = "RECIDIVIZ_AUTH_BUCKET_NAME"
    value = data.sops_file.configs.data["RECIDIVIZ_AUTH_BUCKET_NAME"]
  }
  secrets {
    name  = "RECIDIVIZ_ADMIN_PANEL_URL"
    value = data.sops_file.configs.data["RECIDIVIZ_ADMIN_PANEL_URL"]
  }
  secrets {
    name  = "RECIDIVIZ_ADMIN_PANEL_TARGET_AUDIENCE"
    value = data.sops_file.configs.data["RECIDIVIZ_ADMIN_PANEL_TARGET_AUDIENCE"]
  }
}
