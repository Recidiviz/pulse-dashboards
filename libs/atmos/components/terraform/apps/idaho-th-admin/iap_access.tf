# Members come from this component's own SOPS values file, not a local var.
# Deliberately not apps/idaho-th's secrets file: that file's every key is
# mirrored into its own GSM secret, which only supports scalar values.

data "sops_file" "values" {
  source_file = var.values_filename
}

locals {
  iap_access_values = yamldecode(data.sops_file.values.raw)

  # sops_file marks its whole decoded output sensitive; these are IAM group/
  # user emails, not secrets, so declassify them to keep for_each keyed by
  # member instead of falling back to count's index-based churn.
  #
  # No try()/default here on purpose: a missing or misspelled key must error
  # at plan time, not silently resolve every stack's access list to empty.
  iap_access_groups = nonsensitive(local.iap_access_values["iap_access_groups"])
  iap_access_users  = nonsensitive(local.iap_access_values["iap_access_users"])

  iap_access_members = concat(
    [for group in local.iap_access_groups : "group:${group}"],
    [for user in local.iap_access_users : "user:${user}"],
  )
}

data "google_compute_backend_service" "iap_backend" {
  project = var.project_id
  name    = module.lb_http.backend_services["default"].name

  depends_on = [module.lb_http]
}

resource "google_iap_web_backend_service_iam_member" "iap_access" {
  for_each = var.iap_enabled ? toset(local.iap_access_members) : toset([])

  project             = var.project_id
  web_backend_service = data.google_compute_backend_service.iap_backend.name
  role                = "roles/iap.httpsResourceAccessor"
  member              = each.value
}
