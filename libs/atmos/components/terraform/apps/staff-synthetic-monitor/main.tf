# =============================================================================
# staff-synthetic-monitor Cloud Function (v2) + dedicated credential secrets.
#
# A GCP Cloud Monitoring Synthetic Monitor that signs in to the deployed staff
# dashboard through Auth0 with Playwright and asserts the authenticated app shell
# loads. The uptime check in monitoring.tf invokes this function on a schedule
# (synthetic_monitor -> cloud_function_v2).
#
# Source lives in the nx workspace at apps/@staff/synthetic-monitor-fn/
# (TypeScript, tests). It's bundled to a single index.cjs + slim runtime
# package.json under dist/apps/@staff/synthetic-monitor-fn/ by
# `nx build '@staff/synthetic-monitor-fn'`, then zipped + uploaded here.
#
# **`atmos terraform apply` does NOT run the build.** Use `nx deploy
# '@staff/synthetic-monitor-fn' -c <staging|production>` for the orchestrated
# path (it `dependsOn`s build, then invokes atmos). Direct atmos invocations
# ship whatever's currently in dist/ — fine if you just built, footgun otherwise.
#
# Cloud Functions builder runs `npm install` server-side against the bundled
# package.json's runtime deps (playwright-core, @sparticuz/chromium), which is
# how the headless Chromium binary lands in the function image.
# =============================================================================

data "google_project" "this" {
  project_id = var.project_id
}

# Per-state test users — one SOPS file per state at
# environments/<env>/<STATE_CODE>.enc.yaml, each a map of { username, password }:
#
#   username: <username>>
#   password: <password>
#
# One file per state means each can be encrypted with its own KMS key (configured
# via .sops.yaml path rules). Read EPHEMERALLY so the decrypted credentials never
# persist in Terraform state; the values flow into Secret Manager via write-only
# arguments below. The state list comes from the filenames (locals below) — a
# directory listing, no decryption — so it's non-ephemeral and can drive for_each
# (ephemeral values can't).
ephemeral "sops_file" "test_user" {
  for_each    = local.states
  source_file = "${local.env_dir}/${each.key}.enc.yaml"
}

# -----------------------------------------------------------------------------
# CMEK
#
# When var.cmek_enabled (default true), this module creates its own KMS key ring
# + crypto key and encrypts the function's resources, source bucket objects, and
# build artifacts with it. Cloud Functions v2 requires the build to land in a
# CMEK-encrypted Artifact Registry repo, and several Google-managed service
# agents must hold cryptoKeyEncrypterDecrypter on the key.
# See: https://cloud.google.com/functions/docs/securing/cmek
# -----------------------------------------------------------------------------

locals {
  # staging / production — selects the environments/<env>/ directory.
  env     = replace(var.project_id, "recidiviz-dashboard-", "")
  env_dir = "${path.module}/environments/${local.env}"

  # State list = the <STATE>.enc.yaml filenames. fileset() just lists files (no
  # read/decrypt), so it's non-ephemeral and can drive for_each. `state_slug` is
  # the lowercase-hyphen form GCP resource names require ("US_IA" -> "us-ia");
  # the raw code is passed to the function via STATE_CODE.
  states     = toset([for f in fileset(local.env_dir, "*.enc.yaml") : trimsuffix(f, ".enc.yaml")])
  state_slug = { for s in local.states : s => lower(replace(s, "_", "-")) }

  # Decrypted credentials per state -> { username, password }. This is ephemeral
  # and may ONLY be referenced from write-only arguments (the secret versions
  # below).
  creds = { for s in local.states : s => yamldecode(ephemeral.sops_file.test_user[s].raw) }

  cmek_enabled = var.cmek_enabled
  # Resource name of the module-created crypto key (null when CMEK is off).
  kms_key_id = local.cmek_enabled ? google_kms_crypto_key.monitor[0].id : null

  # Service agents that must be able to use the key. Keyed for a stable for_each.
  cmek_service_agents = local.cmek_enabled ? {
    # Cloud Functions (build/deploy orchestration)
    functions = "service-${data.google_project.this.number}@gcf-admin-robot.iam.gserviceaccount.com"
    # Cloud Run (the gen2 function's serving backend)
    run = "service-${data.google_project.this.number}@serverless-robot-prod.iam.gserviceaccount.com"
    # Cloud Storage (encrypts the uploaded source zip)
    storage = "service-${data.google_project.this.number}@gs-project-accounts.iam.gserviceaccount.com"
    # Artifact Registry (encrypts the CMEK build repo)
    artifactregistry = "service-${data.google_project.this.number}@gcp-sa-artifactregistry.iam.gserviceaccount.com"
    # Cloud Build (produces the function image)
    cloudbuild = "service-${data.google_project.this.number}@gcp-sa-cloudbuild.iam.gserviceaccount.com"
  } : {}
}

