# =============================================================================
# Failure-screenshot bucket.
#
# In VERBOSE mode the function captures a PNG of the failing page (see
# src/diagnostics.ts captureFailureScreenshot). The serverless runtime's local
# /tmp is in-memory and lost when the instance is recycled, so deployed runs
# upload the screenshot here instead (keyed by state + timestamp), making the
# visual state of a failed check inspectable after the fact. Local smoke runs,
# which have no SCREENSHOT_BUCKET, keep writing to local disk.
#
# Dedicated (not the function-source bucket) so screenshots get their own
# retention and stay browsable without the source zips mixed in. CMEK-encrypted
# with the component's own key (local.kms_key_id); the Cloud Storage CMEK service
# agent already holds encrypterDecrypter on it (see cmek_service_agents in
# main.tf), so no extra key grant is needed.
# =============================================================================

resource "google_storage_bucket" "screenshots" {
  # Default suffix keeps the pre-existing staging bucket name; projects whose id
  # pushes it past GCS's 63-char limit override via screenshot_bucket_name.
  name                        = coalesce(var.screenshot_bucket_name, "${var.project_id}-staff-synthetic-monitor-screenshots")
  project                     = var.project_id
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = true # diagnostic artifacts only — safe to nuke on destroy

  # CMEK when enabled; falls back to Google-managed encryption when CMEK is off
  # (local.kms_key_id is null then, and the encryption block is omitted entirely).
  dynamic "encryption" {
    for_each = local.cmek_enabled ? [1] : []
    content {
      default_kms_key_name = local.kms_key_id
    }
  }

  lifecycle_rule {
    condition {
      age = var.screenshot_retention_days
    }
    action {
      type = "Delete"
    }
  }

  # The Storage CMEK agent must hold encrypterDecrypter on the key before a bucket
  # with a default CMEK key can be created.
  depends_on = [google_kms_crypto_key_iam_member.cmek_agents]
}

# The function SA only needs to create objects (write screenshots); it never reads
# or lists them. Scoped to this bucket, not project-wide.
resource "google_storage_bucket_iam_member" "monitor_screenshots_writer" {
  bucket = google_storage_bucket.screenshots.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.monitor.email}"
}
