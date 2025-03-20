variable "project_id" {
  type        = string
  description = "The project that we are deploying the app to"
}

variable "project_number" {
  type        = string
  description = "The project number for the project we are deploying to"
}

variable "data_platform_project_number" {
  type        = string
  description = "The data platform project number for the equivalent project/env we are deploying to"
}

variable "location" {
  type        = string
  description = "The GCP location (us-east1, us-central1, etc) that we are deploying the service to"
}

variable "import_container_version" {
  type        = string
  description = "The version tag of the image that will deployed for the import job"
  default     = "latest"
}

variable "server_container_version" {
  type        = string
  description = "The version tag of the image that will deployed for the server"
  default     = "latest"
}

variable "migrate_db_container_version" {
  type        = string
  description = "The version tag of the image that will be used for the database migration job"
  default     = "latest"
}


variable "artifact_registry_repo" {
  type        = string
  description = "Artifact Registry repository to use for Sentencing"
}

variable "artifact_registry_project_id" {
  type        = string
  description = "The project id the Artifact Registry repository is in"
}


variable "database_availability_type" {
  type        = string
  description = "The availability type for the service"
  default     = null
}

variable "database_secondary_zone" {
  type        = string
  description = "The secondary zone for the service"
  default     = null
}

variable "sql_instance_name" {
  type        = string
  description = "The name of the SQL instance"
  default     = "sentencing"
}

variable "sql_base_secret_name" {
  type        = string
  description = "The name of the SQL secret prefixes"
  default     = "sentencing"
}

variable "server_name" {
  type        = string
  description = "The name of the SQL instance"
  default     = "sentencing-server"
}

variable "migrate_db_name" {
  type        = string
  description = "The name of the SQL instance"
  default     = "sentencing-migrate-db"
}

variable "import-job-name" {
  type        = string
  description = "The name of the SQL instance"
  default     = "sentencing-data-import"
}

variable "configure_import" {
  type        = bool
  description = "Whether to include the import-related resources"
  default     = true
}

variable "server_env_key" {
  type        = string
  description = "The key for the server env"
}

variable "migrate_db_env_key" {
  type        = string
  description = "The key for the migrate db env"
}

variable "data_import_env_key" {
  type        = string
  description = "The key for the import data env"
  default     = null
}

variable "service_account_id" {
  type        = string
  description = "The name of the service account"
  default     = "sentencing"
}
