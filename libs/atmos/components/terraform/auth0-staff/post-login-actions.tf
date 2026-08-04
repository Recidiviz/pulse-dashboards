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

locals {
  auth0_post_login_actions = var.deploy_environment == "staging" ? tolist([
    auth0_action.add_state_code_for_sso_users,
    auth0_action.force_e_mail_verification,
    auth0_action.allowlist_for_specific_app[0],
    auth0_action.update_user_restrictions,
    auth0_action.add_user_and_app_metadata_to_id_tokens,
    auth0_action.idaho_th_set_provider_metadata,
    auth0_action.idaho_th_set_staff_metadata,
    auth0_action.log_success_login_to_segment
    ]) : tolist([
    auth0_action.add_state_code_for_sso_users,
    auth0_action.force_e_mail_verification,
    auth0_action.update_user_restrictions,
    auth0_action.add_user_and_app_metadata_to_id_tokens,
    auth0_action.idaho_th_set_provider_metadata,
    auth0_action.idaho_th_set_staff_metadata,
    auth0_action.log_success_login_to_segment
  ])

  connection_id_secrets = var.deploy_environment == "staging" ? [
    "RECIDIVIZ_CONNECTION_ID"
    ] : [
    "RECIDIVIZ_CONNECTION_ID",
    "US_AZ_CONNECTION_ID",
    "US_CA_CONNECTION_ID",
    "US_CO_CONNECTION_ID",
    "US_IA_CONNECTION_ID",
    "US_ID_CONNECTION_ID",
    "US_MI_CONNECTION_ID",
    "US_MO_CONNECTION_ID",
    "US_NC_CONNECTION_ID",
    "US_ND_CONNECTION_ID",
    "US_NE_CONNECTION_ID",
    "US_PA_CONNECTION_ID",
    "US_TN_CONNECTION_ID",
    "US_TX_CONNECTION_ID",
    "US_UT_CONNECTION_ID"
  ]
}

resource "auth0_trigger_actions" "post_login" {
  trigger = "post-login"
  dynamic "actions" {
    for_each = { for index, action in local.auth0_post_login_actions : index => action }
    content {
      display_name = actions.value.name
      id           = actions.value.id
    }
  }
}

resource "auth0_action" "restrict_synthetic_monitor_ip" {
  code   = file("${path.module}/actions/post-login/restrict-synthetic-monitor-ip.js")
  deploy = true
  # only create this action in staging
  count   = var.deploy_environment == "staging" ? 1 : 0
  name    = "[TF-managed] Restrict synthetic monitor ip"
  runtime = "node22"
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
  secrets {
    name  = "SYNTHETIC_MONITOR_ALLOWED_IPS"
    value = data.sops_file.action_configs.data["SYNTHETIC_MONITOR_ALLOWED_IPS"]
  }
}

resource "auth0_action" "add_state_code_for_sso_users" {
  code    = file("${path.module}/actions/post-login/add-statecode-for-sso-users.js")
  deploy  = true
  name    = "[TF-managed] Add state code for SSO users"
  runtime = "node22"
  dependencies {
    name    = "analytics-node"
    version = "6.2.0"
  }
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
  modules {
    module_id         = auth0_action_module.recidiviz_action_helpers.id
    module_version_id = auth0_action_module.recidiviz_action_helpers.version_id
  }
  secrets {
    name  = "SEGMENT_WRITE_KEY"
    value = data.sops_file.action_configs.data["SEGMENT_WRITE_KEY"]
  }
  secrets {
    name  = "ENVIRONMENT"
    value = var.deploy_environment
  }

  dynamic "secrets" {
    for_each = toset(local.connection_id_secrets)
    iterator = secret
    content {
      name  = secret.value
      value = data.sops_file.action_configs.data[secret.value]
    }
  }
}

resource "auth0_action" "force_e_mail_verification" {
  code    = file("${path.module}/actions/post-login/force-email-verification.js")
  deploy  = true
  name    = "[TF-managed] Force E-mail Verification"
  runtime = "node22"
  dependencies {
    name    = "analytics-node"
    version = "6.2.0"
  }
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
  modules {
    module_id         = auth0_action_module.recidiviz_action_helpers.id
    module_version_id = auth0_action_module.recidiviz_action_helpers.version_id
  }
  secrets {
    name  = "SEGMENT_WRITE_KEY"
    value = data.sops_file.action_configs.data["SEGMENT_WRITE_KEY"]
  }
  secrets {
    name  = "RECIDIVIZ_VEFIFY_EMAIL_URL"
    value = data.sops_file.action_configs.data["RECIDIVIZ_VEFIFY_EMAIL_URL"]
  }
}

