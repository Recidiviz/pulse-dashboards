# Global external Application Load Balancer + Cloud CDN in front of the
# frontend buckets. Replaces Firebase Hosting for staff (see firebase.json for
# the behavior being reproduced: SPA fallback, response headers, cache tiers).

locals {
  # Mirrors firebase.json hosting.headers — keep the two in sync until Firebase
  # Hosting is retired for staff.
  custom_response_headers = [
    "X-Frame-Options: DENY",
    "Content-Security-Policy: script-src 'self' cdn.segment.com widget.intercom.io js.intercomcdn.com www.google-analytics.com edge.fullstory.com www.googletagmanager.com maps.googleapis.com 'unsafe-eval'; frame-ancestors 'self'; form-action 'self'; report-uri https://o432474.ingest.us.sentry.io/api/5385222/security/?sentry_key=4349c85a99054a4799fb4117d6adea32; report-to csp-endpoint",
    "Reporting-Endpoints: csp-endpoint=\"https://o432474.ingest.us.sentry.io/api/5385222/security/?sentry_key=4349c85a99054a4799fb4117d6adea32\"",
  ]
}

# The origin bucket is private, and GCS serves authenticated reads with
# `Cache-Control: private` regardless of object metadata — so cache behavior
# must be forced here (FORCE_CACHE_ALL + TTLs), not set at upload time.
# Two backend buckets point at the same GCS bucket to recover Firebase's two
# cache tiers (long-lived hashed /assets vs revalidate-every-hour HTML).

resource "google_compute_backend_bucket" "assets" {
  name        = "staff-frontend-assets-${var.environment}"
  description = "Content-hashed immutable build assets (/assets/*)"
  bucket_name = google_storage_bucket.frontend.name

  enable_cdn       = true
  compression_mode = "AUTOMATIC"

  custom_response_headers = local.custom_response_headers

  cdn_policy {
    cache_mode = "FORCE_CACHE_ALL"
    # Must stay below asset_retention_days (30d) so edge caches never serve an
    # object past its origin deletion. Filenames are content-hashed, so client
    # caching this long is always correct.
    default_ttl = 604800 # 7 days
    client_ttl  = 604800
  }
}

resource "google_compute_backend_bucket" "html" {
  name        = "staff-frontend-html-${var.environment}"
  description = "index.html and other root files (default route)"
  bucket_name = google_storage_bucket.frontend.name

  enable_cdn = true
  # Compression DISABLED (not AUTOMATIC) on the HTML path. Dynamic Brotli of the
  # SPA deep-link fallback (a custom-error-response body, served via the `index`
  # bucket below when a deep link 404s here) intermittently caches a zero-length
  # response, so browsers — which always negotiate br — get a blank page. The
  # uncompressed variant is always correct. index.html is ~1.6 KB, so losing
  # Brotli here is negligible; assets keep AUTOMATIC (they don't hit this path).
  compression_mode = "DISABLED"

  custom_response_headers = local.custom_response_headers

  cdn_policy {
    cache_mode = "FORCE_CACHE_ALL"
    # Firebase served HTML with max-age=0, s-maxage=3600: edge caches for an
    # hour (deploys invalidate), browsers always revalidate.
    default_ttl = 3600
    client_ttl  = 0
  }
}

resource "google_compute_backend_bucket" "index" {
  name        = "staff-frontend-index-${var.environment}"
  description = "Public index.html bucket serving the SPA deep-link fallback"
  bucket_name = google_storage_bucket.frontend_index.name

  enable_cdn = true
  # DISABLED, not AUTOMATIC: this is the error_service for the SPA fallback, and
  # dynamically compressing that custom-error-response body caches empty (0-byte)
  # responses. See the `html` bucket above for the full rationale.
  compression_mode = "DISABLED"

  custom_response_headers = local.custom_response_headers

  cdn_policy {
    cache_mode  = "FORCE_CACHE_ALL"
    default_ttl = 3600
    client_ttl  = 0
  }
}