# Dedicated key ring + crypto key, owned by this module. Regional (var.region)
# to match the function — Cloud Functions v2 needs a regional key in the
# function's location. NOTE: KMS key rings and keys can't be hard-deleted in GCP;
# `terraform destroy` removes them from state but they persist (key versions are
# scheduled for destruction).
resource "google_kms_key_ring" "monitor" {
  count = local.cmek_enabled ? 1 : 0

  project  = var.project_id
  name     = var.function_name
  location = var.region
}

resource "google_kms_crypto_key" "monitor" {
  count = local.cmek_enabled ? 1 : 0

  name            = var.function_name
  key_ring        = google_kms_key_ring.monitor[0].id
  purpose         = "ENCRYPT_DECRYPT"
  rotation_period = var.kms_key_rotation_period
}

resource "google_kms_crypto_key_iam_member" "cmek_agents" {
  for_each      = local.cmek_service_agents
  crypto_key_id = google_kms_crypto_key.monitor[0].id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:${each.value}"
}

# Gen2 functions can't build into the Google-managed `gcf-artifacts` repo when
# using CMEK — they need a CMEK-encrypted repo we own, referenced from the
# function's build_config.docker_repository.
resource "google_artifact_registry_repository" "function_cmek" {
  count = local.cmek_enabled ? 1 : 0

  project       = var.project_id
  location      = var.region
  repository_id = "${var.function_name}-cmek"
  format        = "DOCKER"
  description   = "CMEK-encrypted build artifacts for the staff synthetic monitor function."
  kms_key_name  = google_kms_crypto_key.monitor[0].id

  # The Artifact Registry agent must hold encrypterDecrypter on the key before
  # the repo can be created with CMEK.
  depends_on = [google_kms_crypto_key_iam_member.cmek_agents]
}

# -----------------------------------------------------------------------------
# Source bucket + zip upload
# -----------------------------------------------------------------------------

resource "google_storage_bucket" "function_source" {
  name                        = "${var.project_id}-staff-synthetic-monitor-source"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = true # source artifacts only — safe to nuke on destroy

  dynamic "encryption" {
    for_each = local.cmek_enabled ? [1] : []
    content {
      default_kms_key_name = local.kms_key_id
    }
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }

  # The Storage CMEK agent must hold encrypterDecrypter on the key before a
  # bucket with a default CMEK key can be created.
  depends_on = [google_kms_crypto_key_iam_member.cmek_agents]
}

data "archive_file" "function_source" {
  type = "zip"
  # nx build output — populated by `nx build '@staff/synthetic-monitor-fn'`. On a
  # fresh checkout this directory won't exist; `terraform plan` will fail
  # until the build runs once. The `nx deploy` target handles this for you.
  source_dir  = "${var.workspace_root}/dist/apps/@staff/synthetic-monitor-fn"
  output_path = "${path.module}/.terraform/function.zip"
}

resource "google_storage_bucket_object" "function_source" {
  # MD5 in the name forces a re-upload (and a new function revision) whenever
  # the source content changes — even if we re-apply without touching anything
  # else.
  name   = "function-${data.archive_file.function_source.output_md5}.zip"
  bucket = google_storage_bucket.function_source.name
  source = data.archive_file.function_source.output_path
}

