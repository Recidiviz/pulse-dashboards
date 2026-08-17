# =============================================================================
# typesense-sync Cloud Functions (v2, Firestore-triggered).
#
# Patches user-written Firestore updates onto the Typesense record they update:
#
#   clientUpdatesV2/{recordId}
#     → `preferredName` on `clients` or `residents`, doc id {recordId}
#   clientUpdatesV2/{recordId}/clientOpportunityUpdates/{opportunityDocId}
#     → officer-action fields on `opportunities`, doc id {recordId}_{docId}
#
# The updates are merged onto the parent record rather than indexed as their own
# collections, because Typesense has no joins — a parallel updates collection
# would force every Workflows query to fan out and merge client-side. These are
# partial updates (PATCH): an upsert would replace the whole document and wipe
# the ETL-sourced fields that apps/typesense-backfill owns.
#
# The Firebase extension (sibling component apps/firestore-typesense-search)
# can't do this. It sets the Typesense doc id to the Firestore doc id verbatim,
# so every client's `usTnExpiration` update would collide on one document, and
# it can only write whole documents.
#
# backfill-fn remains the authoritative writer: it reconciles the same fields
# from Firestore on every run, so anything these functions miss is self-healing.
#
# A CFv2 function carries exactly ONE trigger, so the two paths are two function
# resources sharing a single source zip with different entry points. Both are
# built by `nx build '@typesense/sync-fn'` from apps/@typesense/sync-fn/.
#
# **`atmos terraform apply` does NOT run the build.** Use `nx deploy
# '@typesense/sync-fn' -c <staging|production>` for the orchestrated path (it
# `dependsOn`s build, then invokes atmos). Direct atmos invocations ship
# whatever's currently in dist/.
#
# No static egress connector here, unlike apps/typesense-backfill: this syncs
# a handful of documents per day, so its writes sit far below the Cloud Armor
# per-IP rate limit and don't need the allowlisted IP.
# =============================================================================

data "google_project" "this" {
  project_id = var.project_id
}

locals {
  # Keep in lockstep with CLIENT_UPDATE_PATTERN / OPPORTUNITY_UPDATE_PATTERN in
  # apps/@typesense/sync-fn/src/sync.ts. firebase-functions resolves the event's
  # resource name against the same patterns to populate the handler's params.
  client_update_pattern      = "clientUpdatesV2/{recordId}"
  opportunity_update_pattern = "clientUpdatesV2/{recordId}/clientOpportunityUpdates/{opportunityDocId}"
}

# -----------------------------------------------------------------------------
# Source bucket + zip upload
# -----------------------------------------------------------------------------

resource "google_storage_bucket" "function_source" {
  name                        = "${var.project_id}-typesense-sync-source"
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
  # nx build output — populated by `nx build '@typesense/sync-fn'`. On a fresh
  # checkout this directory won't exist; `terraform plan` will fail until the
  # build runs once. The `nx deploy` target handles this for you.
  type        = "zip"
  source_dir  = "${var.workspace_root}/dist/apps/@typesense/sync-fn"
  output_path = "${path.module}/.terraform/function.zip"
}

resource "google_storage_bucket_object" "function_source" {
  # MD5 in the name forces a re-upload (and new revisions on both functions)
  # whenever the source content changes.
  name   = "function-${data.archive_file.function_source.output_md5}.zip"
  bucket = google_storage_bucket.function_source.name
  source = data.archive_file.function_source.output_path
}

# -----------------------------------------------------------------------------
# Service account + IAM
# -----------------------------------------------------------------------------

resource "google_service_account" "sync" {
  project      = var.project_id
  account_id   = "typesense-sync"
  display_name = "Typesense Sync Functions"
  description  = "Mirrors Firestore document writes into Typesense in realtime."
}

# Eventarc delivers the trigger by invoking the function's backing Cloud Run
# service as this SA, so it needs both the invoker and the event-receiver roles.
resource "google_project_iam_member" "sync_event_receiver" {
  project = var.project_id
  role    = "roles/eventarc.eventReceiver"
  member  = "serviceAccount:${google_service_account.sync.email}"
}

resource "google_project_iam_member" "sync_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.sync.email}"
}

# Access the Typesense API key secret (owned by the firestore-typesense-search
# component — reused so all three writers rotate together).
resource "google_secret_manager_secret_iam_member" "sync_secret_accessor" {
  project   = var.project_id
  secret_id = var.typesense_api_key_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.sync.email}"
}

# -----------------------------------------------------------------------------
# Cloud Functions v2
# -----------------------------------------------------------------------------

locals {
  functions = {
    client-update = {
      entry_point  = "syncClientUpdate"
      path_pattern = local.client_update_pattern
      description  = "Mirrors clientUpdatesV2 person documents into Typesense."
    }
    client-opportunity-update = {
      entry_point  = "syncClientOpportunityUpdate"
      path_pattern = local.opportunity_update_pattern
      description  = "Mirrors clientOpportunityUpdates subcollection documents into Typesense."
    }
  }
}

resource "google_cloudfunctions2_function" "sync" {
  for_each = local.functions

  name        = "${var.function_name_prefix}-${each.key}"
  location    = var.region
  description = each.value.description

  build_config {
    runtime     = "nodejs22"
    entry_point = each.value.entry_point

    # `gcloud functions deploy --trigger-event-filters` sets this implicitly;
    # the Terraform resource does NOT infer it from the event_trigger block
    # below. Without it the buildpack starts functions-framework in http mode,
    # so the handler is invoked with an Express Request instead of a
    # CloudEvent — firebase-functions then finds no `data` on it and delivers
    # an event with neither `before` nor `after`, with no error raised.
    environment_variables = {
      GOOGLE_FUNCTION_SIGNATURE_TYPE = "cloudevent"
    }

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
    service_account_email = google_service_account.sync.email

    environment_variables = {
      TYPESENSE_HOSTS    = var.typesense_host
      TYPESENSE_PORT     = tostring(var.typesense_port)
      TYPESENSE_PROTOCOL = var.typesense_protocol
      FIRESTORE_DATABASE = var.firestore_database
    }

    # Mounted as $TYPESENSE_API_KEY in the function process.
    secret_environment_variables {
      key        = "TYPESENSE_API_KEY"
      project_id = data.google_project.this.number
      secret     = var.typesense_api_key_secret_id
      version    = "latest"
    }
  }

  event_trigger {
    # MUST match the Firestore database's location, not the function's region —
    # us-east1 in staging, the nam5 multi-region in production. A mismatch
    # creates the trigger but it silently never fires.
    trigger_region        = var.firestore_database_location
    event_type            = "google.cloud.firestore.document.v1.written"
    service_account_email = google_service_account.sync.email

    # Firestore events are not replayed on failure by default; retrying gives
    # transient Typesense errors (503, timeouts) a second chance. The sync is
    # idempotent — upserts and 404-tolerant deletes — so a duplicate delivery is
    # harmless.
    retry_policy = "RETRY_POLICY_RETRY"

    event_filters {
      attribute = "database"
      value     = var.firestore_database
    }

    event_filters {
      attribute = "document"
      operator  = "match-path-pattern"
      value     = each.value.path_pattern
    }
  }

  depends_on = [
    google_project_iam_member.sync_event_receiver,
    google_project_iam_member.sync_run_invoker,
    google_secret_manager_secret_iam_member.sync_secret_accessor,
  ]
}
