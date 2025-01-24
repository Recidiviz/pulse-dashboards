data "sops_file" "env" {
  source_file = "./env-secrets.enc.yaml"
}

locals {
  # Create a map of nonsensitive map of keys from the SOPS file to use in for_each`
  env_data = nonsensitive(toset([for k,v in yamldecode(data.sops_file.env.raw) : k]))
}


resource "google_secret_manager_secret" "env_secrets" {
  for_each = local.env_data
  secret_id = each.key
  replication {
    auto {
    }
  }
}

resource "google_secret_manager_secret_version" "env_secrets_version" {
  for_each = local.env_data
  secret = google_secret_manager_secret.env_secrets[each.key].name
  # Convert YAML dictionary to .env syntax
  secret_data = join("\n", [
    for key, value in yamldecode(data.sops_file.env.raw)[each.key]: join("", [key, "=", value])
  ])
  deletion_policy = "DISABLE"
}
