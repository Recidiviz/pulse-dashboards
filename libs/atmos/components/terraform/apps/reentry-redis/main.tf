# Memorystore Redis for one reentry (CPA) environment, with AUTH and TLS enforced.
#
# The Cloud Run services are deployed by apps/@reentry/backend/deploy/*/cloudbuild.yaml, not
# Terraform, so the connection details are handed off through two Secret Manager secrets:
#   RECIDIVIZ_REDIS_URL_<ENV>        full rediss:// URL including the AUTH string
#   RECIDIVIZ_REDIS_SERVER_CA_<ENV>  server CA bundle, mounted as a file at var.ca_cert_mount_path

resource "google_redis_instance" "redis" {
  project        = var.project_id
  region         = var.location
  name           = var.instance_name
  tier           = var.tier
  memory_size_gb = var.memory_size_gb
  redis_version  = var.redis_version

  authorized_network = "projects/${var.project_id}/global/networks/${var.network}"
  connect_mode       = "DIRECT_PEERING"

  auth_enabled = true
  # Can only be set at creation; changing it replaces the instance.
  transit_encryption_mode = "SERVER_AUTHENTICATION"

  labels = {
    product     = "reentry"
    environment = lower(var.environment)
  }

  lifecycle {
    # Replacing the instance drops every queued task and the result backend.
    prevent_destroy = true
  }
}

locals {
  # Memorystore lists both the current and the next CA during a rotation, so trust all of them.
  server_ca_bundle = join("\n", [for c in google_redis_instance.redis.server_ca_certs : c.cert])

  redis_url = format(
    "rediss://:%s@%s:%d/0?ssl_ca_certs=%s",
    urlencode(google_redis_instance.redis.auth_string),
    google_redis_instance.redis.host,
    google_redis_instance.redis.port,
    var.ca_cert_mount_path,
  )

  secrets = {
    url       = "RECIDIVIZ_REDIS_URL_${var.environment}"
    server_ca = "RECIDIVIZ_REDIS_SERVER_CA_${var.environment}"
  }
}

resource "google_secret_manager_secret" "secrets" {
  for_each = local.secrets

  project   = var.project_id
  secret_id = each.value

  replication {
    user_managed {
      replicas {
        location = var.location
      }
    }
  }
}

resource "google_secret_manager_secret_version" "url" {
  secret      = google_secret_manager_secret.secrets["url"].id
  secret_data = local.redis_url
}

resource "google_secret_manager_secret_version" "server_ca" {
  secret      = google_secret_manager_secret.secrets["server_ca"].id
  secret_data = local.server_ca_bundle
}

resource "google_secret_manager_secret_iam_member" "accessors" {
  for_each = {
    for pair in setproduct(keys(local.secrets), var.secret_accessors) :
    "${pair[0]}/${pair[1]}" => { secret = pair[0], member = pair[1] }
  }

  project   = var.project_id
  secret_id = google_secret_manager_secret.secrets[each.value.secret].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${each.value.member}"
}
