data "sops_file" "env" {
  source_file = "../../env-secrets/secrets/sentencing_server.enc.yaml"
}

locals {
  env_secrets = yamldecode(data.sops_file.env.raw)

  env = local.env_secrets["env_demo_sentencing_seed"]

  env_vars = nonsensitive([
    for key, value in env : {
      # The values are sensitive so we want to omit them from the plans
      value = sensitive(value)
      name  = key
    }
  ])
}

module "sentencing_seed_demo" {
  source = "../../vendor/cloud-run-job-exec"

  project_id                    = var.project_id
  location                      = var.location
  exec                          = true
  name                          = "sentencing-seed-demo"
  cloud_run_deletion_protection = false
  service_account_email         = var.service_account_email
  image                         = "${var.artifact_registry_repo}/sentencing-seed-demo:${var.container_version}"
  env_vars                      = local.env_vars
  max_retries                   = 1

  volumes = [
    {
      name = "cloudsql"
      cloud_sql_instance = {
        instances = [var.database_connection_name]
      }
    }
  ]

  volume_mounts = [
    {
      name       = "cloudsql"
      mount_path = "/cloudsql"
    }
  ]
}