# -----------------------------------------------------------------------------
# Service account + IAM
# -----------------------------------------------------------------------------

resource "google_service_account" "monitor" {
  project      = var.project_id
  account_id   = var.function_name
  display_name = "Staff Synthetic Monitor Function"
  description  = "Runs the scheduled Playwright sign-in check against the deployed staff dashboard."
}

# The Synthetic Monitor execution traces — the step timeline the execution-details
# page in Cloud Monitoring renders — are written by the Cloud Monitoring service
# agent (gcp-sa-monitoring-notification), NOT the function's runtime SA. Without
# the trace-agent role on that agent the page has no spans to load and times out.
# (The Cloud Trace API must also be enabled, which it is project-wide.)
resource "google_project_iam_member" "monitoring_agent_trace" {
  project = var.project_id
  role    = "roles/cloudtrace.agent"
  member  = "serviceAccount:service-${data.google_project.this.number}@gcp-sa-monitoring-notification.iam.gserviceaccount.com"
}

# -----------------------------------------------------------------------------
# Dedicated credential secrets (two per state)
#
# Values come from the ephemeral SOPS read and are written via WRITE-ONLY
# arguments (`secret_data_wo`), so the credentials never land in Terraform state
# — not in the secret-version resource and not in any data source. Bump
# `var.secret_data_version` to push a new version after rotating the SOPS file.
# Access to the live secrets is granted to the function SA alone; project owners
# inherit access via project ownership. Named
# `${function_name}-${state_slug}-user` / `-password`.
# -----------------------------------------------------------------------------

resource "google_secret_manager_secret" "test_user" {
  for_each = local.states

  project   = var.project_id
  secret_id = "${var.function_name}-${local.state_slug[each.key]}-user"

  # Org policy forbids `global`-region replication, so user-managed US-only.
  replication {
    user_managed {
      dynamic "replicas" {
        for_each = var.secret_replication_locations
        content {
          location = replicas.value
        }
      }
    }
  }
}

resource "google_secret_manager_secret_version" "test_user" {
  for_each = local.states

  secret                 = google_secret_manager_secret.test_user[each.key].id
  secret_data_wo         = local.creds[each.key].username
  secret_data_wo_version = var.secret_data_version
}

resource "google_secret_manager_secret" "test_password" {
  for_each = local.states

  project   = var.project_id
  secret_id = "${var.function_name}-${local.state_slug[each.key]}-password"

  replication {
    user_managed {
      dynamic "replicas" {
        for_each = var.secret_replication_locations
        content {
          location = replicas.value
        }
      }
    }
  }
}

resource "google_secret_manager_secret_version" "test_password" {
  for_each = local.states

  secret                 = google_secret_manager_secret.test_password[each.key].id
  secret_data_wo         = local.creds[each.key].password
  secret_data_wo_version = var.secret_data_version
}

resource "google_secret_manager_secret_iam_member" "monitor_test_user_accessor" {
  for_each = local.states

  project   = var.project_id
  secret_id = google_secret_manager_secret.test_user[each.key].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.monitor.email}"
}

resource "google_secret_manager_secret_iam_member" "monitor_test_password_accessor" {
  for_each = local.states

  project   = var.project_id
  secret_id = google_secret_manager_secret.test_password[each.key].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.monitor.email}"
}

# -----------------------------------------------------------------------------
# Cloud Function v2 (one per state)
#
# Same bundle, parameterized by STATE_CODE + each state's own mounted secrets.
# Each gets its own uptime check (monitoring.tf) for per-state pass/fail.
# -----------------------------------------------------------------------------

