variable "project_id" {
  type        = string
  description = "The project where BigQuery datasets should be created"
}

variable "location" {
  type        = string
  description = "The GCP location (us-east1, us-central1, etc) that we are deploying the service to"
}

variable "dataset_name" {
  type        = string
  description = "The name of the dataset to be created in BigQuery"
}

variable "service_account_email" {
  type        = string
  description = "The email of the service account to be used to run the job"
}

variable "postgresql" {
  type = object({
    host : string
    port : number
    username : string
    password : string
    databases : set(string)
  })
  description = "Config object for database connection string components"
}

variable "tables" {
  type        = list(string)
  description = "The tables to be used in the transfer; assumed that all listed tables exist in each database"
}

variable "destination_project_id" {
  type        = string
  description = "Optional destination project ID for cross-project BigQuery dataset copy. When set, creates an additional transfer that copies from this project's US datasets to the destination project."
  default     = null
}

variable "destination_service_account_email" {
  type        = string
  description = "Service account email to use for cross-project transfers in the destination project. Required when destination_project_id is set. The source service account will be granted read access to source datasets."
  default     = null
}

variable "transfer_start_time" {
  type        = string
  description = "Start time for the initial PostgreSQL->BigQuery transfer in HH:MM format (e.g., '09:00')"
  default     = "09:00"
}

variable "transfer_delay_minutes" {
  type        = number
  description = "Minutes to wait between each subsequent transfer stage"
  default     = 30
}
