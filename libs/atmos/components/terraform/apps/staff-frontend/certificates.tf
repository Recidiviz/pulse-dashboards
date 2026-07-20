# Certificate Manager certificates with DNS authorization.
#
# Unlike the classic managed certificate (load_balancer.tf), these validate via
# a per-domain CNAME record instead of requiring the domain's A record to point
# at this load balancer — so certificates for the real dashboard domains can
# reach ACTIVE while those domains still point at Firebase Hosting. That makes
# the eventual DNS cutover zero-downtime (see ROLLOUT.md Phase 3).

resource "google_project_service" "certificatemanager" {
  project            = var.project_id
  service            = "certificatemanager.googleapis.com"
  disable_on_destroy = false
}

resource "google_certificate_manager_dns_authorization" "frontend" {
  for_each = toset(var.domain_names)

  name   = "staff-frontend-${replace(each.value, ".", "-")}"
  domain = each.value

  depends_on = [google_project_service.certificatemanager]
}

# One certificate per domain (not one multi-domain cert) so adding a domain at
# cutover time provisions independently instead of re-validating the whole set.
resource "google_certificate_manager_certificate" "frontend" {
  for_each = toset(var.domain_names)

  name = "staff-frontend-${replace(each.value, ".", "-")}"

  managed {
    domains            = [each.value]
    dns_authorizations = [google_certificate_manager_dns_authorization.frontend[each.value].id]
  }
}

resource "google_certificate_manager_certificate_map" "frontend" {
  name = "staff-frontend-${var.environment}"

  depends_on = [google_project_service.certificatemanager]
}

resource "google_certificate_manager_certificate_map_entry" "frontend" {
  for_each = toset(var.domain_names)

  name         = "staff-frontend-${replace(each.value, ".", "-")}"
  map          = google_certificate_manager_certificate_map.frontend.name
  hostname     = each.value
  certificates = [google_certificate_manager_certificate.frontend[each.value].id]
}
