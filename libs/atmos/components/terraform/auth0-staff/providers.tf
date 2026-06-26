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

terraform {
  required_version = "1.11.4"
  required_providers {
    auth0 = {
      source  = "auth0/auth0"
      version = "1.50.0"
    }
    sops = {
      source  = "carlpett/sops"
      version = "~> 1.4"
    }
  }
}

ephemeral "sops_file" "credentials" {
  source_file = "${path.module}/secrets/recidiviz-dev-auth0-credentials.enc.yaml"
}

provider "auth0" {
  domain        = ephemeral.sops_file.credentials.data["auth0_domain"]
  client_id     = ephemeral.sops_file.credentials.data["auth0_client_id"]
  client_secret = ephemeral.sops_file.credentials.data["auth0_client_secret"]
}
