data "sops_file" "secrets" {
  source_file = var.sops_file
}

locals {
  secrets = flatten([
    for k, v in yamldecode(data.sops_file.secrets.raw) : {
      yaml_key = nonsensitive(k)
      yaml_value = v
    }
  ])

  # Create a map of nonsensitive map of keys from the SOPS file to use in `for_each`
  secret_names = nonsensitive(toset([
    for _, value in local.secrets : value["yaml_key"]
  ]))
}


resource "google_secret_manager_secret" "secrets" {
  for_each  = local.secret_names
  secret_id = each.value

  replication {
    dynamic "auto" {
      for_each = lookup(var.replication_overrides, each.value, var.location) == "auto" ? [1] : []
      content {
      }
    }

    dynamic "user_managed" {
      for_each = lookup(var.replication_overrides, each.value, var.location) == "auto" ? [] : [1]

      content {
        replicas {
          location = lookup(var.replication_overrides, each.value, var.location)
        }
      }
    }
  }
}

resource "google_secret_manager_secret_version" "secrets_version" {
  for_each        = local.secret_names
  secret          = google_secret_manager_secret.secrets[each.key].name
  secret_data     = data.sops_file.secrets.data[each.key]
  deletion_policy = lookup(var.deletion_policy_overrides, each.value, var.deletion_policy)
}
