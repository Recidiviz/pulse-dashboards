data "sops_file" "env" {
  source_file = "../../env-secrets/secrets/jii_texting_server.enc.yaml"
}

locals {
  is_production = var.project_id == "recidiviz-dashboard-production"
  env_secrets   = yamldecode(data.sops_file.env.raw)
  shared_env    = local.env_secrets["env_jii_texting_server"]
  staging_env   = local.env_secrets["env_staging_jii_texting_server"]
  prod_env      = local.env_secrets["env_prod_jii_texting_server"]

  server_image = "${var.artifact_registry_repo}/jii-texting-server:${var.server_version}"
  job_image    = "${var.artifact_registry_repo}/jii-texting-jobs:${var.server_version}"

  # This list needs to be marked as nonsensitive so it can be used in `for_each`
  # the keys are not sensitive, so it is fine if they end up in the Terraform resource names
  env_vars = nonsensitive([
    for key, value in merge(local.shared_env, local.is_production ? local.prod_env : local.staging_env) : {
      # The values are sensitive so we want to omit them from the plans
      value = sensitive(value)
      name  = key
    }
  ])
}

module "cloud-run" {
  source = "../../vendor/cloud-run"

  service_name = "jii-texting-server"
  image        = local.server_image
  location     = var.location
  project_id   = var.project_id
  env_vars     = local.env_vars
  template_annotations = {
    "run.googleapis.com/cloudsql-instances" : var.cloudsql_instance
  }
}

# Configure a Google Workflow that is executed on a write to a GCS storage bucket
# and executes the main JII texting processing (i.e a separate workflow) if needed
module "handle-jii-texting-gcs-upload-wf" {
  project_id            = var.project_id
  region                = var.location
  source                = "../../vendor/google-workflows-workflow"
  service_account_email = google_service_account.workflows.email
  workflow_name         = "handle-jii-texting-gcs-upload-wf"
  workflow_trigger = {
    event_arc = {
      name                  = "handle-jii-texting-gcs-upload-wf"
      service_account_email = google_service_account.eventarc.email
      matching_criteria = [{
        attribute = "type"
        value     = "google.cloud.storage.object.v1.finalized"
        },
        {
          attribute = "bucket",
          value     = var.etl_bucket_name
      }]
    }
  }
  workflow_source = file("${path.module}/workflows/handle-jii-texting-gcs-upload.workflows.yaml")
}

# Configure a Google Workflow that executes the main processing of JII texts,
# which will be executed by the handle-jii-texting-gcs-upload-wf
module "process-jii-to-text-wf" {
  project_id            = var.project_id
  region                = var.location
  source                = "../../vendor/google-workflows-workflow"
  service_account_email = google_service_account.workflows.email
  workflow_name         = "process-jii-to-text"

  workflow_source = file("${path.module}/workflows/process-jii-to-text.workflows.yaml")
  env_vars = {
    CLOUD_RUN_SERVICE_URL = module.cloud-run.service_url
    BUCKET_ID             = var.etl_bucket_name
  }
}

# Configure a Cloud Run job that will process the JII eligible for texts on a given day
module "process-jii-cloud-run-job" {
  source                        = "../../vendor/cloud-run-job-exec"
  name                          = "process-jii"
  image                         = local.job_image
  project_id                    = var.project_id
  location                      = var.location
  env_vars                      = local.env_vars
  cloud_run_deletion_protection = false
  volumes                       = [{ name = "cloudsql", cloud_sql_instance = { instances = [var.cloudsql_instance] } }]
}
