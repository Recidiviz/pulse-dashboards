resource "google_project_iam_member" "permissions" {
  project = var.project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${var.service_account_email}"
}

resource "google_bigquery_dataset" "transfer_dataset" {
  for_each = var.postgresql_databases

  dataset_id  = "${var.dataset_name}_${each.key}"
  description = "A copy of the sentencing database for state code ${each.key}"
  location    = var.location
}


resource "google_bigquery_data_transfer_config" "transfer_config" {
  for_each = var.postgresql_databases

  display_name = "${each.key} Transfer"
  location     = var.location
  # This has to be a specific value for the connector to work
  # See https://github.com/hashicorp/terraform-provider-google/issues/19018
  data_source_id         = "postgresql"
  schedule               = "every 24 hours"
  destination_dataset_id = google_bigquery_dataset.transfer_dataset[each.key].dataset_id
  project                = var.project_id
  service_account_name   = var.service_account_email

  params = {
    "connector.database"                = each.key
    "connector.endpoint.host"           = var.postgresql_host
    "connector.endpoint.port"           = var.postgresql_port
    "connector.authentication.username" = var.postgresql_username
    "connector.authentication.password" = var.postgresql_password
    "assets"                  = var.assets
  }
}
