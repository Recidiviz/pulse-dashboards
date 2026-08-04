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
    display_name = auth0_action.idaho_th_deny_unprovisioned_provider.name
    id           = auth0_action.idaho_th_deny_unprovisioned_provider.id
  }
  actions {
    display_name = auth0_action.pre_registration_setup.name
    id           = auth0_action.pre_registration_setup.id
  }
}

resource "auth0_action" "idaho_th_deny_unprovisioned_provider" {
  code    = file("${path.module}/actions/pre-registration/idaho-th-deny-unprovisioned-provider.js")
  deploy  = true
  name    = "[TF-managed][ID-TH] Deny unprovisioned provider sign-up"
  runtime = "node22"
  dependencies {
    name    = "@sentry/node"
    version = "6.11.0"
  }
  supported_triggers {
    id      = "pre-user-registration"
    version = "v2"
  }
  modules {
    module_id         = auth0_action_module.recidiviz_action_helpers.id
    module_version_id = auth0_action_module.recidiviz_action_helpers.version_id
  }
  secrets {
    name  = "SENTRY_DSN"
    value = data.sops_file.action_configs.data["SENTRY_DSN"]
  }
  secrets {
    name  = "SENTRY_ENV"
    value = data.sops_file.action_configs.data["SENTRY_ENV"]
  }
}

resource "auth0_action" "pre_registration_setup" {
  code    = file("${path.module}/actions/pre-registration/pre-registration-setup.js")
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
  supported_triggers {
    id      = "pre-user-registration"
    version = "v2"
  }
  modules {
    module_id         = auth0_action_module.recidiviz_action_helpers.id
    module_version_id = auth0_action_module.recidiviz_action_helpers.version_id
  }
  secrets {
    name  = "SENTRY_DSN"
    value = data.sops_file.action_configs.data["SENTRY_DSN"]
  }
  secrets {
    name  = "SENTRY_ENV"
    value = data.sops_file.action_configs.data["SENTRY_ENV"]
  }
  secrets {
    name  = "GOOGLE_APPLICATION_CREDENTIALS_JSON"
    value = data.sops_file.action_configs.data["GOOGLE_APPLICATION_CREDENTIALS_JSON"]
  }
  secrets {
    name  = "RECIDIVIZ_AUTH_BUCKET_PROJECT_ID"
    value = data.sops_file.action_configs.data["RECIDIVIZ_AUTH_BUCKET_PROJECT_ID"]
  }
  secrets {
    name  = "RECIDIVIZ_AUTH_BUCKET_NAME"
    value = data.sops_file.action_configs.data["RECIDIVIZ_AUTH_BUCKET_NAME"]
  }
}
