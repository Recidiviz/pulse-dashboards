# =============================================================================
# typesense-backfill Cloud Function (v2, HTTP-triggered).
#
# Bulk-imports a configured set of Firestore collections into Typesense. The
# upstream firestore-typesense-search extension's `backfill` function (v2.x line)
# can't selectively skip collections — it backfills every path in its config.
# This standalone function lives outside the extension so we can control which
# collections backfill on cadence (daily / post-ETL) vs which sync in realtime
# via the extension's indexOnWrite trigger.
#
# Source lives in the nx workspace at apps/@typesense/backfill-fn/ (TypeScript,
# tests, shared types from ~@typesense/client). It's bundled to a single
# index.cjs + slim runtime package.json under dist/apps/@typesense/backfill-fn/
# by `nx build '@typesense/backfill-fn'`, then zipped + uploaded here.
#
# **`atmos terraform apply` does NOT run the build.** Use `nx deploy
# '@typesense/backfill-fn' -c <staging|production>` for the orchestrated path
# (it `dependsOn`s build, then invokes atmos). Direct atmos invocations ship
# whatever's currently in dist/ — fine if you just built, footgun otherwise.
#
# Cloud Functions builder runs `npm install` server-side against the bundled
# package.json's runtime deps (firebase-admin, typesense).
#
# Triggering: HTTP for now (callable via authenticated curl with a Google
# OIDC token). A Cloud Scheduler job pointed at this function's URL will be
# added later once the ETL completion signal is wired up.
# =============================================================================

data "google_project" "this" {
  project_id = var.project_id
}

locals {
  collections_json = jsonencode(var.collections)
}

# -----------------------------------------------------------------------------
# Source bucket + zip upload
# -----------------------------------------------------------------------------

resource "google_storage_bucket" "function_source" {
  name                        = "${var.project_id}-typesense-backfill-source"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = true # source artifacts only — safe to nuke on destroy

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
}

data "archive_file" "function_source" {
  type = "zip"
  # nx build output — populated by `nx build '@typesense/backfill-fn'`. On a
  # fresh checkout this directory won't exist; `terraform plan` will fail
  # until the build runs once. The `nx deploy` target handles this for you.
  source_dir  = "${var.workspace_root}/dist/apps/@typesense/backfill-fn"
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

resource "google_service_account" "backfill" {
  project      = var.project_id
  account_id   = "typesense-backfill"
  display_name = "Typesense Backfill Function"
  description  = "Runs scheduled Firestore→Typesense bulk imports for batch-sync collections."
}

# Read Firestore documents. `datastore.user` is what the extension also requires;
# matching the role here keeps the two functions interchangeable in audits.
resource "google_project_iam_member" "backfill_datastore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.backfill.email}"
}

# Access the Typesense API key secret (owned by the firestore-typesense-search
# component — reused here so both jobs rotate together).
resource "google_secret_manager_secret_iam_member" "backfill_secret_accessor" {
  project   = var.project_id
  secret_id = var.typesense_api_key_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backfill.email}"
}

# -----------------------------------------------------------------------------
# Cloud Function v2
# -----------------------------------------------------------------------------

resource "google_cloudfunctions2_function" "backfill" {
  name        = var.function_name
  location    = var.region
  description = "HTTP-triggered Firestore→Typesense backfill. Iterates configured collections, bulk-imports docs in batches."

  build_config {
    runtime     = "nodejs22"
    entry_point = "backfill"

    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = google_storage_bucket_object.function_source.name
      }
    }
  }

  service_config {
    max_instance_count    = var.function_max_instances
    available_memory      = var.function_memory
    timeout_seconds       = var.function_timeout_seconds
    service_account_email = google_service_account.backfill.email

    environment_variables = {
      TYPESENSE_HOSTS    = var.typesense_host
      TYPESENSE_PORT     = tostring(var.typesense_port)
      TYPESENSE_PROTOCOL = var.typesense_protocol
      FIRESTORE_DATABASE = var.firestore_database
      COLLECTIONS_JSON   = local.collections_json
    }

    # Mounted as $TYPESENSE_API_KEY in the function process.
    secret_environment_variables {
      key        = "TYPESENSE_API_KEY"
      project_id = data.google_project.this.number
      secret     = var.typesense_api_key_secret_id
      version    = "latest"
    }
  }

  depends_on = [
    google_project_iam_member.backfill_datastore_user,
    google_secret_manager_secret_iam_member.backfill_secret_accessor,
  ]
}
