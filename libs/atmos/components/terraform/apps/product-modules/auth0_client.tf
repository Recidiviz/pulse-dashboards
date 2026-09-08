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

resource "auth0_client" "module_server" {
  name            = "Shared Module Server"
  grant_types     = ["authorization_code", "implicit", "refresh_token", "client_credentials"]
  app_type        = "non_interactive"
  is_first_party  = true
  oidc_conformant = true

  jwt_configuration {
    alg                 = "RS256"
    lifetime_in_seconds = 36000
    scopes              = {}
    secret_encoded      = false
  }

  refresh_token {
    expiration_type              = "non-expiring"
    idle_token_lifetime          = 1296000
    infinite_idle_token_lifetime = true
    infinite_token_lifetime      = true
    leeway                       = 0
    rotation_type                = "non-rotating"
    token_lifetime               = 2592000
  }
}

resource "auth0_client_credentials" "module_server" {
  client_id             = auth0_client.module_server.id
  authentication_method = "client_secret_post"
}

resource "auth0_resource_server" "module_server" {
  # TODO(COS-58): [Mod] Define public url for modules backend in tf
  identifier                                      = "https://modules-staging.recidiviz.org"
  name                                            = "Module Server"
  signing_alg                                     = "RS256"
  allow_offline_access                            = true
  skip_consent_for_verifiable_first_party_clients = true
  token_dialect                                   = "access_token"
  token_lifetime                                  = 86400
  token_lifetime_for_web                          = 7200
}

resource "auth0_client_grant" "module_server_api_grant" {
  # TODO(COS-58): [Mod] Define public url for modules backend in tf
  audience  = auth0_resource_server.module_server.identifier
  client_id = auth0_client.module_server.id
  scopes    = []
}
