data "sops_file" "env" {
  source_file = var.secrets_filename
}

# Live Cloud Run service URI. Used for Eventarc webhook OIDC audience
# (`{uri}{callback_path}`). Read via data source so the value can be set on
# this same service's env vars without a Terraform cycle on module.server.
# Brand-new stacks: create the service first, then re-apply once this resolves.
data "google_cloud_run_v2_service" "server" {
  name     = var.server_name
  location = var.location
  project  = var.project_id
}

locals {
  env_secrets = yamldecode(data.sops_file.env.raw)

  server_image     = "${var.artifact_registry_repo}/idaho-th-server:${var.server_container_version}"
  migrate_db_image = "${var.artifact_registry_repo}/idaho-th-server:${var.migrate_db_container_version}"
  seed_db_image    = "${var.artifact_registry_repo}/idaho-th-seed-db:${var.seed_db_container_version}"
  frontend_image   = "${var.artifact_registry_repo}/idaho-th-client:${var.frontend_container_version}"

  # Keep in sync with IDAHO_TH_TRPC_PATH in libs/@idaho-th/shared.
  frontend_api_url = "/api/trpc"

  # enable_load_balancer provisions LB/frontend/WAF.
  # lock_server_ingress_to_lb independently restricts API Cloud Run to LB ingress.
  server_ingress_effective = (
    var.lock_server_ingress_to_lb
    ? "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"
    : var.server_ingress
  )

  database_name = "us_id"

  # Pre-existing GSM ids (not from apps/idaho-th SOPS).
  sql_db_user_secret_id     = "${var.sql_base_secret_name}_db_user"
  sql_db_password_secret_id = "${var.sql_base_secret_name}_db_password"
  migrate_db_url_secret_id  = "${var.sql_base_secret_name}_${local.database_name}_migrate_db_url"

  # Upload target: unscanned when malware_scan_enabled, otherwise clean/uploads.
  pdf_gcs_upload_bucket_name = (
    var.malware_scan_enabled
    ? local.pdf_gcs_unscanned_bucket_name
    : local.pdf_gcs_clean_bucket_name
  )

  # Defaults match apps/malware-scanning malware_services[] suffixes; stack YAML overrides from component outputs.
  pdf_gcs_unscanned_bucket_name   = coalesce(var.pdf_gcs_unscanned_bucket_name, "${var.project_id}-idaho-th-pdf-unscanned")
  pdf_gcs_clean_bucket_name       = coalesce(var.pdf_gcs_clean_bucket_name, "${var.project_id}-idaho-th-pdf-uploads")
  pdf_gcs_quarantined_bucket_name = coalesce(var.pdf_gcs_quarantined_bucket_name, "${var.project_id}-idaho-th-pdf-quarantined")
  scan_events_sa_email            = coalesce(var.scan_events_sa_email, "idaho-th-scan-events@${var.project_id}.iam.gserviceaccount.com")

  # nonsensitive: these are public/config keys; SOPS marks the whole file sensitive.
  server_sops_plain_env_vars = nonsensitive([
    for key in var.server_plain_env_keys : {
      name  = key
      value = tostring(local.env_secrets[key])
    }
  ])

  server_infra_plain_env_vars = [
    {
      name  = "DATABASE_INSTANCE_CONNECTION_NAME"
      value = module.database.connection_name
    },
    {
      name  = "IDAHO_TH_PDF_GCS_BUCKET"
      value = local.pdf_gcs_upload_bucket_name
    },
    {
      name  = "IDAHO_TH_PDF_GCS_CLEAN_BUCKET"
      value = local.pdf_gcs_clean_bucket_name
    },
    {
      name  = "IDAHO_TH_MALWARE_SCAN_ENABLED"
      value = var.malware_scan_enabled ? "true" : "false"
    },
    {
      name  = "IDAHO_TH_PDF_GCS_QUARANTINED_BUCKET"
      value = local.pdf_gcs_quarantined_bucket_name
    },
    {
      # Must equal Eventarc Pub/Sub pushConfig.oidcToken.audience
      # (`{service.uri}{callback_path}`).
      name  = "IDAHO_TH_SCAN_WEBHOOK_AUDIENCE_URL"
      value = "${data.google_cloud_run_v2_service.server.uri}${var.malware_scan_complete_callback_path}"
    },
    {
      name  = "IDAHO_TH_SCAN_WEBHOOK_INVOKER_EMAIL"
      value = local.scan_events_sa_email
    },
  ]

  # Omitted entirely (not set to empty strings) when sentry_dsn is unset, so
  # Sentry stays fully disabled rather than initializing with a blank DSN.
  server_sentry_env_vars = var.sentry_dsn == "" ? [] : [
    { name = "SENTRY_DSN", value = var.sentry_dsn },
    { name = "SENTRY_ENV", value = var.sentry_env },
  ]

  # Shared by server and frontend. Omitted entirely when unset, matching server_sentry_env_vars.
  app_env_vars = var.app_env == "" ? [] : [
    { name = "APP_ENV", value = var.app_env },
  ]

  server_env_vars = concat(
    local.server_sops_plain_env_vars,
    local.server_infra_plain_env_vars,
    local.server_sentry_env_vars,
    local.app_env_vars,
  )

  # vendor/cloud-run: map keyed by env var name → { secret, version }
  server_env_secret_vars = merge(
    {
      for key in var.server_secret_env_keys :
      key => {
        secret  = key
        version = "latest"
      }
    },
    {
      DATABASE_USER = {
        secret  = local.sql_db_user_secret_id
        version = "latest"
      }
      DATABASE_PASSWORD = {
        secret  = local.sql_db_password_secret_id
        version = "latest"
      }
    },
  )

  # vendor/cloud-run-job-exec: list with nested value_source / secret_key_ref
  migrate_db_env_secret_vars = [
    {
      name = "DATABASE_URL"
      value_source = [{
        secret_key_ref = {
          secret  = local.migrate_db_url_secret_id
          version = "latest"
        }
      }]
    },
  ]

  seed_db_env_vars = concat(
    [
      {
        name  = "DATABASE_INSTANCE_CONNECTION_NAME"
        value = module.database.connection_name
      },
      {
        name  = "IDAHO_TH_PDF_GCS_BUCKET"
        value = local.pdf_gcs_clean_bucket_name
      },
    ],
    nonsensitive([
      {
        name  = "IDAHO_TH_HOUSING_PROVIDERS_CSV_OBJECT"
        value = tostring(local.env_secrets["IDAHO_TH_HOUSING_PROVIDERS_CSV_OBJECT"])
      },
    ]),
  )

  # The seed job creates Intercom contacts for the providers it imports, so it
  # needs the token. Gated on enable_intercom_jobs because the key may not exist
  # in the stack's SOPS yet.
  seed_db_intercom_secret_vars = local.enable_intercom_jobs ? [
    for key in var.intercom_secret_env_keys : {
      name = key
      value_source = [{
        secret_key_ref = {
          secret  = key
          version = "latest"
        }
      }]
    }
  ] : []

  seed_db_env_secret_vars = concat(local.seed_db_intercom_secret_vars, [
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
  ])

  # Auth0 SPA values are public (shipped to the browser); nonsensitive unwraps SOPS.
  frontend_env_vars = var.enable_load_balancer ? concat(
    nonsensitive([
      for key in var.frontend_env_keys : {
        name  = key
        value = tostring(local.env_secrets[key])
      }
    ]),
    [
      {
        name  = "API_URL"
        value = local.frontend_api_url
      }
    ],
    local.app_env_vars,
  ) : []

  backend_bootstrap_sql_secret_ids = toset([
    local.sql_db_user_secret_id,
    local.sql_db_password_secret_id,
  ])
}

