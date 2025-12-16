resource "google_service_account" "default" {
  account_id   = var.service_account_id
  display_name = "Service Account for running the server"
}

# Grant cloud run invoker so the service account can view Cloud Run services
resource "google_project_iam_member" "cloudrunviewer" {
  project = var.project_id
  role    = "roles/run.viewer"
  member  = "serviceAccount:${google_service_account.default.email}"
}

# Grant cloud run job executor so the service account can execute Cloud Run jobs with env variable overrides
resource "google_project_iam_member" "cloudrundjobexecutor" {
  project = var.project_id
  role    = "roles/run.jobsExecutorWithOverrides"
  member  = "serviceAccount:${google_service_account.default.email}"
}

resource "google_project_iam_member" "logwriter" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.default.email}"
}

# Grant Cloud SQL client so the service account can connect to Cloud SQL
resource "google_project_iam_member" "cloudsqlclient" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.default.email}"
}

# service account for cloud sql CMEK encryption
resource "google_project_service_identity" "gcp_sa_cloud_run" {
  project  = var.project_id
  provider = google-beta
  service  = "run.googleapis.com"
}

# Grant Artifact Registry reader so the service account can read images
resource "google_project_iam_member" "artifactregistryreader" {
  project = var.artifact_registry_project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_project_service_identity.gcp_sa_cloud_run.email}"
}

# Grant Firebase Admin so the service account can verify Firebase auth tokens
resource "google_project_iam_member" "firebaseauth" {
  project = var.firebase_auth_project_id
  role    = "roles/firebaseauth.admin"
  member  = "serviceAccount:${google_service_account.default.email}"
}

# service account for cloud sql CMEK encryption
resource "google_project_service_identity" "gcp_sa_cloud_sql" {
  project  = var.project_id
  provider = google-beta
  service  = "sqladmin.googleapis.com"
}

# keyring for CMEK 
resource "google_kms_key_ring" "deploy_keyring" {
  project  = var.project_id
  provider = google-beta
  name     = var.deploy_keyring_name
  location = "us-central1"
}

# CMEK 
resource "google_kms_crypto_key" "cloud_sql_key" {
  provider = google-beta
  name     = "cloudsql"
  key_ring = google_kms_key_ring.deploy_keyring.id
  purpose  = "ENCRYPT_DECRYPT"
}

# Grant SA permission to use the CMEK 
resource "google_kms_crypto_key_iam_binding" "crypto_key" {
  provider      = google-beta
  crypto_key_id = google_kms_crypto_key.cloud_sql_key.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"

  members = [
    "serviceAccount:${google_project_service_identity.gcp_sa_cloud_sql.email}",
  ]
}

# enable admin api for running migration jobs
resource "google_project_service" "project" {
  project = var.project_id
  service = "sqladmin.googleapis.com"
}