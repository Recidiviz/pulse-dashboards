variable "project_id" {
  type        = string
  description = "The project that we are deploying the app to"
}

variable "location" {
  type        = string
  description = "The GCP location (us-east1, us-central1, etc) that we are deploying the service to"
}

variable "artifact_registry_repo" {
  type        = string
  description = "Artifact Registry repository to use for Sentencing"
}

variable "service_account_email" {
  type        = string
  description = "The email of the service account to be used to run the job"
}

variable "container_version" {
  type        = string
  description = "The container version to use for the job"
  default     = "latest"
}

variable "database_connection_name" {
  type        = string
  description = "The database connection to be passed to the job"
}
