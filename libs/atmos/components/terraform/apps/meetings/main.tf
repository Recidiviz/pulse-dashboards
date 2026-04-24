locals {
  can_configure_import = var.configure_import

  server_image_name = "meetings-server"

  migrate_db_image_name = "meetings-server"

  import_image_name = "meetings-data-import"
  import_job_name   = "meetings-data-import"

  artifact_cleanup_job_name = "meetings-artifact-cleanup"

  seed_demo_job_name   = "meetings-seed-demo"
  seed_demo_image_name = "meetings-seed-demo"

  etl_bucket_name     = "meetings-etl-data"
  archive_bucket_name = "${local.etl_bucket_name}-archive"
  audio_bucket_name   = "meetings-audio-data"
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
  additional_databases                          = ["us_az", "us_co", "us_me", "us_nc", "us_nd", "us_ne", "us_tn", "us_demo"]
  private_network                               = var.private_network
  enable_private_path_for_google_cloud_services = var.private_network != null ? true : false

  insights_config = {
    query_insights_enabled : true
    query_string_length : 1024
    record_application_tags : false
    record_client_address : false
  }
}


module "envs" {
  source      = "../../modules/sops-env"
  secrets_dir = "${path.module}/environments"
  environment = var.environment
  components  = ["server", "job.artifact_cleanup", "job.import", "job.migrate_db", "job.seed_demo"]
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

      env_vars = concat([
        { name = "AUDIO_RECORDINGS_BUCKET_NAME", value = module.audio_gcs_bucket.names[local.audio_bucket_name] },
        { name = "STITCHING_TASK_REQUEST_URL", value = "https://${var.server_name}-${var.project_number}.${var.location}.run.app/stitch-audio" },
        { name = "NOTETAKING_TASK_REQUEST_URL", value = "https://${var.server_name}-${var.project_number}.${var.location}.run.app/process-notetaking" },
        { name = "TRANSCRIPTION_TASK_REQUEST_URL", value = "https://${var.server_name}-${var.project_number}.${var.location}.run.app/transcribe-audio" },
        { name = "CLOUD_TASKS_PROJECT", value = var.project_id },
        { name = "CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL", value = google_service_account.default.email },
      ], module.envs.env_vars_by_component["server"])

      volume_mounts = [{
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }]

      resources = {
        limits = {
          cpu    = "1000m"
          memory = "2Gi"
        }
      }
    }
  ]


  volumes = [{
    name = "cloudsql"
    cloud_sql_instance = {
      instances = [module.database.connection_name]
    }
  }]

  members = ["allUsers"] # allow unauthenticated access: https://cloud.google.com/run/docs/authenticating/public

  service_scaling = {
    min_instance_count = 1
  }
}

# Configure a job that will migrate the database schema
module "migrate_db_job" {
  source                        = "../../vendor/cloud-run-job-exec"
  exec                          = true
  name                          = var.migrate_db_name
  image                         = "${var.artifact_registry_repo}/${local.migrate_db_image_name}:${var.migrate_db_container_version}"
  project_id                    = var.project_id
  location                      = var.location
  env_vars                      = module.envs.env_vars_by_component["job.migrate_db"]
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
  count = local.can_configure_import ? 1 : 0

  exec       = false
  name       = local.import_job_name
  image      = "${var.artifact_registry_repo}/${local.import_image_name}:${var.import_container_version}"
  project_id = var.project_id
  location   = var.location
  env_vars = concat([
    { name = "IMPORT_BUCKET_ID", value = module.gcs_bucket[0].names[local.etl_bucket_name] }
  ], module.envs.env_vars_by_component["job.import"])
  cloud_run_deletion_protection = false
  service_account_email         = google_service_account.default.email
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

  limits = {
    cpu    = "1000m"
    memory = "1024Mi"
  }
}


module "audio_gcs_bucket" {
  source = "../../vendor/submodules/cloud-storage-bucket"

  project_id = var.project_id
  location   = var.location
  prefix     = var.project_id
  names      = [local.audio_bucket_name]
  logging = {
    log_bucket = "${var.project_id}-gcs-object-logs"
  }
  storage_class   = "STANDARD"
  set_admin_roles = true
  bucket_admins = {
    (local.audio_bucket_name) = "serviceAccount:${google_service_account.default.email}"
  }
  cors = [{
    origin          = var.meetings_bucket_cors_origins
    method          = ["GET", "HEAD", "PUT"]
    response_header = ["Content-Type", "Range"]
  }]
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
    "meetings-etl-data" = true
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
module "handle_meetings_gcs_upload" {
  source = "../../vendor/google-workflows-workflow"

