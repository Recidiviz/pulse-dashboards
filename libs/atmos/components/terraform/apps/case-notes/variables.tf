variable "project_id" {
  type        = string
  description = "The project that we are deploying the app to"
}

variable "location" {
  type        = string
  description = "The GCP location (us-east1, us-central1, etc) that we are deploying the service to"
}

variable "server_name" {
  type        = string
  description = "The name of the SQL instance"
  default     = "case-notes-server"
}

variable "artifact_registry_repo" {
  type        = string
  description = "Artifact Registry repository to use for Case Notes"
}

variable "server_container_version" {
  type        = string
  description = "The version tag of the image that will deployed for the server"
  default     = "latest"
}

variable "service_account_id" {
  type        = string
  description = "The name of the service account"
  default     = "case-notes-server"
}

variable "server_env_key" {
  type        = string
  description = "The key for the server env"
}