# LOAD-BEARING SHIM — do not remove. Custom error response policies (the SPA
# deep-link fallback below) silently no-op unless the load balancer has at
# least one backend SERVICE attached, in addition to backend buckets. This
# service has no backends and never receives real traffic; it exists only to
# satisfy that documented requirement via the /__lb-shim/* path rule.
resource "google_compute_health_check" "shim" {
  name = "staff-frontend-shim-${var.environment}"

  tcp_health_check {
    port = 80
  }
}

resource "google_compute_backend_service" "error_policy_shim" {
  name                  = "staff-frontend-shim-${var.environment}"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTP"
  health_checks         = [google_compute_health_check.shim.id]
}

resource "google_compute_url_map" "frontend" {
  name            = "staff-frontend-${var.environment}"
  default_service = google_compute_backend_bucket.html.id

  host_rule {
    hosts        = ["*"]
    path_matcher = "main"
  }

  path_matcher {
    name            = "main"
    default_service = google_compute_backend_bucket.html.id

    # A bucket-root GET is a LIST operation, which succeeds (200 XML listing)
    # instead of 404ing into the SPA fallback below — so "/" must be rewritten
    # to index.html explicitly. Prefix-rewriting the matched "/" yields exactly
    # "/index.html". Also keeps the bucket listing unreachable.
    path_rule {
      paths   = ["/"]
      service = google_compute_backend_bucket.html.id

      route_action {
        url_rewrite {
          path_prefix_rewrite = "/index.html"
        }
      }
    }

    path_rule {
      paths   = ["/assets/*"]
      service = google_compute_backend_bucket.assets.id
    }

    # See the shim backend service above.
    path_rule {
      paths   = ["/__lb-shim/*"]
      service = google_compute_backend_service.error_policy_shim.id
    }

    # SPA deep-link fallback, replacing Firebase's `** -> /index.html` rewrite:
    # any path not present in the (private) origin bucket 404s, and that 404 is
    # rewritten to index.html served from the public index bucket.
    default_custom_error_response_policy {
      error_service = google_compute_backend_bucket.index.id

      error_response_rule {
        match_response_codes   = ["404"]
        path                   = "/index.html"
        override_response_code = 200
      }
    }
  }
}

# GovRAMP AC-17(2): without an SSL policy the HTTPS frontend uses GCP's default,
# which accepts TLS 1.0/1.1 handshakes.
resource "google_compute_ssl_policy" "restricted" {
  name            = "staff-frontend-ssl-policy-${var.environment}"
  profile         = "RESTRICTED"
  min_tls_version = "TLS_1_2"
}

resource "google_compute_global_address" "frontend" {
  name = "staff-frontend-ip-${var.environment}"
}

resource "google_compute_target_https_proxy" "frontend" {
  name       = "staff-frontend-https-${var.environment}"
  url_map    = google_compute_url_map.frontend.id
  ssl_policy = google_compute_ssl_policy.restricted.id

  # Exactly one of these is set: the classic cert before the Certificate
  # Manager migration, the certificate map after.
  certificate_map = "//certificatemanager.googleapis.com/${google_certificate_manager_certificate_map.frontend.id}"
}

resource "google_compute_global_forwarding_rule" "https" {
  name                  = "staff-frontend-https-${var.environment}"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  target                = google_compute_target_https_proxy.frontend.id
  ip_address            = google_compute_global_address.frontend.address
  port_range            = "443"
}

# Firebase parity: redirect HTTP to HTTPS.
resource "google_compute_url_map" "https_redirect" {
  name = "staff-frontend-redirect-${var.environment}"

  default_url_redirect {
    https_redirect = true
    strip_query    = false
  }
}

resource "google_compute_target_http_proxy" "redirect" {
  name    = "staff-frontend-http-${var.environment}"
  url_map = google_compute_url_map.https_redirect.id
}

resource "google_compute_global_forwarding_rule" "http" {
  name                  = "staff-frontend-http-${var.environment}"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  target                = google_compute_target_http_proxy.redirect.id
  ip_address            = google_compute_global_address.frontend.address
  port_range            = "80"
}