resource "terraform_data" "validate_server_env_keys" {
  lifecycle {
    precondition {
      condition = alltrue([
        for key in concat(var.server_plain_env_keys, var.server_secret_env_keys) :
        contains(keys(local.env_secrets), key)
      ])
      error_message = "Each entry in server_plain_env_keys and server_secret_env_keys must exist in ${var.secrets_filename}."
    }
  }
}

resource "terraform_data" "validate_seed_env_keys" {
  lifecycle {
    precondition {
      condition     = contains(keys(local.env_secrets), "IDAHO_TH_HOUSING_PROVIDERS_CSV_OBJECT")
      error_message = "IDAHO_TH_HOUSING_PROVIDERS_CSV_OBJECT must exist in ${var.secrets_filename}."
    }
  }
}

module "secrets" {
  source    = "../../secrets"
  location  = var.location
  sops_file = var.secrets_filename
}

# App secrets readable by the server service account only. Public SOPS-backed
# config remains plain env and is not granted at runtime.
resource "google_secret_manager_secret_iam_member" "backend_app_secret_accessor" {
  for_each = toset(var.server_secret_env_keys)

  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.default.email}"

  depends_on = [module.secrets]
}

# Cloud SQL bootstrap secrets are pre-existing and outside module.secrets.
resource "google_secret_manager_secret_iam_member" "backend_bootstrap_sql_secret_accessor" {
  for_each = local.backend_bootstrap_sql_secret_ids

  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.default.email}"

  depends_on = [module.database]
}

