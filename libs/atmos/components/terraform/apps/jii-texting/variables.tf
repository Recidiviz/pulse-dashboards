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

variable "server_version" {
  type        = string
  description = "The version tag of the image that we are deploying"
  default     = "latest"
}

variable "cloudsql_instance" {
  type        = string
  description = "Cloud SQL instance connection string, used to mount a unix socket in Cloud Run"
}

variable "etl_bucket_name" {
  type        = string
  description = "The name of the GCS bucket that contains the ETL data"
}
