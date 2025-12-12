# Data source to get project number
data "google_project" "project" {
  project_id = var.project_id
}

resource "google_project_iam_member" "permissions" {
  project = var.destination_project_id != null ? var.destination_project_id : var.project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${var.service_account_email}"
}

# Grant DTS service agent permission to impersonate the compute service account
resource "google_service_account_iam_member" "dts_token_creator" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/${var.service_account_email}"
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-bigquerydatatransfer.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "job_user" {
  project = var.destination_project_id != null ? var.destination_project_id : var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${var.service_account_email}"
}

resource "google_bigquery_dataset_iam_member" "regional_transfer_dataset_access" {
  for_each = var.postgresql.databases

  project    = var.destination_project_id != null ? var.destination_project_id : var.project_id
  dataset_id = google_bigquery_dataset.regional_transfer_dataset[each.key].dataset_id
  # https://cloud.google.com/bigquery/docs/use-service-accounts#required_permissions
  role   = "roles/bigquery.admin"
  member = "serviceAccount:${var.service_account_email}"
}

# Grant DTS service agent access to regional datasets to create tables
resource "google_bigquery_dataset_iam_member" "regional_dts_agent_access" {
  for_each = var.postgresql.databases

  project    = var.project_id
  dataset_id = google_bigquery_dataset.regional_transfer_dataset[each.key].dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-bigquerydatatransfer.iam.gserviceaccount.com"
}

resource "google_bigquery_dataset_iam_member" "transfer_dataset_access" {
  for_each = var.postgresql.databases

  project    = var.destination_project_id != null ? var.destination_project_id : var.project_id
  dataset_id = google_bigquery_dataset.transfer_dataset[each.key].dataset_id
  # https://cloud.google.com/bigquery/docs/use-service-accounts#required_permissions
  role   = "roles/bigquery.admin"
  member = "serviceAccount:${var.service_account_email}"
}

# Grant DTS service agent access to transfer datasets
resource "google_bigquery_dataset_iam_member" "transfer_dts_agent_access" {
  for_each = var.postgresql.databases

  project    = var.project_id
  dataset_id = google_bigquery_dataset.transfer_dataset[each.key].dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-bigquerydatatransfer.iam.gserviceaccount.com"
}

resource "google_bigquery_dataset" "regional_transfer_dataset" {
  for_each = var.postgresql.databases

  project     = var.destination_project_id != null ? var.destination_project_id : var.project_id
  dataset_id  = "${var.dataset_name}_${each.key}_regional"
  description = "A regional copy of the sentencing database for state code ${each.key}"
  location    = var.location
}

resource "google_bigquery_dataset" "transfer_dataset" {
  for_each = var.postgresql.databases

  project     = var.destination_project_id != null ? var.destination_project_id : var.project_id
  dataset_id  = "${var.dataset_name}_${each.key}"
  description = "A copy of the sentencing database for state code ${each.key}"
  location    = "US"
}

resource "random_id" "attachment" {
  byte_length = 4
}

resource "google_compute_network_attachment" "transfer_attachment" {
  connection_preference = "ACCEPT_MANUAL"
  name                  = "postgres-bq-data-transfer-attachment-${random_id.attachment.hex}"
  subnetworks           = ["default"]
  region                = var.location

  lifecycle {
    ignore_changes = [
      # Ignore changes because a management agent
      # updates these based on some ruleset managed elsewhere.
      producer_accept_lists,
      producer_reject_lists,
    ]
  }
}

resource "google_project_service" "bigquery_data_transfer_service" {
  project = var.project_id
  service = "bigquerydatatransfer.googleapis.com"

  disable_on_destroy = false
}

resource "google_bigquery_data_transfer_config" "postgres_transfer_config" {
  for_each = var.postgresql.databases

  display_name = "${var.dataset_name}_${each.key}_postgres"
  location     = var.location
  # This has to be a specific value for the connector to work
  # See https://github.com/hashicorp/terraform-provider-google/issues/19018
  data_source_id         = "postgresql"
  schedule               = "every day 9:00"
  destination_dataset_id = google_bigquery_dataset.regional_transfer_dataset[each.key].dataset_id
  project                = var.project_id
  service_account_name   = var.service_account_email
  depends_on             = [google_project_service.bigquery_data_transfer_service]

  params = {
    "connector.database"                = each.key
    "connector.encryptionMode"          = "DISABLE"
    "connector.networkAttachment"       = google_compute_network_attachment.transfer_attachment.id
    "connector.endpoint.host"           = var.postgresql.host
    "connector.endpoint.port"           = var.postgresql.port
    "connector.authentication.username" = var.postgresql.username
    "connector.authentication.password" = sensitive(var.postgresql.password)
    "assets" = jsonencode([
      # Format to database/schema/table
      for _, asset in var.tables :
      "${each.key}/public/${asset}"
    ])
  }
}

resource "google_bigquery_data_transfer_config" "transfer_config" {
  for_each = var.postgresql.databases

  service_account_name   = var.service_account_email
  display_name           = "${var.dataset_name}_${each.key}_bigquery"
  location               = "US"
  schedule               = "every day 9:30"
  destination_dataset_id = google_bigquery_dataset.transfer_dataset[each.key].dataset_id
  data_source_id         = "cross_region_copy"
  params = {
    "overwrite_destination_table" : "true",
    "source_project_id" : var.project_id,
    "source_dataset_id" : google_bigquery_dataset.regional_transfer_dataset[each.key].dataset_id
  }
}