resource "google_cloudfunctions2_function" "monitor" {
  for_each = local.states

  name        = "${var.function_name}-${local.state_slug[each.key]}"
  location    = var.region
  description = "Playwright sign-in Synthetic Monitor for the staff dashboard (${each.key}). Invoked on a schedule by the uptime check in monitoring.tf."

  # Encrypts function resources with the customer-managed key when CMEK is on.
  kms_key_name = local.kms_key_id

  build_config {
    runtime     = "nodejs22"
    entry_point = "SyntheticFunction"

    # Route the build into the CMEK-encrypted repo so build artifacts are also
    # customer-managed. Null (the default gcf-artifacts repo) when CMEK is off.
    docker_repository = local.cmek_enabled ? google_artifact_registry_repository.function_cmek[0].id : null

    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = google_storage_bucket_object.function_source.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    # Headless Chromium rendering the staff SPA is memory + CPU hungry; too little
    # of either crashes the browser process ("Uncaught signal: 5") under load.
    available_memory = var.function_memory
    available_cpu    = var.function_cpu

    timeout_seconds       = var.function_timeout_seconds
    service_account_email = google_service_account.monitor.email

    # Route ALL outbound traffic through the Serverless VPC connector so the
    # public Auth0 + dashboard calls (not just RFC-1918) egress via Cloud NAT's
    # reserved static IP — the address Auth0 allowlists. See network.tf. Null
    # when static egress is disabled (falls back to the shared Google pool).
    vpc_connector                 = var.static_egress_enabled ? google_vpc_access_connector.monitor[0].id : null
    vpc_connector_egress_settings = var.static_egress_enabled ? "ALL_TRAFFIC" : null

    environment_variables = {
      STAFF_APP_URL = var.staff_app_url
      STATE_CODE    = each.key
      VERBOSE       = tostring(var.verbose_logging)
      TRACE         = tostring(var.trace_logging)
      # In VERBOSE mode the function uploads failure screenshots here (and in TRACE
      # mode, the per-run HAR). The local /tmp it would otherwise use is ephemeral
      # in the serverless runtime.
      SCREENSHOT_BUCKET = google_storage_bucket.screenshots.name
    }

    # Mounted as $STAFF_TEST_USER / $STAFF_TEST_PASSWORD in the function process.
    secret_environment_variables {
      key        = "STAFF_TEST_USER"
      project_id = data.google_project.this.number
      secret     = google_secret_manager_secret.test_user[each.key].secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "STAFF_TEST_PASSWORD"
      project_id = data.google_project.this.number
      secret     = google_secret_manager_secret.test_password[each.key].secret_id
      version    = "latest"
    }
  }

  depends_on = [
    google_secret_manager_secret_iam_member.monitor_test_user_accessor,
    google_secret_manager_secret_iam_member.monitor_test_password_accessor,
    # The mounted `latest` versions must exist before the function references them.
    google_secret_manager_secret_version.test_user,
    google_secret_manager_secret_version.test_password,
    # CMEK grants must land before the function builds/encrypts with the key.
    google_kms_crypto_key_iam_member.cmek_agents,
    # The egress connector must exist before the function references it.
    google_vpc_access_connector.monitor,
    # The SA's write grant on the screenshots bucket should exist before the
    # function runs and tries to upload to it.
    google_storage_bucket_iam_member.monitor_screenshots_writer,
  ]
}

resource "terraform_data" "set_gen2_exec_env" {
  for_each = local.states
  # Re-run on ANY change that creates a new Cloud Run revision (source, env
  # vars, memory/CPU/timeout, secrets, VPC) — a new revision drops the gen2
  # setting this provisioner re-applies.
  triggers_replace = [
    google_cloudfunctions2_function.monitor[each.key].build_config[0].source[0].storage_source[0].object,
    jsonencode(google_cloudfunctions2_function.monitor[each.key].service_config[0]),
  ]

  provisioner "local-exec" {
    command = <<-EOT
      gcloud run services update ${google_cloudfunctions2_function.monitor[each.key].name} \
        --project=${var.project_id} \
        --region=${google_cloudfunctions2_function.monitor[each.key].location} \
        --execution-environment=gen2 \
        --quiet
    EOT
  }

  depends_on = [google_cloudfunctions2_function.monitor]
}
