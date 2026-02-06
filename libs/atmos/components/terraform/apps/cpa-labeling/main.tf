# CPA Labeling App Terraform Configuration
#
# This app connects to TWO databases:
# 1. Reentry database (read-only) - for intake, plan data
# 2. Labeling database (read-write) - for labeling_feedback

data "sops_file" "secrets" {
  source_file = var.secrets_filename
}

data "sops_file" "values" {
  source_file = var.values_filename
}


locals {
  values  = sensitive(yamldecode(data.sops_file.values.raw))
  secrets = sensitive(yamldecode(data.sops_file.secrets.raw))

  environment = strcontains(var.secrets_filename, "production") ? "production" : "staging"

  # Labeling database URL (our own database)
  cpa_labeling_db_url = "postgresql://${local.secrets["cpa_labeling_db_user"]}:${local.secrets["cpa_labeling_db_password"]}@localhost/postgres?host=/cloudsql/${module.database.connection_name}"

  # Environment variables for the server
  server_env_vars = nonsensitive([
    # Database connections
    {
      name  = "LABELING_LABELING_GCP_DB_INSTANCE_NAME"
      value = sensitive("/cloudsql/${module.database.connection_name}/.s.PGSQL.5432")
    },
    {
      name  = "LABELING_LABELING_POSTGRES_USER"
      value = sensitive(local.secrets["cpa_labeling_db_user"])
    },
    {
      name  = "LABELING_LABELING_POSTGRES_PASSWORD"
      value = sensitive(local.secrets["cpa_labeling_db_password"])
    },
    {
      name  = "LABELING_LABELING_POSTGRES_DB"
      value = "postgres"
    },
    {
      name  = "LABELING_REENTRY_GCP_DB_INSTANCE_NAME"
      value = sensitive("/cloudsql/${var.reentry_sql_connection_name}/.s.PGSQL.5432")
    },
    {
      name  = "LABELING_REENTRY_POSTGRES_USER"
      value = sensitive(local.secrets["reentry_db_user"])
    },
    {
      name  = "LABELING_REENTRY_POSTGRES_PASSWORD"
      value = sensitive(local.secrets["reentry_db_password"])
    },
    {
      name  = "LABELING_REENTRY_POSTGRES_DB"
      value = sensitive(var.reentry_db_name)
    },
    # CORS
    {
      name  = "LABELING_ALLOWED_ORIGINS"
      value = sensitive(var.allowed_origins)
    },
    # Slack webhook
    {
      name  = "LABELING_SLACK_WEBHOOK_URL"
      value = sensitive(local.secrets["slack_webhook_url"])
    },
  ])
}

module "secrets" {
  source    = "../../secrets"
  location  = var.location
  sops_file = var.secrets_filename
}


# Our own Cloud SQL instance for labeling_feedback table
module "database" {
  source = "../../vendor/cloud-sql-instance"

  project_id                                    = var.project_id
  create_bigquery_connection                    = false
  instance_key                                  = var.sql_instance_name
  base_secret_name                              = var.sql_base_secret_name
  database_version                              = "POSTGRES_18"
  has_readonly_user                             = false
  availability_type                             = var.database_availability_type
  region                                        = "us-central1"
  zone                                          = "us-central1-f"
  secondary_zone                                = var.database_secondary_zone
  tier                                          = "db-custom-1-3840"
  additional_databases                          = []
  private_network                               = var.private_network
  enable_private_path_for_google_cloud_services = var.private_network != null ? true : false
  encryption_key_id                             = google_kms_crypto_key.cloud_sql_key.id

  insights_config = {
    query_insights_enabled : true
    query_string_length : 1024
    record_application_tags : false
    record_client_address : false
  }

  providers = {
    google = google
  }

  depends_on = [
    module.secrets
  ]
}

# Cloud Run service
module "server" {
  source = "../../vendor/cloud-run"

  project_id                    = var.project_id
  location                      = var.location
  service_name                  = "cpa-labeling-server-${local.environment}"
  service_account               = google_service_account.default.email
  cloud_run_deletion_protection = false

  # Only allow traffic from the load balancer
  ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  containers = [
    {
      container_image = "${var.artifact_registry_repo}:${var.server_container_version}"

      env_vars = local.server_env_vars

      # Mount BOTH Cloud SQL instances
      volume_mounts = [{
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }]
    }
  ]

  # Connect to both our database AND the reentry database
  volumes = [{
    name = "cloudsql"
    cloud_sql_instance = {
      instances = [
        module.database.connection_name, # Our labeling database
        var.reentry_sql_connection_name, # Reentry database (read-only)
      ]
    }
  }]

  service_scaling = {
    min_instance_count = 0
  }

  # Allow load balancer to invoke the service
  # IAP access control is managed separately in iap_access.tf
  members = [
    "allUsers" # Required for load balancer to reach Cloud Run
  ]
}

# Database migration job
module "migrate_db_job" {
  source     = "../../vendor/cloud-run-job-exec"
  exec       = true
  name       = "cpa-labeling-migrate-${local.environment}"
  image      = "${var.artifact_registry_repo}:${var.migrate_db_container_version}"
  project_id = var.project_id
  location   = var.location
  env_vars = nonsensitive([
    {
      name  = "DATABASE_URL"
      value = sensitive(local.cpa_labeling_db_url)
    },
  ])
  cloud_run_deletion_protection = false
  service_account_email         = google_service_account.default.email
  container_command             = ["uv", "run", "alembic", "upgrade", "head"]

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
