variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "sql_instance_connections" {
  description = "Connection names for the Cloud SQL instance (project:region:instance)"
  type        = map(number)
}
