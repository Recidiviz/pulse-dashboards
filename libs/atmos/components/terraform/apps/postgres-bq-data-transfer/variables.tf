variable "project_id" {
  type        = string
  description = "The project that we are deploying the app to"
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

variable "postgresql_hostname" {
  type        = string
  description = "The hostname of the database"
  default     = "localhost"
}

variable "postgresql_host" {
  type        = string
  description = "The port of the database"
  default     = 5432
}

variable "postgresql_port" {
  type        = number
  description = "The port of the database"
  default     = 5432
}

variable "postgresql_username" {
  type        = string
  description = "The username for the database"
}

variable "postgresql_password" {
  type        = string
  description = "The password for the database"
  sensitive   = true
}

variable "postgresql_databases" {
  type        = set(string)
  description = "The names of the databases"
}

variable "assets" {
  type        = string
  description = "The assets to be used in the transfer"
}
