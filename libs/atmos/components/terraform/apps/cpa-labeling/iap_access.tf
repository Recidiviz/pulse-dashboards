# IAP Access Control
# Grants IAP access to specific Google Groups and users from SOPS secrets

locals {
  # Read IAP access lists from secrets
  iap_access_groups = try(local.values["iap_access_groups"], [])
  iap_access_users  = try(local.values["iap_access_users"], [])

  # Combine groups and users into a single list with proper member format
  iap_group_members = [for group in local.iap_access_groups : "group:${group}"]
  iap_user_members  = [for user in local.iap_access_users : "user:${user}"]
  all_iap_members   = concat(local.iap_group_members, local.iap_user_members)
}

# Get the backend service created by the load balancer module
data "google_compute_backend_service" "iap_backend" {
  project = var.project_id
  name    = module.lb_http.backend_services["default"].name

  depends_on = [module.lb_http]
}

# Grant IAP access to specified groups and users
resource "google_iap_web_backend_service_iam_member" "iap_access" {
  count = length(local.all_iap_members)

  project             = var.project_id
  web_backend_service = data.google_compute_backend_service.iap_backend.name
  role                = "roles/iap.httpsResourceAccessor"
  member              = local.all_iap_members[count.index]
}
