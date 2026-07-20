# CMEK for the frontend buckets.

data "google_project" "this" {}

# Requesting this data source also triggers creation of the GCS service agent
# (service-<project number>@gs-project-accounts.iam.gserviceaccount.com), which
# performs the actual encrypt/decrypt against the key. Readers of the bucket
# (the load balancer service agent, deployers) need no KMS permissions.
data "google_storage_project_service_account" "gcs" {}

# Key ring location must match the bucket location (multi-region US -> "us").
resource "google_kms_key_ring" "frontend" {
  name     = "staff-frontend-${var.environment}"
  location = "us"
}

resource "google_kms_crypto_key" "bucket" {
  name            = "staff-frontend-bucket"
  key_ring        = google_kms_key_ring.frontend.id
  purpose         = "ENCRYPT_DECRYPT"
  rotation_period = "7776000s" # 90 days

  # Destroying a key version that encrypted still-live objects is unrecoverable
  # data loss; deploys re-upload (and thus re-encrypt with the newest version)
  # every object, so old versions age out of use naturally.
  lifecycle {
    prevent_destroy = true
  }
}

resource "google_kms_crypto_key_iam_member" "gcs" {
  crypto_key_id = google_kms_crypto_key.bucket.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = data.google_storage_project_service_account.gcs.member
}
