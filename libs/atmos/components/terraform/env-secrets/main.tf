data "sops_file" "env" {
  for_each = local.source_files
  source_file = "./secrets/${each.value}"
}

locals {
  source_files = fileset("./secrets/", "*.enc.yaml")

  env_secret_yamls = flatten([
    for _, file in local.source_files : [
      for k, v in yamldecode(data.sops_file.env[file].raw) : {
        yaml_file = file
        yaml_key  = nonsensitive(k)
      }
    ]
  ])

  env_secrets = {
    for secret in local.env_secret_yamls : secret["yaml_key"] => secret
  }

  # Create a map of nonsensitive map of keys from the SOPS file to use in `for_each`
  env_secret_names = nonsensitive(toset([
    for key, _ in local.env_secrets: key
  ]))
}


resource "google_secret_manager_secret" "env_secrets" {
  for_each = local.env_secret_names
  secret_id = each.value
  replication {
    auto {
    }
  }
}

resource "google_secret_manager_secret_version" "env_secrets_version" {
  for_each = local.env_secret_names
  secret = google_secret_manager_secret.env_secrets[each.key].name
  # Convert YAML dictionary to .env syntax
  secret_data = join("\n", [
    for key, value in yamldecode(
      data.sops_file.env[local.env_secrets[each.value]["yaml_file"]].raw
    )[each.key]: join("", [key, "=", value])
  ])
  deletion_policy = "DISABLE"
}
