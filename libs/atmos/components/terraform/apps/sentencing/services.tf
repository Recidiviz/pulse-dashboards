# Create a service account
resource "google_service_account" "default" {
  account_id   = var.service_account_id
  display_name = "Sentencing Service Account for data import and running the server"
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

# Grant Workflows invoker so the service account can invoke Workflows
resource "google_project_iam_member" "workflowsinvoker" {
  project = var.project_id
  role    = "roles/workflows.invoker"
  member  = "serviceAccount:${google_service_account.default.email}"

  // Only create this resource if the import job is configured
  count = var.configure_import ? 1 : 0
}

# Grant Eventarc eventReceiver so the service account can receive events
resource "google_project_iam_member" "eventarceventreceiver" {
  project = var.project_id
  role    = "roles/eventarc.eventReceiver"
  member  = "serviceAccount:${google_service_account.default.email}"

  // Only create this resource if the import job is configured
  count = var.configure_import ? 1 : 0
}

# Grant Iam service account user so the service account can orchestrate the internal cloud run service accounts
resource "google_project_iam_member" "iamserviceaccountuser" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.default.email}"
}

# Grant Cloud SQL client so the service account can connect to Cloud SQL
resource "google_project_iam_member" "cloudsqlclient" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.default.email}"
}

# Grant Artifact Registry reader so the service account can read images
resource "google_project_iam_member" "artifactregistryreader" {
  project = var.artifact_registry_project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.default.email}"
}

# Grant Cloud Storage Object Viewer role to the service account can read objects
resource "google_project_iam_member" "storageobjectviewer" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.default.email}"

  // Only create this resource if the import job is configured
  count = var.configure_import ? 1 : 0
}

resource "google_pubsub_topic" "sentencing_export_success_topic" {
  name    = "sentencing_export_success"
  project = var.project_id

  // Only create this resource if the import job is configured
  count = var.configure_import ? 1 : 0
}
