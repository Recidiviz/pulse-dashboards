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

resource "auth0_trigger_actions" "post_login" {
  trigger = "post-login"
  actions {
    display_name = auth0_action.add_state_code_for_sso_users.name
    id           = auth0_action.add_state_code_for_sso_users.id
  }
  actions {
    display_name = auth0_action.force_e_mail_verification.name
    id           = auth0_action.force_e_mail_verification.id
  }
  actions {
    display_name = auth0_action.allowlist_for_specific_app.name
    id           = auth0_action.allowlist_for_specific_app.id
  }
  actions {
    display_name = auth0_action.update_user_restrictions.name
    id           = auth0_action.update_user_restrictions.id
  }
  actions {
    display_name = auth0_action.add_user_and_app_metadata_to_id_tokens.name
    id           = auth0_action.add_user_and_app_metadata_to_id_tokens.id
  }
  actions {
    display_name = auth0_action.log_success_login_to_segment.name
    id           = auth0_action.log_success_login_to_segment.id
  }
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
    value = data.sops_file.configs.data["SYNTHETIC_MONITOR_ALLOWED_IPS"]
  }
}

resource "auth0_action" "add_state_code_for_sso_users" {
  code    = file("${path.module}/actions/06-add-statecode-for-sso-users.js")
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
  secrets {
    name  = "SEGMENT_WRITE_KEY"
    value = data.sops_file.configs.data["SEGMENT_WRITE_KEY"]
  }
  secrets {
    name  = "RECIDIVIZ_CONNECTION_ID"
    value = data.sops_file.configs.data["RECIDIVIZ_CONNECTION_ID"]
  }
  secrets {
    name  = "ENVIRONMENT"
    value = var.deploy_environment
  }
}

resource "auth0_action" "force_e_mail_verification" {
  code    = file("${path.module}/actions/02-force-email-verification.js")
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
  secrets {
    name  = "SEGMENT_WRITE_KEY"
    value = data.sops_file.configs.data["SEGMENT_WRITE_KEY"]
  }
  secrets {
    name  = "RECIDIVIZ_VEFIFY_EMAIL_URL"
    value = data.sops_file.configs.data["RECIDIVIZ_VEFIFY_EMAIL_URL"]
  }
}

resource "auth0_action" "allowlist_for_specific_app" {
  code    = file("${path.module}/actions/03-allowlist-for-specific-app.js")
  deploy  = true
  name    = "[TF-managed] Allowlist for specific app"
  runtime = "node22"
  dependencies {
    name    = "analytics-node"
    version = "6.2.0"
  }
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
  secrets {
    name  = "SEGMENT_WRITE_KEY"
    value = data.sops_file.configs.data["SEGMENT_WRITE_KEY"]
  }
}

resource "auth0_action" "update_user_restrictions" {
  code    = file("${path.module}/actions/04-update-user-restrictions.js")
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
  dependencies {
    name    = "crypto-js"
    version = "4.1.1"
  }
  dependencies {
    name    = "google-auth-library"
    version = "7.3.0"
  }
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
  secrets {
    name  = "SEGMENT_WRITE_KEY"
    value = data.sops_file.configs.data["SEGMENT_WRITE_KEY"]
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
    name  = "DEMO_APP_CLIENT_ID"
    value = data.sops_file.configs.data["DEMO_APP_CLIENT_ID"]
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

resource "auth0_action" "add_user_and_app_metadata_to_id_tokens" {
  code    = file("${path.module}/actions/05-add-user-and-app-metadata-to-id-tokens.js")
  deploy  = true
  name    = "[TF-managed] Add user and app metadata to id tokens"
  runtime = "node22"
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
  secrets {
    name  = "INTERCOM_APP_KEY"
    value = data.sops_file.configs.data["INTERCOM_APP_KEY"]
  }
}

resource "auth0_action" "log_success_login_to_segment" {
  code    = file("${path.module}/actions/08-log-success-login-to-segment.js")
  deploy  = true
  name    = "[TF-managed] 08-log-success-login-to-segment"
  runtime = "node22"
  dependencies {
    name    = "analytics-node"
    version = "6.2.0"
  }
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
  secrets {
    name  = "SEGMENT_WRITE_KEY"
    value = data.sops_file.configs.data["SEGMENT_WRITE_KEY"]
  }
}
