module "database" {
  source = "../../vendor/cloud-sql-instance"

  project_id                                    = var.project_id
  create_bigquery_connection                    = false
  instance_key                                  = var.sql_instance_name
  base_secret_name                              = var.sql_base_secret_name
  database_version                              = "POSTGRES_16"
  has_readonly_user                             = false
  availability_type                             = var.database_availability_type
  region                                        = "us-central1"
  zone                                          = "us-central1-f"
  secondary_zone                                = var.database_secondary_zone
  tier                                          = "db-custom-1-3840"
  additional_databases                          = ["us_az", "us_id", "us_ma", "us_ne", "us_tn"]
  private_network                               = var.private_network
  enable_private_path_for_google_cloud_services = var.private_network != null ? true : false

  insights_config = {
    query_insights_enabled : true
    query_string_length : 1024
    record_application_tags : false
    record_client_address : false
  }
}