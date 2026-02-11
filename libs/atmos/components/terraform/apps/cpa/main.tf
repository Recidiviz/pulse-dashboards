# data "sops_file" "env" {
#   source_file = "../../env-secrets/secrets/cpa.enc.yaml"
# }

locals {
  can_configure_import = var.configure_import && var.data_import_env_key != null

  # env_secrets = yamldecode(data.sops_file.env.raw)
  # shared_server_env = local.env_secrets["env_cpa_server"]
  # server_env        = local.env_secrets[var.server_env_key]

  # migrate_db_env = local.env_secrets[var.migrate_db_env_key]

  # shared_data_import_env = local.env_secrets["env_cpa_data_import"]
  # data_import_env        = local.can_configure_import ? local.env_secrets[var.data_import_env_key] : {}

  # server_image_name = "cpa-server"

  # migrate_db_image_name = "cpa-server"

  # import_image_name = "cpa-data-import"
  # import_job_name   = "cpa-data-import"

  etl_bucket_name     = "cpa-etl-data"
  archive_bucket_name = "${local.etl_bucket_name}-archive"

  # This list needs to be marked as nonsensitive so it can be used in `for_each`
  # the keys are not sensitive, so it is fine if they end up in the Terraform resource names
  # server_env_vars = nonsensitive([
  #   for key, value in merge(local.shared_server_env, local.server_env) : {
  #     # The values are sensitive so we want to omit them from the plans
  #     value = sensitive(value)
  #     name  = key
  #   }
  # ])

  # This list needs to be marked as nonsensitive so it can be used in `for_each`
  # the keys are not sensitive, so it is fine if they end up in the Terraform resource names
  # migrate_db_env_vars = nonsensitive([
  #   for key, value in local.migrate_db_env : {
  #     # The values are sensitive so we want to omit them from the plans
  #     value = sensitive(value)
  #     name  = key
  #   }
  # ])

  # This list needs to be marked as nonsensitive so it can be used in `for_each`
  # the keys are not sensitive, so it is fine if they end up in the Terraform resource names
  # data_import_env_vars = nonsensitive([
  #   for key, value in merge(local.shared_data_import_env, local.data_import_env) : {
  #     # The values are sensitive so we want to omit them from the plans
  #     value = sensitive(value)
  #     name  = key
  #   }
  # ])
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
  additional_databases                          = ["us_id", "us_ut", "us_az", "us_ne"]
  private_network                               = var.private_network
  enable_private_path_for_google_cloud_services = var.private_network != null ? true : false

  insights_config = {
    query_insights_enabled : true
    query_string_length : 1024
    record_application_tags : false
    record_client_address : false
  }
}

module "gcs_bucket" {
  source = "../../vendor/submodules/cloud-storage-bucket"

  # Don't create a bucket for demo
  count = local.can_configure_import ? 1 : 0

  project_id = var.project_id
  location   = var.location
  prefix     = var.project_id
  names      = [local.etl_bucket_name, local.archive_bucket_name]
  logging = {
    log_bucket = "${var.project_id}-gcs-object-logs"
  }
  versioning = {
    "cpa-etl-data" = true
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


# Configure a Google Workflow that is executed when a pubsub notification is pushed to the cpa_export_success topic
module "handle_cpa_gcs_upload" {
  source = "../../vendor/google-workflows-workflow"

  # Don't create a workflow for demo
  count = local.can_configure_import ? 1 : 0

  project_id            = var.project_id
  region                = var.location
  service_account_email = google_service_account.default.email
  workflow_name         = "handle-cpa-export-wf"
  workflow_trigger = {
    event_arc = {
      name                  = "handle-cpa-export-wf"
      service_account_email = google_service_account.default.email
      pubsub_topic_id       = google_pubsub_topic.cpa_export_success_topic[0].id
      matching_criteria = [
        {
          attribute = "type"
          value     = "google.cloud.pubsub.topic.v1.messagePublished"
        }
      ]
    }
  }
  workflow_source = file("${path.module}/workflows/handle-cpa-gcs-upload.workflows.yaml")
  env_vars = {
    PROJECT_ID        = var.project_id
    ARCHIVE_BUCKET_ID = module.gcs_bucket[0].names[local.archive_bucket_name]
    ETL_BUCKET_ID     = module.gcs_bucket[0].names[local.etl_bucket_name]
  }
}
