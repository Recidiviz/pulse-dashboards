# A Cloud KMS Autokey key, dataset-scoped, backing CMEK for this admin
# panel's own BigQuery query jobs. Required by this project's CMEK org
# policy (constraints/gcp.restrictNonCmekServices). See README.md's
# Architecture section for the full rationale and links.
#
# Autokey's BigQuery support is dataset-scoped only (no bare "key for
# arbitrary use" resource type), so this dataset exists purely to give
# Autokey something to provision and IAM-wire a key against --
# recidiviz-data's run_query_async references that key directly via
# destination_encryption_configuration on each query job, with no
# destination table set, so nothing is ever actually written into this
# dataset. That also keeps BigQuery's query result cache working, since
# (unlike this) setting an explicit destination table disables it.

locals {
  # Cloud KMS's multi-region location names differ from BigQuery's:
  # BigQuery's "US" multi-region corresponds to Cloud KMS's "us".
  query_jobs_kms_location = "us"
}

resource "google_kms_key_handle" "query_jobs" {
  provider = google-beta

  project                = var.project_id
  name                   = "${var.project_id}-query-jobs"
  location               = local.query_jobs_kms_location
  resource_type_selector = "bigquery.googleapis.com/Dataset"
}

resource "google_bigquery_dataset" "query_jobs_kms_anchor" {
  project    = var.project_id
  dataset_id = "idaho_th_admin_query_jobs_kms_anchor"
  location   = "US"

  # Never written into -- see the file header. Kept empty and expiring so
  # nothing accumulates if something ever does write to it unexpectedly.
  default_table_expiration_ms = 86400000 # 1 day
  delete_contents_on_destroy  = true

  default_encryption_configuration {
    kms_key_name = google_kms_key_handle.query_jobs.kms_key
  }
}
