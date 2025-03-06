data "sops_file" "env" {
  source_file = "../../env-secrets/secrets/sentencing_server.enc.yaml"
}

locals {
  is_production      = var.project_id == "recidiviz-dashboard-production"
  env_secrets        = yamldecode(data.sops_file.env.raw)
  shared_import_env  = local.env_secrets["env_sentencing_server_import"]
  staging_import_env = local.env_secrets["env_staging_sentencing_server_import"]
  prod_import_env    = local.env_secrets["env_prod_sentencing_server_import"]

  registry_repo_name = "sentencing"
  import_image_name  = "sentencing-import"
  import_job_name    = "sentencing-import"

  # This list needs to be marked as nonsensitive so it can be used in `for_each`
  # the keys are not sensitive, so it is fine if they end up in the Terraform resource names
  import_env_vars = nonsensitive([
    for key, value in merge(local.shared_import_env, local.is_production ? local.prod_import_env : local.staging_import_env) : {
      # The values are sensitive so we want to omit them from the plans
      value = sensitive(value)
      name  = key
    }
  ])
}

module "database" {
  source = "../../vendor/cloud-sql-instance"

  project_id                 = var.project_id
  create_bigquery_connection = false
  instance_key               = "sentencing"
  base_secret_name           = "sentencing"
  database_version           = "POSTGRES_16"
  has_readonly_user          = false
  region                     = "us-central1"
  zone                       = "us-central1-f"
  tier                       = "db-custom-1-3840"
  additional_databases       = ["us_id", "us_nd"]
  insights_config = {
    query_insights_enabled : true
    query_string_length : 1024
    record_application_tags : false
    record_client_address : false
  }
}

module "artifact_registry" {
  source = "../../vendor/artifact-registry"

  project_id    = var.project_id
  location      = var.location
  repository_id = local.registry_repo_name
  format        = "DOCKER"
}

# Configure a job that can migrate the database
# We don't execute it on deploy - it will be run when the workflow is triggered
module "import-job" {
  source                        = "../../vendor/cloud-run-job-exec"
  exec                          = false
  name                          = local.import_job_name
  image                         = "${var.location}-docker.pkg.dev/${var.project_id}/${module.artifact_registry.artifact_name}/${local.import_image_name}:${var.import_container_version}"
  project_id                    = var.project_id
  location                      = var.location
  env_vars                      = local.import_env_vars
  cloud_run_deletion_protection = false

  volumes = [{
    name = "cloudsql"
    cloud_sql_instance = {
      instances = [module.database.connection_name]
    }
    }
  ]
}

module "gcs_bucket" {
  source = "../../vendor/cloud-storage-bucket"

  project_id = var.project_id
  location   = var.location
  prefix     = var.project_id
  names      = ["sentencing-etl-data"]
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
    "sentencing-etl-data" = "serviceAccount:${var.data_platform_project_number}-compute@developer.gserviceaccount.com"
  }
}

# Configure a Google Workflow that is executed when a pubsub notification
module "handle-sentencing-gcs-upload" {
  source                = "../../vendor/google-workflows-workflow"
  project_id            = var.project_id
  region                = var.location
  service_account_email = google_service_account.default.email
  workflow_name         = "handle-sentencing-upload-wf"
  workflow_trigger = {
    event_arc = {
      name                  = "handle-sentencing-upload-wf"
      service_account_email = google_service_account.default.email
      matching_criteria = [
        {
          attribute = "type"
          value     = "google.cloud.pubsub.topic.v1.messagePublished"
        },
        {
          attribute = "topic"
          value     = google_pubsub_topic.sentencing_export_success_topic.id
        }
      ]
    }
  }
  workflow_source = file("${path.module}/workflows/handle-sentencing-gcs-upload.workflows.yaml")
  env_vars = {
    JOB_NAME = module.import-job.id
  }
}
