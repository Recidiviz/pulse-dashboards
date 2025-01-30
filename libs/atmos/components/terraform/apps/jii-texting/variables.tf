variable "project_id" {
  type        = string
  description = "The project that we are deploying the app to"
}

variable "project_number" {
  type        = string
  description = "The project number for the project we are deploying to"
}


variable "location" {
  type        = string
  description = "The GCP location (us-east1, us-central1, etc) that we are deploying the service to"
}

variable "server_image" {
  type        = string
  description = "Artifact Registry repository to use for the server and migrate jobs"
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

variable "migrate" {
  type        = bool
  description = "Optionally, execute the migrations when running the Terraform apply plan"
  default     = false
}

variable "etl_bucket_name" {
  type        = string
  description = "The name of the GCS bucket that contains the ETL data"
}
