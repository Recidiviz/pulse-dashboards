data "dotenv" "env" {
  filename = "../../../../../../apps/@jii/server/${var.server_env_filename}"
}

data "sops_file" "env_secrets" {
  source_file = "../../../../../../apps/@jii/server/${var.server_env_secrets_filename}"
}

data "sops_file" "secrets" {
  source_file = "../../secrets/sops/${var.secrets_filename}"
}


locals {
  # these correspond to the docker image tags specified in the project's container command
  server_image_name     = "jii-server"
  migrate_db_image_name = "jii-server"

  secrets = yamldecode(data.sops_file.secrets.raw)

  additional_database_names = flatten([for state_code in var.enabled_states : [state_code, "${state_code}_demo"]])

  # This list needs to be marked as nonsensitive so it can be used in `for_each`
  # the keys are not sensitive, so it is fine if they end up in the Terraform resource names
  db_urls = nonsensitive({ for dbname in local.additional_database_names :
    # The values are sensitive so we want to omit them from the plans
    upper("DATABASE_URL_${dbname}") => sensitive("postgresql://${local.secrets.jii_db_user}:${local.secrets.jii_db_password}@localhost/${dbname}?host=/cloudsql/${var.project_id}:us-central1:${var.sql_instance_name}")
  })

  # This list needs to be marked as nonsensitive so it can be used in `for_each`
  # the keys are not sensitive, so it is fine if they end up in the Terraform resource names
  server_env_vars = nonsensitive([
    for key, value in merge(data.dotenv.env.entries, local.db_urls, yamldecode(data.sops_file.env_secrets.raw)) : {
      # The values may be sensitive so we want to omit them from the plans
      value = sensitive(value)
      name  = key
    }
  ])

  # This list needs to be marked as nonsensitive so it can be used in `for_each`
  # the keys are not sensitive, so it is fine if they end up in the Terraform resource names
  migrate_db_env_vars = nonsensitive([
    for key, value in local.db_urls : {
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
  additional_databases                          = local.additional_database_names
  private_network                               = var.private_network
  enable_private_path_for_google_cloud_services = var.private_network != null ? true : false
  encryption_key_id                             = google_kms_crypto_key.cloud_sql_key.id

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

  members = ["allUsers"] # allow unauthenticated access: https://cloud.google.com/run/docs/authenticating/public
}

# Configure a job that will migrate the database schema
module "migrate_db_job" {
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

moved {
  from = module.migrate-db-job
  to   = module.migrate_db_job
}