# Seed job access to DATABASE_USER / DATABASE_PASSWORD.
resource "google_secret_manager_secret_iam_member" "seed_bootstrap_sql_secret_accessor" {
  for_each = local.backend_bootstrap_sql_secret_ids

  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.seed_db.email}"

  depends_on = [module.database]
}

# Keep the migration connection string behind a GSM reference. This is
# app-specific because the generic cloud-sql module's derived URL does not URL
# encode credentials, while Prisma requires a valid URL for arbitrary passwords.
resource "google_secret_manager_secret" "migrate_database_url" {
  secret_id = local.migrate_db_url_secret_id

  replication {
    user_managed {
      replicas {
        location = var.location
      }
    }
  }
}

resource "google_secret_manager_secret_version" "migrate_database_url" {
  secret = google_secret_manager_secret.migrate_database_url.id
  secret_data = "postgresql://${urlencode(module.database.database_user_name)}:${urlencode(module.database.database_user_password)}@localhost/${local.database_name}?host=${urlencode(
    "/cloudsql/${module.database.connection_name}"
  )}&schema=public"

  lifecycle {
    create_before_destroy = true
  }
}

# Migrate job service account access to the URL-encoded DATABASE_URL secret.
resource "google_secret_manager_secret_iam_member" "backend_migrate_database_url_accessor" {
  secret_id = google_secret_manager_secret.migrate_database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.migrate_db.email}"
}

resource "google_kms_key_handle" "cloud_sql" {
  provider = google-beta

  project                = var.project_id
  name                   = "${var.project_id}-${var.sql_instance_name}"
  location               = var.location
  resource_type_selector = "sqladmin.googleapis.com/Instance"
}

module "database" {
  source = "../../vendor/cloud-sql-instance"

  project_id                                    = var.project_id
  create_bigquery_connection                    = false
  instance_key                                  = var.sql_instance_name
  base_secret_name                              = var.sql_base_secret_name
  database_version                              = "POSTGRES_16"
  has_readonly_user                             = false
  availability_type                             = var.database_availability_type
  region                                        = "us-central1"
  zone                                          = "us-central1-f"
  secondary_zone                                = var.database_secondary_zone
  tier                                          = var.database_tier
  encryption_key_id                             = google_kms_key_handle.cloud_sql.kms_key
  additional_databases                          = [local.database_name]
  private_network                               = local.private_network_ref
  enable_private_path_for_google_cloud_services = local.private_network_ref != null
  ipv4_enabled                                  = var.ipv4_enabled

  insights_config = {
    query_insights_enabled : true
    query_string_length : 1024
    record_application_tags : false
    record_client_address : false
  }
}

module "server" {
  source = "../../vendor/cloud-run"

  # Orders the migrate job's *start* before this revision, not its completion:
  # the vendored exec POSTs to Cloud Run `jobs:run` and returns once the
  # execution is created, without polling the operation. So a new revision can
  # begin serving while migrate-dbs.sh is still running, and requests touching
  # the columns it adds fail for that window. Tolerable because the migrations
  # this gates are additive — an overlap degrades reads briefly rather than
  # corrupting anything, and resolves without intervention. Waiting on
  # completion means teaching vendor/cloud-run-job-exec to poll, which also
  # changes seed_db_job.
  depends_on = [
    module.migrate_db_job,
    terraform_data.validate_server_env_keys,
    google_secret_manager_secret_iam_member.backend_app_secret_accessor,
    google_secret_manager_secret_iam_member.backend_bootstrap_sql_secret_accessor,
  ]

