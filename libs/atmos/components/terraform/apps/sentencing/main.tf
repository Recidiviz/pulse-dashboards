data "sops_file" "env" {
  source_file = "../../env-secrets/secrets/sentencing_server.enc.yaml"
}

locals {
  is_production = var.project_id == "recidiviz-dashboard-production"
  env_secrets   = yamldecode(data.sops_file.env.raw)

  shared_server_env = local.env_secrets["env_sentencing_server"]
  server_env        = local.env_secrets[var.server_env_key]

  migrate_db_env = local.env_secrets[var.migrate_db_env_key]

  shared_data_import_env = local.env_secrets["env_sentencing_data_import"]
  data_import_env        = var.configure_import ? local.env_secrets[var.data_import_env_key] : {}

  registry_repo_name = "sentencing"

  server_image_name = "sentencing-server"

  migrate_db_image_name = "sentencing-server"

  import_image_name = "sentencing-data-import"
  import_job_name   = "sentencing-data-import"

  etl_bucket_name     = "sentencing-etl-data"
  archive_bucket_name = "${local.etl_bucket_name}-archive"

  # This list needs to be marked as nonsensitive so it can be used in `for_each`
  # the keys are not sensitive, so it is fine if they end up in the Terraform resource names
  server_env_vars = nonsensitive([
    for key, value in merge(local.shared_server_env, local.server_env) : {
      # The values are sensitive so we want to omit them from the plans
      value = sensitive(value)
      name  = key
    }
  ])

  # This list needs to be marked as nonsensitive so it can be used in `for_each`
  # the keys are not sensitive, so it is fine if they end up in the Terraform resource names
  migrate_db_env_vars = nonsensitive([
    for key, value in local.migrate_db_env : {
      # The values are sensitive so we want to omit them from the plans
      value = sensitive(value)
      name  = key
    }
  ])


  # This list needs to be marked as nonsensitive so it can be used in `for_each`
  # the keys are not sensitive, so it is fine if they end up in the Terraform resource names
  data_import_env_vars = nonsensitive([
    for key, value in merge(local.shared_data_import_env, local.data_import_env) : {
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
  additional_databases                          = ["us_id", "us_nd"]
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
      container_image = "${var.artifact_registry_repo}/${local.server_image_name}:${var.server_container_version}"

      env_vars = local.server_env_vars

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
    }
  ]
}

# Configure a job that will migrate the database schema
module "migrate-db-job" {
  source                        = "../../vendor/cloud-run-job-exec"
  exec                          = true
  name                          = var.migrate_db_name
  image                         = "${var.artifact_registry_repo}/${local.migrate_db_image_name}:${var.migrate_db_container_version}"
  project_id                    = var.project_id
  location                      = var.location
  env_vars                      = local.migrate_db_env_vars
  cloud_run_deletion_protection = false
  service_account_email         = google_service_account.default.email
  container_command             = ["./scripts/migrate-dbs.sh"]

  volumes = [{
    name = "cloudsql"
    cloud_sql_instance = {
      instances = [module.database.connection_name]
    }
    }
  ]

  volume_mounts = [{
    name       = "cloudsql"
    mount_path = "/cloudsql"
  }]
}

# Configure a job that will import data
# We don't execute it on deploy - it will be run when the workflow is triggered
module "import-job" {
  source = "../../vendor/cloud-run-job-exec"

  # Don't create an import job for demo
  count = var.configure_import ? 1 : 0

  exec                          = false
  name                          = local.import_job_name
  image                         = "${var.artifact_registry_repo}/${local.import_image_name}:${var.import_container_version}"
  project_id                    = var.project_id
  location                      = var.location
  env_vars                      = local.data_import_env_vars
  cloud_run_deletion_protection = false
  service_account_email         = google_service_account.default.email
  timeout                       = "3600s"
  max_retries                   = 1

  volumes = [{
    name = "cloudsql"
    cloud_sql_instance = {
      instances = [module.database.connection_name]
    }
    }
  ]

  volume_mounts = [{
    name       = "cloudsql"
    mount_path = "/cloudsql"
  }]
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
    (local.etl_bucket_name) = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com,serviceAccount:${var.data_platform_project_number}-compute@developer.gserviceaccount.com"
  }

  set_viewer_roles = true
  bucket_viewers = {
    (local.archive_bucket_name) = "serviceAccount:cloud-build-ci-cd@${var.data_platform_project_id}.iam.gserviceaccount.com"
  }
}

# Configure a Google Workflow that is executed when a pubsub notification
module "handle-sentencing-gcs-upload" {
  source = "../../vendor/google-workflows-workflow"

  # Don't create a workflow for demo
  count = var.configure_import ? 1 : 0

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
    JOB_NAME          = module.import-job[0].id
    ARCHIVE_BUCKET_ID = local.archive_bucket_name
    ETL_BUCKET_ID     = local.etl_bucket_name
  }
}
