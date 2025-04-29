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

variable "postgresql" {
  type = object({
    host: string
    port: number
    username: string
    password: string
    databases: set(string)
  })
}

variable "tables" {
  type        = list(string)
  description = "The tables to be used in the transfer; assumed that all listed tables exist in each database"
}
