# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
#
# Cloud Run Job + 6-hourly Cloud Scheduler for stale DRAFT Vertex-intake shells
# and PENDING attachment rows that missed their normal cleanup path.
#
# GCS delete access on the clean bucket is granted separately by
# apps/malware-scanning's app_storage_delete_members[idaho-th] (same grant
# idaho-th-admin has) — this service account's email must be added to that
# list in the stack. Apply apps/idaho-th before apps/malware-scanning so the
# service account exists for that grant.

locals {
  document_janitor_env_vars = var.enable_document_janitor_scheduler ? concat(
    [
      {
        name  = "DATABASE_INSTANCE_CONNECTION_NAME"
        value = module.database.connection_name
      },
      {
        name  = "GOOGLE_PROJECT_ID"
        value = var.project_id
      },
      {
        name  = "IDAHO_TH_PDF_GCS_BUCKET"
        value = local.pdf_gcs_upload_bucket_name
      },
      {
        name  = "IDAHO_TH_PDF_GCS_CLEAN_BUCKET"
        value = local.pdf_gcs_clean_bucket_name
      },
    ],
    local.server_sentry_env_vars,
  ) : []

  document_janitor_env_secret_vars = var.enable_document_janitor_scheduler ? [
    {
      name = "DATABASE_USER"
      value_source = [{
        secret_key_ref = {
          secret  = local.sql_db_user_secret_id
          version = "latest"
        }
      }]
    },
    {
      name = "DATABASE_PASSWORD"
      value_source = [{
        secret_key_ref = {
          secret  = local.sql_db_password_secret_id
          version = "latest"
        }
      }]
    },
  ] : []

  document_janitor_volumes = [{
    name = "cloudsql"
    cloud_sql_instance = {
      instances = [module.database.connection_name]
    }
  }]

  document_janitor_volume_mounts = [{
    name       = "cloudsql"
    mount_path = "/cloudsql"
  }]
}

# Dedicated runtime identity: distinct from intercom_jobs (no Intercom access)
# and from the main server identity (only clean-bucket delete, not the
# server's broader GCS read/write, Auth0, and webhook surface).
resource "google_service_account" "document_janitor" {
  count = var.enable_document_janitor_scheduler ? 1 : 0

  account_id   = var.document_janitor_service_account_id
  display_name = "Idaho Transitional Housing Document Janitor Service Account"
}

resource "google_project_iam_member" "document_janitor_logwriter" {
  count = var.enable_document_janitor_scheduler ? 1 : 0

  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.document_janitor[0].email}"
}

resource "google_project_iam_member" "document_janitor_cloudsqlclient" {
  count = var.enable_document_janitor_scheduler ? 1 : 0

  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.document_janitor[0].email}"
}

resource "google_project_iam_member" "document_janitor_artifactregistryreader" {
  count = var.enable_document_janitor_scheduler ? 1 : 0

  project = var.artifact_registry_project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.document_janitor[0].email}"
}

resource "google_secret_manager_secret_iam_member" "document_janitor_bootstrap_sql_secret_accessor" {
  for_each = var.enable_document_janitor_scheduler ? local.backend_bootstrap_sql_secret_ids : toset([])

  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.document_janitor[0].email}"

  depends_on = [module.database]
}

module "document_janitor_job" {
  count  = var.enable_document_janitor_scheduler ? 1 : 0
  source = "../../vendor/cloud-run-job-exec"

  depends_on = [
    module.database,
    google_secret_manager_secret_iam_member.document_janitor_bootstrap_sql_secret_accessor,
    google_project_iam_member.document_janitor_cloudsqlclient,
    google_project_iam_member.document_janitor_artifactregistryreader,
  ]

  exec                          = false
  name                          = var.document_janitor_job_name
  image                         = local.server_image
  project_id                    = var.project_id
  location                      = var.location
  env_vars                      = local.document_janitor_env_vars
  env_secret_vars               = local.document_janitor_env_secret_vars
  cloud_run_deletion_protection = false
  service_account_email         = google_service_account.document_janitor[0].email
  container_command             = ["sh", "./scripts/run-document-janitor.sh"]

  # One retry covers transient DB/GCS failures. The sweep is bounded and
  # re-selects rows each run, so any remaining stale rows are retried later.
  max_retries = 1
  timeout     = "300s"

  vpc_access = local.direct_db_egress_vpc_access_list

  volumes       = local.document_janitor_volumes
  volume_mounts = local.document_janitor_volume_mounts
}

# Invoke rights scoped to this one job, not a broad grant on another identity.
resource "google_cloud_run_v2_job_iam_member" "document_janitor_job_invoker" {
  count = var.enable_document_janitor_scheduler ? 1 : 0

  project  = var.project_id
  location = var.location
  name     = var.document_janitor_job_name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.document_janitor[0].email}"

  depends_on = [module.document_janitor_job]
}

resource "google_cloud_scheduler_job" "document_janitor_schedule" {
  count = var.enable_document_janitor_scheduler ? 1 : 0

  depends_on = [google_cloud_run_v2_job_iam_member.document_janitor_job_invoker]

  name        = "${var.document_janitor_job_name}-schedule"
  description = "Sweep of orphaned DRAFT intake shells and PENDING documents every 6 hours"
  schedule    = var.document_janitor_schedule
  time_zone   = "UTC"
  project     = var.project_id
  region      = var.location

  http_target {
    http_method = "POST"
    uri         = "https://run.googleapis.com/v2/${module.document_janitor_job[0].id}:run"

    oauth_token {
      service_account_email = google_service_account.document_janitor[0].email
    }
  }

  # Retry transient HTTP/IAM failures so a blip does not skip a whole cycle.
  retry_config {
    retry_count          = 3
    min_backoff_duration = "30s"
    max_backoff_duration = "300s"
  }
}
