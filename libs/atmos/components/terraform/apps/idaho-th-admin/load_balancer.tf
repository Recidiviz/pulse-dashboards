# Global, not regional like apps/idaho-th's own LB: recidiviz-data's IAP JWT
# validation (validate_iap_jwt_from_compute_engine, recidiviz/utils/validate_jwt.py:37-58)
# hardcodes expected_audience to the global "/projects/.../global/backendServices/..."
# format (validate_jwt.py:55-57); a regional backend produces a different
# audience and every request would fail auth.
#
# iap_enabled must apply as false first, then get turned on via the Console
# (Security > Identity-Aware Proxy) — see README.md. Google-managed OAuth
# needs no client id/secret: omitting oauth2_client_id/secret means "use the
# Google-managed client", matching the Console default.

# GovRAMP AC-17(2): without an SSL policy the HTTPS frontend uses GCP's
# default, which accepts TLS 1.0/1.1 handshakes.
resource "google_compute_ssl_policy" "restricted" {
  project         = var.project_id
  name            = "${var.server_name}-ssl-policy"
  profile         = "RESTRICTED"
  min_tls_version = "TLS_1_2"
}

module "lb_http" {
  source = "../../vendor/lb-http"

  project = var.project_id
  name    = "${var.server_name}-lb"

  ssl                             = true
  ssl_policy                      = google_compute_ssl_policy.restricted.self_link
  managed_ssl_certificate_domains = [var.domain_name]
  https_redirect                  = true

  labels = {
    app = "idaho-th-admin"
  }

  backends = {
    default = {
      protocol    = "HTTPS"
      port_name   = "http"
      description = "Idaho TH admin panel Cloud Run backend with IAP"

      enable_cdn = false
      groups     = []

      iap_config = {
        enable = var.iap_enabled
        # oauth2_client_id/secret intentionally omitted: Google-managed OAuth.
      }

      log_config = {
        enable      = true
        sample_rate = 1.0
      }

      serverless_neg_backends = [{
        region = var.location
        type   = "cloud-run"
        service = {
          name = module.server.service_name
        }
      }]
    }
  }
}
