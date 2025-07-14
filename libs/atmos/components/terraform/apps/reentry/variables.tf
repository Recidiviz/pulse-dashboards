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
