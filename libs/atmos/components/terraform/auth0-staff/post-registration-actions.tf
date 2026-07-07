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

resource "auth0_trigger_actions" "post_user_registration" {
  trigger = "post-user-registration"
  actions {
    display_name = auth0_action.log_success_signup_to_segment.name
    id           = auth0_action.log_success_signup_to_segment.id
  }
}

resource "auth0_action" "log_success_signup_to_segment" {
  code    = file("${path.module}/actions/07-log-success-signup-to-segment.js")
  deploy  = true
  name    = "[TF-managed] 07-log-success-signup-to-segment"
  runtime = "node22"
  dependencies {
    name    = "analytics-node"
    version = "6.2.0"
  }
  supported_triggers {
    id      = "post-user-registration"
    version = "v2"
  }
  secrets {
    name  = "SEGMENT_WRITE_KEY"
    value = data.sops_file.configs.data["segment_write_key"]
  }
}
