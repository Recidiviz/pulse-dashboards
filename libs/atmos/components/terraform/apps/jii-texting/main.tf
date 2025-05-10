data "sops_file" "env" {
  source_file = "../../env-secrets/secrets/jii_texting_server.enc.yaml"
}

locals {
  is_production        = var.project_id == "recidiviz-dashboard-production"
  env_secrets          = yamldecode(data.sops_file.env.raw)
  shared_server_env    = local.env_secrets["env_jii_texting_server"]
  shared_processor_env = local.env_secrets["env_jii_texting_processor_job"]
  shared_import_env    = local.env_secrets["env_jii_texting_import_job"]
  processor_job_env    = local.env_secrets[var.processor_job_env_secret_id]
  server_env           = local.env_secrets[var.server_env_secret_id]
  import_env           = local.env_secrets[var.import_job_env_secret_id]

  server_image        = "${var.artifact_registry_repo}/jii-texting-server:${var.server_version}"
  processor_job_image = "${var.artifact_registry_repo}/jii-texting-jobs/processor:${var.server_version}"
  import_job_image    = "${var.artifact_registry_repo}/jii-texting-jobs/import:${var.server_version}"

  import_job_name = "jii-texting-import"

  # This list needs to be marked as nonsensitive so it can be used in `for_each`
  # the keys are not sensitive, so it is fine if they end up in the Terraform resource names
  import_job_env_vars = nonsensitive([
    for key, value in merge(local.shared_import_env, var.demo_mode ? null : local.import_env) : {
      # The values are sensitive so we want to omit them from the plans
      value = sensitive(value)
      name  = key
    }
  ])

  processor_job_env_vars = nonsensitive([
    for key, value in merge(local.shared_processor_env, local.processor_job_env) : {
      # The values are sensitive so we want to omit them from the plans
      value = sensitive(value)
      name  = key
    }
  ])

  server_env_vars = nonsensitive([
    for key, value in merge(local.shared_server_env, local.server_env) : {
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
  instance_key               = var.sql_instance_name
  base_secret_name           = var.sql_base_secret_name
  database_version           = "POSTGRES_16"
  has_readonly_user          = false
  region                     = var.location
  zone                       = "us-central1-a"
  secondary_zone             = var.database_secondary_zone
  tier                       = "db-custom-1-3840"
  additional_databases       = ["us_id"]
  private_network = "projects/${var.project_id}/global/networks/default"
  insights_config = {
    query_insights_enabled : true
    query_string_length : 1024
    record_application_tags : false
    record_client_address : false
  }
}

module "cloud-run" {
  source = "../../vendor/cloud-run"

  service_name           = var.server_name
  location               = var.location
  project_id             = var.project_id
  create_service_account = true


  containers = [
    {
      container_image = local.server_image

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

  # Roles to grant the Cloud Run service account
  service_account_project_roles = ["roles/cloudsql.client", "roles/storage.objectViewer"]
}

# Configure a Google Workflow that is executed when a message is published to
# the jii_texting_export_success_topic 
module "handle-jii-texting-export-wf" {
  count                 = var.demo_mode ? 0 : 1
  project_id            = var.project_id
  region                = var.location
  source                = "../../vendor/google-workflows-workflow"
  service_account_email = google_service_account.workflows[0].email
  workflow_name         = "handle-jii-texting-export-wf"
  workflow_trigger = {
    event_arc = {
      name                  = "handle-jii-texting-export-wf"
      service_account_email = google_service_account.eventarc[0].email
      pubsub_topic_id       = google_pubsub_topic.jii_texting_export_success_topic[0].id
      matching_criteria = [
        {
          attribute = "type"
          value     = "google.cloud.pubsub.topic.v1.messagePublished"
        }
      ]
    }
  }
  workflow_source = file("${path.module}/workflows/handle-jii-texting-export.workflows.yaml")
  env_vars = {
    PROJECT_ID            = var.project_id
    ARCHIVE_BUCKET_ID     = var.archive_bucket_name
    ETL_BUCKET_ID         = var.etl_bucket_name
    CLOUD_RUN_SERVICE_URL = module.cloud-run.service_uri
  }
}

# Configure a Cloud Run job that will process the JII eligible for texts on a given day
module "process-jii-cloud-run-job" {
  source                        = "../../vendor/cloud-run-job-exec"
  name                          = var.processor_job_name
  image                         = local.processor_job_image
  project_id                    = var.project_id
  location                      = var.location
  env_vars                      = local.processor_job_env_vars
  cloud_run_deletion_protection = false
  volumes                       = [{ name = "cloudsql", cloud_sql_instance = { instances = [module.database.connection_name] } }]
}

# Configure a Cloud Run job that will import the data into our CloudSQL DB
module "import-job" {
  count                         = var.demo_mode ? 0 : 1
  source                        = "../../vendor/cloud-run-job-exec"
  name                          = local.import_job_name
  image                         = local.import_job_image
  project_id                    = var.project_id
  location                      = var.location
  env_vars                      = local.import_job_env_vars
  cloud_run_deletion_protection = false
  exec                          = false
  timeout                       = "3600s"
  max_retries                   = 1
  volumes                       = [{ name = "cloudsql", cloud_sql_instance = { instances = [module.database.connection_name] } }]
}

# Configure a Google Workflow that executes the main processing of JII texts,
# which will be executed by the handle-jii-texting-gcs-upload-wf
module "process-jii-to-text-wf" {
  count                 = var.demo_mode ? 0 : 1
  project_id            = var.project_id
  region                = var.location
  source                = "../../vendor/google-workflows-workflow"
  service_account_email = google_service_account.workflows[0].email
  workflow_name         = "process-jii-to-text"

  workflow_source = file("${path.module}/workflows/process-jii-to-text.workflows.yaml")
  env_vars = {
    CLOUD_RUN_SERVICE_URL = module.cloud-run.service_uri
    BUCKET_ID             = var.etl_bucket_name
    IMPORT_JOB_NAME       = module.import-job[0].id
  }
}