resource "auth0_action" "allowlist_for_specific_app" {
  code    = file("${path.module}/actions/post-login/allowlist-for-specific-app.js")
  deploy  = true
  name    = "[TF-managed] Allowlist for specific app"
  runtime = "node22"
  # only create this action in staging
  count = var.deploy_environment == "staging" ? 1 : 0
  dependencies {
    name    = "analytics-node"
    version = "6.2.0"
  }
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
  modules {
    module_id         = auth0_action_module.recidiviz_action_helpers.id
    module_version_id = auth0_action_module.recidiviz_action_helpers.version_id
  }
  secrets {
    name  = "SEGMENT_WRITE_KEY"
    value = data.sops_file.action_configs.data["SEGMENT_WRITE_KEY"]
  }
}

resource "auth0_action" "update_user_restrictions" {
  code    = file("${path.module}/actions/post-login/update-user-restrictions.js")
  deploy  = true
  name    = "[TF-managed] Update user restrictions"
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
    name    = "analytics-node"
    version = "6.2.0"
  }
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
  modules {
    module_id         = auth0_action_module.recidiviz_action_helpers.id
    module_version_id = auth0_action_module.recidiviz_action_helpers.version_id
  }
  secrets {
    name  = "SEGMENT_WRITE_KEY"
    value = data.sops_file.action_configs.data["SEGMENT_WRITE_KEY"]
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
  secrets {
    name  = "DEMO_APP_CLIENT_ID"
    value = data.sops_file.action_configs.data["DEMO_APP_CLIENT_ID"]
  }
}

resource "auth0_action" "add_user_and_app_metadata_to_id_tokens" {
  code    = file("${path.module}/actions/post-login/add-user-and-app-metadata-to-id-tokens.js")
  deploy  = true
  name    = "[TF-managed] Add user and app metadata to id tokens"
  runtime = "node22"
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
  modules {
    module_id         = auth0_action_module.recidiviz_action_helpers.id
    module_version_id = auth0_action_module.recidiviz_action_helpers.version_id
  }
  secrets {
    name  = "INTERCOM_APP_KEY"
    value = data.sops_file.action_configs.data["INTERCOM_APP_KEY"]
  }
}

resource "auth0_action" "log_success_login_to_segment" {
  code    = file("${path.module}/actions/post-login/log-success-login-to-segment.js")
  deploy  = true
  name    = "[TF-managed] Log success login to segment"
  runtime = "node22"
  dependencies {
    name    = "analytics-node"
    version = "6.2.0"
  }
  modules {
    module_id         = auth0_action_module.recidiviz_action_helpers.id
    module_version_id = auth0_action_module.recidiviz_action_helpers.version_id
  }
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
  secrets {
    name  = "SEGMENT_WRITE_KEY"
    value = data.sops_file.action_configs.data["SEGMENT_WRITE_KEY"]
  }
}

resource "auth0_action" "idaho_th_set_provider_metadata" {
  code    = file("${path.module}/actions/post-login/idaho-th-set-provider-metadata.js")
  deploy  = true
  name    = "[TF-managed][ID-TH] Set provider metadata"
  runtime = "node22"
  dependencies {
    name    = "crypto-js"
    version = "4.1.1"
  }
  modules {
    module_id         = auth0_action_module.recidiviz_action_helpers.id
    module_version_id = auth0_action_module.recidiviz_action_helpers.version_id
  }
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
}

resource "auth0_action" "idaho_th_set_staff_metadata" {
  code    = file("${path.module}/actions/post-login/idaho-th-set-staff-metadata.js")
  deploy  = true
  name    = "[TF-managed][ID-TH] Set staff metadata"
  runtime = "node22"
  dependencies {
    name    = "crypto-js"
    version = "4.1.1"
  }
  modules {
    module_id         = auth0_action_module.recidiviz_action_helpers.id
    module_version_id = auth0_action_module.recidiviz_action_helpers.version_id
  }
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
  secrets {
    name  = "ENVIRONMENT"
    value = var.deploy_environment
  }
}
