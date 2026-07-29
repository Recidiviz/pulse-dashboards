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

resource "auth0_connection_clients" "email" {
  count           = var.deploy_environment == "staging" ? 0 : 1
  connection_id   = auth0_connection.email[0].id
  enabled_clients = [data.sops_file.action_configs.data["IDAHO_TH_CLIENT_ID"]]
}

resource "auth0_connection" "email" {
  count                = var.deploy_environment == "staging" ? 0 : 1
  is_domain_connection = false
  metadata             = {}
  name                 = "email"
  show_as_button       = false
  strategy             = "email"
  authentication {
    active = true
  }
  connected_accounts {
    active = false
  }
  options {
    access_token_url                       = null
    adfs_server                            = null
    allowed_audiences                      = []
    api_enable_groups                      = false
    api_enable_users                       = false
    app_id                                 = null
    auth_params                            = {}
    brute_force_protection                 = true
    client_id                              = null
    client_secret                          = null # sensitive
    community_base_url                     = null
    configuration                          = null # sensitive
    consumer_key                           = null
    consumer_secret                        = null
    custom_scripts                         = {}
    debug                                  = false
    destination_url                        = null
    digest_algorithm                       = null
    disable_cache                          = false
    disable_self_service_change_password   = false
    disable_sign_out                       = false
    disable_signup                         = false
    discovery_url                          = null
    domain                                 = null
    domain_aliases                         = []
    dpop_signing_alg                       = null
    email                                  = false
    enable_script_context                  = false
    enabled_database_customization         = false
    entity_id                              = null
    fed_metadata_xml                       = null
    fields_map                             = null
    forward_request_info                   = false
    from                                   = "Recidiviz Transitional Housing <no-reply@recidiviz.org>"
    gateway_url                            = null
    global_token_revocation_jwt_iss        = null
    global_token_revocation_jwt_sub        = null
    icon_url                               = null
    id_token_session_expiry_supported      = false
    id_token_signed_response_algs          = []
    identity_api                           = null
    import_mode                            = false
    ips                                    = []
    key_id                                 = null
    map_user_id_to_id                      = false
    max_groups_to_retrieve                 = null
    messaging_service_sid                  = null
    metadata_url                           = null
    metadata_xml                           = null
    name                                   = "email"
    non_persistent_attrs                   = []
    ping_federate_base_url                 = null
    pkce_enabled                           = false
    precedence                             = []
    protocol_binding                       = null
    provider                               = null
    realm_fallback                         = false
    recipient_url                          = null
    request_template                       = null
    request_token_url                      = null
    requires_username                      = false
    scopes                                 = []
    scripts                                = {}
    send_back_channel_nonce                = false
    session_key                            = null
    should_trust_email_verified_connection = null
    sign_saml_request                      = false
    signature_algorithm                    = null
    signature_method                       = null
    strategy_version                       = 0
    subject                                = "Sign in to Idaho TH"
    syntax                                 = "liquid"
    team_id                                = null
    template                               = file("${path.module}/templates/passwordless_email.html")
    tenant_domain                          = null
    token_endpoint_auth_method             = null
    token_endpoint_auth_signing_alg        = null
    token_endpoint_jwtca_aud_format        = null
    twilio_sid                             = null
    twilio_token                           = null # sensitive
    upstream_params                        = null
    use_cert_auth                          = false
    use_kerberos                           = false
    use_oauth_spec_scope                   = false
    use_wsfed                              = false
    user_authorization_url                 = null
    user_id_attribute                      = null
    waad_common_endpoint                   = false
    waad_protocol                          = null
    totp {
      length    = 6
      time_step = 180
    }
  }
}

resource "auth0_prompt_screen_partial" "login_passwordless_login_passwordless_email_code" {
  count       = var.deploy_environment == "staging" ? 0 : 1
  prompt_type = "login-passwordless"
  screen_name = "login-passwordless-email-code"
}

resource "auth0_prompt_custom_text" "en_login_passwordless" {
  count = var.deploy_environment == "staging" ? 0 : 1
  body = jsonencode({
    login-passwordless-email-code = {
      description      = "We've sent a code to $${email}. It may take a minute to arrive. If you don't see it, check your spam or junk folder."
      resendActionText = "get a new code"
      resendText       = "Didn't receive an email? Check your spam or junk folder, or"
    }
  })
  language = "en"
  prompt   = "login-passwordless"
}
