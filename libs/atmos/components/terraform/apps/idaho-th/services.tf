# Server / API runtime service account (idaho-th / idaho-th-dev).
resource "google_service_account" "default" {
  account_id   = var.service_account_id
  display_name = "Idaho Transitional Housing Service Account"
}

# Frontend: image pull and logging only (no Secret Manager or SQL).
resource "google_service_account" "frontend" {
  count = var.enable_load_balancer ? 1 : 0

  account_id   = var.frontend_name
  display_name = "Idaho Transitional Housing Frontend Service Account"
}

resource "google_service_account" "migrate_db" {
  account_id   = var.migrate_db_name
  display_name = "Idaho Transitional Housing Migrate DB Service Account"
}

resource "google_service_account" "seed_db" {
  account_id   = var.seed_db_name
  display_name = "Idaho Transitional Housing Seed DB Service Account"
}

resource "google_project_service_identity" "cloudrun" {
  count = var.grant_artifact_registry_cloudrun_agent_iam ? 1 : 0

  provider = google-beta

  project = var.project_id
  service = "run.googleapis.com"
}

resource "google_project_iam_member" "iamserviceaccountuser" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.default.email}"
}

resource "google_project_iam_member" "logwriter" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.default.email}"
}

resource "google_project_iam_member" "frontend_logwriter" {
  count = var.enable_load_balancer ? 1 : 0

  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.frontend[0].email}"
}

resource "google_project_iam_member" "migrate_db_logwriter" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.migrate_db.email}"
}

resource "google_project_iam_member" "seed_db_logwriter" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.seed_db.email}"
}

resource "google_project_iam_member" "cloudsqlclient" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.default.email}"
}

resource "google_project_iam_member" "migrate_db_cloudsqlclient" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.migrate_db.email}"
}

resource "google_project_iam_member" "seed_db_cloudsqlclient" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.seed_db.email}"
}

resource "google_project_iam_member" "artifactregistryreader" {
  project = var.artifact_registry_project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.default.email}"
}

resource "google_project_iam_member" "frontend_artifactregistryreader" {
  count = var.enable_load_balancer ? 1 : 0

  project = var.artifact_registry_project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.frontend[0].email}"
}

resource "google_project_iam_member" "migrate_db_artifactregistryreader" {
  project = var.artifact_registry_project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.migrate_db.email}"
}

resource "google_project_iam_member" "seed_db_artifactregistryreader" {
  project = var.artifact_registry_project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.seed_db.email}"
}

resource "google_project_iam_member" "cloudrunserviceagentartifactregistryreader" {
  count = var.grant_artifact_registry_cloudrun_agent_iam ? 1 : 0

  project = var.artifact_registry_project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_project_service_identity.cloudrun[0].email}"
}

resource "google_project_iam_member" "documentaiapiuser" {
  project = var.project_id
  role    = "roles/documentai.apiUser"
  member  = "serviceAccount:${google_service_account.default.email}"
}

resource "google_project_iam_member" "aiplatformuser" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.default.email}"
}

# V4 signed URLs (signedUrl.service.ts) need serviceAccountTokenCreator to call
# signBlob without a static key. Self-scoped: the server only ever signs as
# its own identity, never another account, so this is not project-wide.
#
# On a project where a project-wide serviceAccountTokenCreator grant on this
# SA already exists (e.g. migrating an existing environment to this scoped
# version), apply this resource on its own first and confirm it's live before
# removing the project-wide one in a second apply — the two have no ordering
# dependency, so a single combined apply can destroy the old grant before the
# new one exists, breaking signing for anyone in between.
resource "google_service_account_iam_member" "self_token_creator" {
  service_account_id = google_service_account.default.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.default.email}"
}
