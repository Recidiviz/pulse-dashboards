resource "google_project_iam_member" "permissions" {
  project = var.project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${var.service_account_email}"
}

resource "google_bigquery_dataset" "regional_transfer_dataset" {
  for_each = var.postgresql.databases

  dataset_id  = "${var.dataset_name}_${each.key}_regional"
  description = "A regional copy of the sentencing database for state code ${each.key}"
  location    = var.location
}

resource "google_bigquery_dataset" "transfer_dataset" {
  for_each = var.postgresql.databases

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

  display_name = "${var.dataset_name}_${each.key}_bigquery"
  location     = "US"
  schedule = "every day 9:30"
  destination_dataset_id= google_bigquery_dataset.transfer_dataset[each.key].dataset_id
  data_source_id="cross_region_copy"
  params={
      "source_project_id": var.project_id,
      "source_dataset_id":  google_bigquery_dataset.regional_transfer_dataset[each.key].dataset_id
  }
}
