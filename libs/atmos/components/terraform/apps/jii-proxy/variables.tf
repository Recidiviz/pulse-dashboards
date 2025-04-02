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
  description = "Artifact Registry repository to use for nginx"
}

variable "server_version" {
  type        = string
  description = "The version tag of the image that we are deploying"
  default     = "latest"
}

variable "members" {
  type        = list(string)
  description = "Users/SAs to be given invoker access to the service"
}
