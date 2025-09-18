# Create a service account
resource "google_service_account" "default" {
  account_id   = var.service_account_id
  display_name = "Case Notes Service Account for data import and running the server"
}

# Grant cloud run invoker so the service account can view Cloud Run services
resource "google_project_iam_member" "cloudruninvoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.default.email}"
}

resource "google_project_iam_member" "bigqueryjobuser" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.default.email}"
}
