data "sops_file" "env" {
  source_file = "../../env-secrets/env-secrets.enc.yaml"
}

locals {
  is_production = var.project_id == "recidiviz-dashboard-production"
  env_secrets = yamldecode(data.sops_file.env.raw)
  shared_env = local.env_secrets["env_jii_texting_server"]
  staging_env = local.env_secrets["env_staging_jii_texting_server"]
  prod_env = local.env_secrets["env_prod_jii_texting_server"]

  image = "${var.server_image}:${var.server_version}"

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
  image = local.image
  argument = ["-listen=:8080"]
  location = var.location
  project_id = var.project_id
  env_vars = local.env_vars
  template_annotations = {
    "run.googleapis.com/cloudsql-instances": var.cloudsql_instance
  }
}

# Configure a job that can migrate the database
module "migrate-db" {
  source = "../../vendor/cloud-run-job-exec"
  name = "jii-texting-migrate-db"
  image = local.image
  project_id = var.project_id
  location = var.location
  exec = var.migrate
  container_command = ["./scripts/migrate-dbs.sh"]
  env_vars = local.env_vars
}
