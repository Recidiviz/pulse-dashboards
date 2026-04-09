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

variable "artifact_registry_repo" {
  type        = string
  description = "Artifact Registry repository to use for JII texting"
}

variable "server_container_version" {
  type        = string
  description = "The version tag of the image that we are deploying"
  default     = "latest"
}

variable "etl_bucket_name" {
  type        = string
  description = "The name of the GCS bucket that contains the ETL data"
  default     = null
}

variable "sql_instance_name" {
  type        = string
  description = "The name of the SQL instance"
  default     = "jii-texting"
}

variable "sql_base_secret_name" {
  type        = string
  description = "The name of the SQL secret prefixes"
  default     = "jii_texting"
}

variable "database_secondary_zone" {
  type        = string
  description = "The secondary zone for the DB"
  default     = null
}

variable "demo_mode" {
  type        = bool
  description = "Whether or not to configure demo resources"
  default     = false
}

variable "processor_job_name" {
  type        = string
  description = "The name of the SQL instance"
  default     = "process-jii"
}

variable "server_name" {
  type        = string
  description = "The name of the Cloud Run service"
  default     = "jii-texting-server"
}

variable "environment" {
  type        = string
  description = "The environment name to load its corresponding environment file from ./secrets/ from"

  validation {
    condition     = contains(["demo", "staging", "production"], var.environment)
    error_message = "ERROR: Valid values for 'environment' are \"demo\", \"staging\",  and \"production\"!"
  }
}

variable "archive_bucket_name" {
  type        = string
  description = "The bucket id for where the archived data should be stored"
}


variable "migrate_db_name" {
  type        = string
  description = "The name of the SQL instance"
  default     = "jii-texting-migrate-db"
}

variable "migrate_db_container_version" {
  type        = string
  description = "The version tag of the image that we are deploying for migrating the db"
  default     = "latest"
}

variable "import_container_version" {
  type        = string
  description = "The version tag of the image that we are deploying for the import job"
  default     = "latest"
}

variable "processor_container_version" {
  type        = string
  description = "The version tag of the image that we are deploying for the processor job"
  default     = "latest"
}
