# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
#
# Cloud Run Job + Cloud Scheduler for weekday 10 AM MT Intercom digest emails.
# Gated by enable_intercom_digest_scheduler (default false) so stacks can adopt
# after INTERCOM_TOKEN and INTERCOM_ADMIN_ID exist in SOPS. The dashboard URL in
# the emails comes from APP_ENV, which this component already sets on the job.
#
# Shared env / validation / secret access lives in intercom_jobs.tf.

module "intercom_digest_job" {
  count  = var.enable_intercom_digest_scheduler ? 1 : 0
  source = "../../vendor/cloud-run-job-exec"

  depends_on = [
    module.database,
    terraform_data.validate_intercom_env_keys,
    google_secret_manager_secret_iam_member.intercom_secret_accessor,
    google_secret_manager_secret_iam_member.intercom_jobs_bootstrap_sql_secret_accessor,
    google_project_iam_member.intercom_jobs_cloudsqlclient,
    google_project_iam_member.intercom_jobs_artifactregistryreader,
  ]

  exec                          = false
  name                          = var.intercom_digest_job_name
  image                         = local.server_image
  project_id                    = var.project_id
  location                      = var.location
  env_vars                      = local.intercom_job_env_vars
  env_secret_vars               = local.intercom_job_env_secret_vars
  cloud_run_deletion_protection = false
  service_account_email         = google_service_account.intercom_jobs[0].email
  container_command             = ["sh", "./scripts/run-intercom-digest.sh"]
  # A send that timed out may still have been delivered, so a rerun can email
  # that recipient twice; the next weekday's run picks up anyone left unsent.
  max_retries = 0
  # Digests are keyset-paged Messages API sends — far lighter than multi-hour
  # cleanup jobs. Cap hang time so a stuck run cannot occupy the slot all day.
  timeout = "900s"

  vpc_access = local.direct_db_egress_vpc_access_list

  volumes       = local.intercom_job_volumes
  volume_mounts = local.intercom_job_volume_mounts
}

# Invoke rights scoped to this one job, not a broad grant on another identity:
# an override-capable, project-wide role lets the holder run ANY job in the
# project with an arbitrary command, far more than a scheduler needs.
resource "google_cloud_run_v2_job_iam_member" "intercom_digest_job_invoker" {
  count = var.enable_intercom_digest_scheduler ? 1 : 0

  project  = var.project_id
  location = var.location
  name     = var.intercom_digest_job_name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.intercom_jobs[0].email}"

  depends_on = [module.intercom_digest_job]
}

resource "google_cloud_scheduler_job" "intercom_digest_schedule" {
  count = var.enable_intercom_digest_scheduler ? 1 : 0

  depends_on = [google_cloud_run_v2_job_iam_member.intercom_digest_job_invoker]

  name        = "${var.intercom_digest_job_name}-schedule"
  description = "Weekday 10 AM Mountain Time Intercom housing digest"
  schedule    = var.intercom_digest_schedule
  time_zone   = var.intercom_digest_time_zone
  project     = var.project_id
  region      = var.location

  http_target {
    http_method = "POST"
    uri         = "https://run.googleapis.com/v2/${module.intercom_digest_job[0].id}:run"

    oauth_token {
      service_account_email = google_service_account.intercom_jobs[0].email
    }
  }

  # Once-a-day job: retry transient HTTP/IAM failures so a blip does not drop
  # the whole Mountain weekday send.
  retry_config {
    retry_count          = 3
    min_backoff_duration = "30s"
    max_backoff_duration = "300s"
  }
}
