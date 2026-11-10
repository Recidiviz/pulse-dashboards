# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
#
# Cloud Run Job that creates Intercom contacts for providers already in the
# database. Deliberately has no Cloud Scheduler: it is executed by hand, like
# the seed job, so a stack can create contacts without also starting the daily
# digest sends.
#
#   gcloud run jobs execute <intercom_provider_sync_job_name> \
#     --region <location> --project <project_id>
#
# Safe to re-run — the job syncs with force: false, so providers that already
# have a contact are neither read nor sent to Intercom.
#
# Shared env / validation / secret access lives in intercom_jobs.tf.

module "intercom_provider_sync_job" {
  count  = var.enable_intercom_provider_sync ? 1 : 0
  source = "../../vendor/cloud-run-job-exec"

  depends_on = [
    module.database,
    terraform_data.validate_intercom_env_keys,
    google_secret_manager_secret_iam_member.intercom_secret_accessor,
    google_secret_manager_secret_iam_member.intercom_jobs_bootstrap_sql_secret_accessor,
    google_project_iam_member.intercom_jobs_cloudsqlclient,
    google_project_iam_member.intercom_jobs_artifactregistryreader,
  ]

  # Created but never run by Terraform, matching seed_db_job.
  exec                          = false
  name                          = var.intercom_provider_sync_job_name
  image                         = local.server_image
  project_id                    = var.project_id
  location                      = var.location
  env_vars                      = local.intercom_job_env_vars
  env_secret_vars               = local.intercom_job_env_secret_vars
  cloud_run_deletion_protection = false
  service_account_email         = google_service_account.intercom_jobs[0].email
  container_command             = ["sh", "./scripts/run-intercom-provider-sync.sh"]
  # No retry: a rerun of a partial sync is the operator's call, and the job is
  # idempotent, so an automatic retry buys nothing over executing it again.
  max_retries = 0
  # A first run walks every eligible provider, so allow more headroom than the
  # digest's 900s.
  timeout = "1800s"

  vpc_access = local.direct_db_egress_vpc_access_list

  volumes       = local.intercom_job_volumes
  volume_mounts = local.intercom_job_volume_mounts
}
