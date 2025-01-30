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
