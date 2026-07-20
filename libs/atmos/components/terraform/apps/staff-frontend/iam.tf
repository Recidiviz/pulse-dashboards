# Deploys invalidate the CDN cache after uploading; the smallest predefined
# role carrying compute.urlMaps.invalidateCache is loadBalancerAdmin, so use a
# custom role instead.
resource "google_project_iam_custom_role" "cdn_invalidator" {
  role_id     = "staffFrontendCdnInvalidator"
  title       = "Staff Frontend CDN Invalidator"
  description = "Invalidate the staff frontend CDN cache after a deploy"
  permissions = [
    "compute.urlMaps.get",
    "compute.urlMaps.invalidateCache",
  ]
}

resource "google_project_iam_member" "cdn_invalidators" {
  for_each = toset(var.deployer_members)

  project = var.project_id
  role    = google_project_iam_custom_role.cdn_invalidator.id
  member  = each.value
}
