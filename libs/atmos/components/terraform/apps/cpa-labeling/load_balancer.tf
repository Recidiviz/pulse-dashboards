# HTTP(S) Load Balancer with IAP for Cloud Run
# This load balancer provides IAP authentication in front of the Cloud Run service

# SSL certificate (managed or existing)
resource "google_compute_managed_ssl_certificate" "default" {
  provider = google-beta
  count    = length(var.ssl_certificates) == 0 ? 1 : 0
  project  = var.project_id
  name     = "cpa-labeling-cert-${local.environment}"

  managed {
    domains = [var.domain_name]
  }
}

# Serverless NEG for Cloud Run
resource "google_compute_region_network_endpoint_group" "serverless_neg" {
  provider              = google-beta
  project               = var.project_id
  name                  = "cpa-labeling-neg-${local.environment}"
  network_endpoint_type = "SERVERLESS"
  region                = var.location

  cloud_run {
    service = module.server.service_name
  }
}

# GovRAMP AC-17(2): without an SSL policy the HTTPS frontend uses GCP's default,
# which accepts TLS 1.0/1.1 handshakes.
resource "google_compute_ssl_policy" "restricted" {
  project         = var.project_id
  name            = "cpa-labeling-ssl-policy-${local.environment}"
  profile         = "RESTRICTED"
  min_tls_version = "TLS_1_2"
}

# HTTP(S) Load Balancer with IAP
module "lb_http" {
  source = "../../vendor/lb-http"

  project = var.project_id
  name    = "cpa-labeling-lb-${local.environment}"

  ssl                             = true
  ssl_policy                      = google_compute_ssl_policy.restricted.self_link
  managed_ssl_certificate_domains = length(var.ssl_certificates) == 0 ? [var.domain_name] : []
  ssl_certificates                = var.ssl_certificates
  https_redirect                  = true
  labels = {
    environment = local.environment
    app         = "cpa-labeling"
  }

  backends = {
    default = {
      protocol    = "HTTPS"
      port_name   = "http"
      description = "CPA Labeling Cloud Run backend with IAP"

      enable_cdn = false

      # IAP configuration
      iap_config = {
        enable               = true
        oauth2_client_id     = local.values["iap_client_client_id"]
        oauth2_client_secret = local.values["iap_client_secret"]
      }

      log_config = {
        enable      = true
        sample_rate = 1.0
      }

      groups = []

      # Serverless NEG for Cloud Run
      serverless_neg_backends = [{
        region = var.location
        type   = "cloud-run"
        service = {
          name = module.server.service_name
        }
      }]
    }
  }

  depends_on = [
    google_compute_region_network_endpoint_group.serverless_neg
  ]
}
