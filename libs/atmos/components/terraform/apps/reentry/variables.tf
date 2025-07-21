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

variable "data_platform_project_id" {
  type        = string
  description = "The data platform project id for the equivalent project/env we are deploying to"
}

variable "location" {
  type        = string
  description = "The GCP location (us-east1, us-central1, etc) that we are deploying the service to"
}

variable "configure_import" {
  type        = bool
  description = "Whether to include the import-related resources"
  default     = true
}

variable "sql_instance_name" {
  type        = string
  description = "The name of the SQL instance"
  default     = "reentry"
}

variable "sql_base_secret_name" {
  type        = string
  description = "The name of the SQL secret prefixes"
  default     = "reentry"
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

variable "private_network" {
  type        = string
  description = "(Optional_ The private network to use for the SQL instance"
  default     = null
}

variable "server_name" {
  type        = string
  description = "The name of the SQL instance"
  default     = "reentry-server"
}

variable "artifact_registry_repo" {
  type        = string
  description = "Artifact Registry repository to use for Reentry"
}

variable "artifact_registry_project_id" {
  type        = string
  description = "The project id the Artifact Registry repository is in"
}

variable "server_container_version" {
  type        = string
  description = "The version tag of the image that will deployed for the server"
  default     = "latest"
}

variable "service_account_id" {
  type        = string
  description = "The name of the service account"
  default     = "reentry"
}

variable "server_env_key" {
  type        = string
  description = "The key for the server env"
}

variable "migrate_db_name" {
  type        = string
  description = "The name of the SQL instance"
  default     = "reentry-migrate-db"
}

variable "migrate_db_container_version" {
  type        = string
  description = "The version tag of the image that will be used for the database migration job"
  default     = "latest"
}
variable "migrate_db_env_key" {
  type        = string
  description = "The key for the migrate db env"
}
