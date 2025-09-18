data "sops_file" "env" {
  source_file = "../../env-secrets/secrets/case_notes_server.enc.yaml"
}

locals {
  env_secrets = yamldecode(data.sops_file.env.raw)

  shared_server_env = local.env_secrets["env_case_notes_server"]
  server_env        = local.env_secrets[var.server_env_key]

  server_image_name = "case-notes-server"

  # This list needs to be marked as nonsensitive so it can be used in `for_each`
  # the keys are not sensitive, so it is fine if they end up in the Terraform resource names
  server_env_vars = nonsensitive([
    for key, value in merge(local.shared_server_env, local.server_env) : {
      # The values are sensitive so we want to omit them from the plans
      value = sensitive(value)
      name  = key
    }
  ])
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
}
