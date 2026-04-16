data "sops_file" "shared_env" {
  source_file = "./secrets/env.shared.enc.yaml"
}

data "sops_file" "env" {
  source_file = "./secrets/env.${var.environment}.enc.yaml"
}


locals {
  shared_env  = yamldecode(data.sops_file.shared_env.raw)
  env_secrets = yamldecode(data.sops_file.env.raw)

  server_image     = "${var.artifact_registry_repo}/sentencing-server:${var.server_container_version}"
  migrate_db_image = "${var.artifact_registry_repo}/sentencing-server:${var.migrate_db_container_version}"
  import_job_image = "${var.artifact_registry_repo}/sentencing-data-import:${var.import_container_version}"
  import_job_name  = "sentencing-data-import"

  etl_bucket_name     = "sentencing-etl-data"
  archive_bucket_name = "${local.etl_bucket_name}-archive"

  # This list needs to be marked as nonsensitive so it can be used in `for_each`
  # the keys are not sensitive, so it is fine if they end up in the Terraform resource names
  env_vars = nonsensitive([
    for key, value in merge(local.shared_env, local.env_secrets) : {
      # The values are sensitive so we want to omit them from the plans
      value = sensitive(value)
      name  = key
    }
  ])
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
  tier                                          = "db-custom-1-3840"
  additional_databases                          = ["us_id", "us_nd", "us_mo"]
  private_network                               = var.private_network
  enable_private_path_for_google_cloud_services = var.private_network != null ? true : false

  insights_config = {
    query_insights_enabled : true
    query_string_length : 1024
    record_application_tags : false
    record_client_address : false
  }
}

module "server" {
  source = "../../vendor/cloud-run"

  project_id      = var.project_id
  location        = var.location
  service_name    = var.server_name
  service_account = google_service_account.default.email

  containers = [
    {
      container_image = local.server_image

      env_vars = concat([
        { name = "SENTRY_DSN", value = "https://4dfb7cc349417f57a791991bfd3173f5@o432474.ingest.us.sentry.io/4507227545010176" },
        { name = "SENTRY_PROJECT", value = "sentencing-server" },
      ], local.env_vars)

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

  members = ["allUsers"] # allow unauthenticated access: https://cloud.google.com/run/docs/authenticating/public
}

# Configure a job that will migrate the database schema
module "migrate_db_job" {
  source                        = "../../vendor/cloud-run-job-exec"
  exec                          = true
  name                          = var.migrate_db_name
  image                         = local.migrate_db_image
  project_id                    = var.project_id
  location                      = var.location
  env_vars                      = local.env_vars
  cloud_run_deletion_protection = false
  service_account_email         = google_service_account.default.email
  container_command             = ["./scripts/migrate-dbs.sh"]
  max_retries                   = 1

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

# Configure a job that will import data
# We don't execute it on deploy - it will be run when the workflow is triggered
module "import_job" {
  source = "../../vendor/cloud-run-job-exec"

  # Don't create an import job for demo
  count = var.demo_mode ? 0 : 1

  name       = local.import_job_name
  image      = local.import_job_image
  project_id = var.project_id
  location   = var.location
  env_vars = concat([
    { name = "SENTRY_DSN", value = "https://324bfceba46756ff2b971747e423abc6@o432474.ingest.us.sentry.io/4508914785714176" },
    { name = "SENTRY_PROJECT", value = "sentencing-data-import" },
  ], local.env_vars)
  cloud_run_deletion_protection = false
  service_account_email         = google_service_account.default.email
  exec                          = false
  timeout                       = "3600s"
  max_retries                   = 1

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


module "gcs_bucket" {
  source = "../../vendor/submodules/cloud-storage-bucket"

  # Don't create a bucket for demo
  count = var.demo_mode ? 0 : 1

  project_id = var.project_id
  location   = var.location
  prefix     = var.project_id
  names      = [local.etl_bucket_name, local.archive_bucket_name]
  logging = {
    log_bucket = "${var.project_id}-gcs-object-logs"
  }
  versioning = {
    "sentencing-etl-data" = true
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
    (local.etl_bucket_name) = join(",", [
      "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com",
      "serviceAccount:${var.data_platform_project_number}-compute@developer.gserviceaccount.com"
    ])
  }

  set_viewer_roles = true
  bucket_viewers = {
    (local.archive_bucket_name) = join(",", [
      "serviceAccount:cloud-build-ci-cd@${var.data_platform_project_id}.iam.gserviceaccount.com",
      "serviceAccount:${var.data_platform_project_number}-compute@developer.gserviceaccount.com"
    ])
  }
}

# Configure a Google Workflow that is executed when a pubsub notification
module "handle_sentencing_gcs_upload" {
  source = "../../vendor/google-workflows-workflow"

  # Don't create a workflow for demo
  count = var.demo_mode ? 0 : 1

  project_id            = var.project_id
  region                = var.location
  service_account_email = google_service_account.default.email
  workflow_name         = "handle-sentencing-upload-wf"
  workflow_trigger = {
    event_arc = {
      name                  = "handle-sentencing-upload-wf"
      service_account_email = google_service_account.default.email
      pubsub_topic_id       = google_pubsub_topic.sentencing_export_success_topic[0].id
      matching_criteria = [
        {
          attribute = "type"
          value     = "google.cloud.pubsub.topic.v1.messagePublished"
        }
      ]
    }
  }
  workflow_source = file("${path.module}/workflows/handle-sentencing-gcs-upload.workflows.yaml")
  env_vars = {
    PROJECT_ID        = var.project_id
    JOB_NAME          = module.import_job[0].id
    ARCHIVE_BUCKET_ID = module.gcs_bucket[0].names[local.archive_bucket_name]
    ETL_BUCKET_ID     = module.gcs_bucket[0].names[local.etl_bucket_name]
  }
}
