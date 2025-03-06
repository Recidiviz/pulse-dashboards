variable "project_id" {
  type        = string
  description = "The project that we are deploying the app to"
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
  description = "The version tag of the image that we are deploying"
  default     = "latest"
}