  # Don't create a workflow for demo
  count = local.can_configure_import ? 1 : 0

  project_id            = var.project_id
  region                = var.location
  service_account_email = google_service_account.default.email
  workflow_name         = "handle-meetings-upload-wf"
  workflow_trigger = {
    event_arc = {
      name                  = "handle-meetings-upload-wf"
      service_account_email = google_service_account.default.email
      pubsub_topic_id       = google_pubsub_topic.meetings_export_success_topic[0].id
      matching_criteria = [
        {
          attribute = "type"
          value     = "google.cloud.pubsub.topic.v1.messagePublished"
        }
      ]
    }
  }
  workflow_source = file("${path.module}/workflows/handle-meetings-gcs-upload.workflows.yaml")
  env_vars = {
    PROJECT_ID        = var.project_id
    JOB_NAME          = module.import_job[0].id
    ARCHIVE_BUCKET_ID = module.gcs_bucket[0].names[local.archive_bucket_name]
    ETL_BUCKET_ID     = module.gcs_bucket[0].names[local.etl_bucket_name]
  }
}


# Configure a job that will clean up expired meeting audio recordings and transcriptions
module "artifact_cleanup_job" {
  source = "../../vendor/cloud-run-job-exec"

  exec                          = false
  name                          = local.artifact_cleanup_job_name
  image                         = "${var.artifact_registry_repo}/${local.server_image_name}:${var.artifact_cleanup_container_version}"
  project_id                    = var.project_id
  location                      = var.location
  env_vars                      = module.envs.env_vars_by_component["job.artifact_cleanup"]
  cloud_run_deletion_protection = false
  service_account_email         = google_service_account.default.email
  container_command             = ["./scripts/run-artifact-cleanup.sh"]
  max_retries                   = 0
  timeout                       = "3600s"

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

# Schedule the artifact cleanup job to run once daily
resource "google_cloud_scheduler_job" "artifact_cleanup_schedule" {
  name        = "meetings-artifact-cleanup-schedule"
  description = "Daily cleanup of expired meeting audio recordings and transcriptions"
  schedule    = var.artifact_cleanup_schedule
  time_zone   = "UTC"
  project     = var.project_id
  region      = var.location

  http_target {
    http_method = "POST"
    uri         = "https://run.googleapis.com/v2/${module.artifact_cleanup_job.id}:run"

    oauth_token {
      service_account_email = google_service_account.default.email
    }
  }

  retry_config {
    retry_count = 0
  }
}

# Configure a job that will seed the demo database
module "seed_demo_job" {
  source = "../../vendor/cloud-run-job-exec"

  # Don't execute this job on deploy (for now) so that employees can
  # record meetings to be used as demo data without having them cleared
  exec                          = false
  name                          = local.seed_demo_job_name
  image                         = "${var.artifact_registry_repo}/${local.seed_demo_image_name}:${var.seed_demo_container_version}"
  project_id                    = var.project_id
  location                      = var.location
  env_vars                      = module.envs.env_vars_by_component["job.seed_demo"]
  cloud_run_deletion_protection = false
  service_account_email         = google_service_account.default.email
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

resource "google_cloud_tasks_queue" "audio_stitching_task_queue" {
  name     = "audio-stitching-task-queue"
  project  = var.project_id
  location = var.location

  retry_config {
    max_attempts = 1
  }

  stackdriver_logging_config {
    sampling_ratio = 1.0
  }
}

resource "google_cloud_tasks_queue" "transcription_task_queue" {
  name     = "transcription-task-queue"
  project  = var.project_id
  location = var.location

  rate_limits {
    # This is the max number of concurrent requests that Deepgram allows
    max_concurrent_dispatches = 100
  }

  retry_config {
    max_attempts = 1
  }

  stackdriver_logging_config {
    sampling_ratio = 1.0
  }
}

resource "google_cloud_tasks_queue" "notetaking_task_queue" {
  name     = "notetaking-task-queue"
  project  = var.project_id
  location = var.location

  rate_limits {
    max_concurrent_dispatches = 100
  }

  retry_config {
    max_attempts = 1
  }

  stackdriver_logging_config {
    sampling_ratio = 1.0
  }
}
