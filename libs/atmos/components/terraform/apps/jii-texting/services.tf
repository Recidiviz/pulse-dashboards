# Enable Workflows API
resource "google_project_service" "workflows" {
  service            = "workflows.googleapis.com"
  disable_on_destroy = false
}

# Enable Eventarc API
resource "google_project_service" "eventarc" {
  service            = "eventarc.googleapis.com"
  disable_on_destroy = false
}

# Enable Pub/Sub API
resource "google_project_service" "pubsub" {
  service            = "pubsub.googleapis.com"
  disable_on_destroy = false
}

# Create a service account for Eventarc 
resource "google_service_account" "eventarc" {
  account_id   = "jii-texting-eventarc-sa"
  display_name = "Eventarc Service Account"
}

# Grant Eventarc SA permission to invoke Workflows
resource "google_project_iam_member" "workflowsinvoker" {
  project = var.project_id
  role    = "roles/workflows.invoker"
  member  = "serviceAccount:${google_service_account.eventarc.email}"
}

# Grant Eventarc SA permission to receive events
resource "google_project_iam_member" "eventreceiver" {
  project = var.project_id
  role    = "roles/eventarc.eventReceiver"
  member  = "serviceAccount:${google_service_account.eventarc.email}"
}

# Grant Eventarc SA permission to write logs
resource "google_project_iam_member" "logwriter" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.eventarc.email}"
}

# Grant the Cloud Storage service account permission to publish Pub/Sub topics
resource "google_project_iam_member" "pubsubpublisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:service-${var.project_number}@gs-project-accounts.iam.gserviceaccount.com"
}

# Grant token creator role to Pub/Sub service agent 
resource "google_project_iam_member" "tokencreator" {
  project = var.project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:service-${var.project_number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

# Create a service account for Workflows
resource "google_service_account" "workflows" {
  account_id   = "jii-texting-workflows-sa"
  display_name = "Google Workflows Service Account"
}

# Grant Cloud Run invoker role to Google Workflows service account
resource "google_project_iam_member" "runinvoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = google_service_account.workflows.member
}

# Grant Cloud Storage Object Viewer role to Google Workflows service account
resource "google_project_iam_member" "storageobjectviewer" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = google_service_account.workflows.member
}

# Create Pub/Sub topic for a successful export of JII Texting views
resource "google_pubsub_topic" "jii_texting_export_success_topic" {
  name    = "jii_texting_export_success"
  project = var.project_id
}

# Grant Pub/Sub role to Airflow service account in data platform project
resource "google_project_iam_member" "airflow-pubsub-publisher" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${var.data_platform_project_number}-compute@developer.gserviceaccount.com"
}

# Grant Workflow Invoker role to Google Workflows service account to allow it to execute Workflows
resource "google_project_iam_member" "workflow-executor" {
  project = var.project_id
  role    = "roles/workflows.admin"
  member  = google_service_account.workflows.member
}

# Grant cloud run job executor so the Workflows service account can execute Cloud Run jobs with env variable overrides
resource "google_project_iam_member" "cloudrunjobexecutor" {
  project = var.project_id
  role    = "roles/run.jobsExecutorWithOverrides"
  member  = google_service_account.workflows.member
}

# Grant the Workflows service account access to view cloud run job status
resource "google_project_iam_member" "cloud-run-viewer" {
  project = var.project_id
  role    = "roles/run.viewer"
  member  = google_service_account.workflows.member
}

# Grant Cloud Run job SA permission to run with overrides
resource "google_project_iam_member" "job-with-overrides" {
  project = var.project_id
  role    = "roles/run.jobsExecutorWithOverrides"
  member  = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com"
}
