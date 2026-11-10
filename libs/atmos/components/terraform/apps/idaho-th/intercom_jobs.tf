# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
#
# Identity, env, validation, and secret access shared by every Intercom Cloud Run
# Job: the scheduled digest (intercom_digest_scheduler.tf) and the manually
# executed provider contact sync (intercom_provider_sync_job.tf). Either flag
# alone is enough to need the token, so the shared pieces gate on both.

locals {
  enable_intercom_jobs = (
    var.enable_intercom_digest_scheduler || var.enable_intercom_provider_sync
  )

  intercom_job_plain_env_vars = local.enable_intercom_jobs ? nonsensitive([
    for key in var.intercom_plain_env_keys : {
      name  = key
      value = tostring(local.env_secrets[key])
    }
  ]) : []

  # DB connection (Prisma), APP_ENV (dashboard URL in the digest email), and
  # Sentry (both jobs preload it, see scripts/run-intercom-digest.sh).
  #
  # Not local.server_env_vars: Auth0, Document AI, Vertex, the GCS bucket
  # names, and the malware-scan webhook config have no reader anywhere in
  # libs/@idaho-th/trpc/src/intercom/ — server_env_vars would hand them to
  # this job identity for no reason.
  intercom_job_infra_plain_env_vars = local.enable_intercom_jobs ? [
    {
      name  = "DATABASE_INSTANCE_CONNECTION_NAME"
      value = module.database.connection_name
    },
  ] : []

  intercom_job_env_vars = local.enable_intercom_jobs ? concat(
    local.intercom_job_infra_plain_env_vars,
    local.server_sentry_env_vars,
    local.app_env_vars,
    local.intercom_job_plain_env_vars,
  ) : []

  # Deliberately excludes var.server_secret_env_keys (BACKEND_WEBHOOK_SECRET,
  # IDAHO_TH_GOOGLE_PLACES_API_KEY): these jobs talk to Postgres and Intercom and
  # nothing else, and every env read in their import graph is lazy, so referencing
  # credentials they never use would only widen what the job identity can read.
  intercom_job_env_secret_vars = local.enable_intercom_jobs ? concat(
    [
      for key in var.intercom_secret_env_keys : {
        name = key
        value_source = [{
          secret_key_ref = {
            secret  = key
            version = "latest"
          }
        }]
      }
    ],
    [
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
    ],
  ) : []

  intercom_job_plain_env_names = [
    for env in local.intercom_job_env_vars : env.name
  ]
  intercom_job_secret_env_names = [
    for env in local.intercom_job_env_secret_vars : env.name
  ]
  intercom_job_all_env_names = concat(
    local.intercom_job_plain_env_names,
    local.intercom_job_secret_env_names,
  )

  intercom_job_volumes = [{
    name = "cloudsql"
    cloud_sql_instance = {
      instances = [module.database.connection_name]
    }
  }]

  intercom_job_volume_mounts = [{
    name       = "cloudsql"
    mount_path = "/cloudsql"
  }]
}

resource "terraform_data" "validate_intercom_env_keys" {
  count = local.enable_intercom_jobs ? 1 : 0

  lifecycle {
    precondition {
      condition = alltrue([
        for key in concat(
          var.intercom_secret_env_keys,
          var.intercom_plain_env_keys,
        ) :
        contains(keys(local.env_secrets), key)
      ])
      error_message = "When an Intercom job is enabled, each intercom_*_env_keys entry must exist in ${var.secrets_filename}."
    }

    # Cloud Run rejects duplicate env names; catch overlaps across Intercom
    # secrets, SQL secrets, and plain env.
    precondition {
      condition = (
        length(distinct(local.intercom_job_all_env_names))
        == length(local.intercom_job_all_env_names)
      )
      error_message = "Intercom jobs have duplicate env var names across plain and secret lists (check overlap between intercom_job_infra_plain_env_vars, intercom_*_env_keys, and DATABASE_*)."
    }
  }
}

# Dedicated runtime identity for the Intercom jobs, matching seed_db/migrate_db.
# Emphatically NOT google_service_account.default: that is the identity of the
# public, internet-facing Cloud Run service, and the Intercom access token grants
# read/write over every contact and outbound email in the workspace. Sharing the
# two would put that credential one SSRF or RCE away from the most exposed
# surface in the system, for a token the server itself never reads.
resource "google_service_account" "intercom_jobs" {
  count = local.enable_intercom_jobs ? 1 : 0

  account_id   = var.intercom_jobs_service_account_id
  display_name = "Idaho Transitional Housing Intercom Jobs Service Account"
}

resource "google_project_iam_member" "intercom_jobs_logwriter" {
  count = local.enable_intercom_jobs ? 1 : 0

  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.intercom_jobs[0].email}"
}

resource "google_project_iam_member" "intercom_jobs_cloudsqlclient" {
  count = local.enable_intercom_jobs ? 1 : 0

  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.intercom_jobs[0].email}"
}

resource "google_project_iam_member" "intercom_jobs_artifactregistryreader" {
  count = local.enable_intercom_jobs ? 1 : 0

  project = var.artifact_registry_project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.intercom_jobs[0].email}"
}

# The seed job creates Intercom contacts for the providers it imports, so it
# reads the same secret as the jobs below — under its own service account.
resource "google_secret_manager_secret_iam_member" "seed_db_intercom_secret_accessor" {
  for_each = local.enable_intercom_jobs ? toset(var.intercom_secret_env_keys) : toset([])

  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.seed_db.email}"

  depends_on = [module.secrets]
}

resource "google_secret_manager_secret_iam_member" "intercom_secret_accessor" {
  for_each = local.enable_intercom_jobs ? toset(var.intercom_secret_env_keys) : toset([])

  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.intercom_jobs[0].email}"

  depends_on = [module.secrets]
}

# DATABASE_USER / DATABASE_PASSWORD, as the seed job gets them.
resource "google_secret_manager_secret_iam_member" "intercom_jobs_bootstrap_sql_secret_accessor" {
  for_each = local.enable_intercom_jobs ? local.backend_bootstrap_sql_secret_ids : toset([])

  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.intercom_jobs[0].email}"

  depends_on = [module.database]
}
