locals {
  is_production = var.project_id == "recidiviz-dashboard-production"

  etl_bucket_name     = "reentry-etl-data"
  archive_bucket_name = "${local.etl_bucket_name}-archive"
}


module "gcs_bucket" {
  source = "../../vendor/submodules/cloud-storage-bucket"

  # Don't create a bucket for demo
  count = var.configure_import ? 1 : 0

  project_id = var.project_id
  location   = var.location
  prefix     = var.project_id
  names      = [local.etl_bucket_name, local.archive_bucket_name]
  logging = {
    log_bucket = "${var.project_id}-gcs-object-logs"
  }
  versioning = {
    "reentry-etl-data" = true
  }
  storage_class = "STANDARD"
  lifecycle_rules = [{
    action = {
      type = "Delete"
    }
    condition = {
      num_newer_versions = 3
    }
  }]
  set_admin_roles = true
  bucket_admins = {
    (local.etl_bucket_name) = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com,serviceAccount:${var.data_platform_project_number}-compute@developer.gserviceaccount.com"
  }

  set_viewer_roles = true
  bucket_viewers = {
    (local.archive_bucket_name) = "serviceAccount:cloud-build-ci-cd@${var.data_platform_project_id}.iam.gserviceaccount.com"
  }
}