  project_id                    = var.project_id
  location                      = var.location
  service_name                  = var.server_name
  service_account               = google_service_account.default.email
  cloud_run_deletion_protection = false
  ingress                       = local.server_ingress_effective
  max_instance_request_concurrency = (
    var.server_max_instance_request_concurrency != null
    ? tostring(var.server_max_instance_request_concurrency)
    : null
  )
  service_scaling = {
    min_instance_count = var.server_min_instance_count
  }
  template_scaling = {
    min_instance_count = var.server_min_instance_count
    max_instance_count = var.server_max_instance_count
  }

  vpc_access = local.direct_db_egress_vpc_access

  containers = [
    {
      container_image = local.server_image
      env_vars        = local.server_env_vars
      env_secret_vars = local.server_env_secret_vars
      resources = {
        limits = {
          cpu    = var.server_cpu
          memory = var.server_memory
        }
      }

      # Gates traffic until the container is actually ready; matches the same
      # pattern already used by apps/idaho-th-admin. No liveness_probe: an
      # ongoing runtime check that restarts the container is a bigger step
      # than this app needs right now.
      startup_probe = {
        initial_delay_seconds = 0
        period_seconds        = 10
        timeout_seconds       = 5
        failure_threshold     = 24

        http_get = {
          path = local.health_check_path
        }
      }

      volume_mounts = [{
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }]
    }
  ]

  volumes = [{
    name = "cloudsql"
    cloud_sql_instance = {
      instances = [module.database.connection_name]
    }
  }]

  members = var.server_invoker_members
}

module "migrate_db_job" {
  source = "../../vendor/cloud-run-job-exec"

  depends_on = [
    module.database,
    google_secret_manager_secret_iam_member.backend_migrate_database_url_accessor,
    google_secret_manager_secret_version.migrate_database_url,
    google_project_iam_member.migrate_db_cloudsqlclient,
    google_project_iam_member.migrate_db_artifactregistryreader,
  ]

  exec                          = true
  name                          = var.migrate_db_name
  image                         = local.migrate_db_image
  project_id                    = var.project_id
  location                      = var.location
  env_vars                      = []
  env_secret_vars               = local.migrate_db_env_secret_vars
  cloud_run_deletion_protection = false
  service_account_email         = google_service_account.migrate_db.email
  container_command             = ["sh", "./scripts/migrate-dbs.sh"]
  max_retries                   = 1

  vpc_access = local.direct_db_egress_vpc_access_list

  volumes = [{
    name = "cloudsql"
    cloud_sql_instance = {
      instances = [module.database.connection_name]
    }
  }]

  volume_mounts = [{
    name       = "cloudsql"
    mount_path = "/cloudsql"
  }]
}

module "seed_db_job" {
  source = "../../vendor/cloud-run-job-exec"

  depends_on = [
    module.database,
    terraform_data.validate_seed_env_keys,
    google_secret_manager_secret_iam_member.seed_bootstrap_sql_secret_accessor,
    google_secret_manager_secret_iam_member.seed_db_intercom_secret_accessor,
    google_project_iam_member.seed_db_cloudsqlclient,
    google_project_iam_member.seed_db_artifactregistryreader,
  ]

  # Create the one-time seed job, but do not run it during Terraform apply.
  exec                          = false
  name                          = var.seed_db_name
  image                         = local.seed_db_image
  project_id                    = var.project_id
  location                      = var.location
  env_vars                      = local.seed_db_env_vars
  env_secret_vars               = local.seed_db_env_secret_vars
  cloud_run_deletion_protection = false
  service_account_email         = google_service_account.seed_db.email
  max_retries                   = 1

  vpc_access = local.direct_db_egress_vpc_access_list

  volumes = [{
    name = "cloudsql"
    cloud_sql_instance = {
      instances = [module.database.connection_name]
    }
  }]

  volume_mounts = [{
    name       = "cloudsql"
    mount_path = "/cloudsql"
  }]
}
