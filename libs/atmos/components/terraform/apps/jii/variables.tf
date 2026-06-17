variable "project_id" {
  type        = string
  description = "The project that we are deploying the app to (e.g. recidiviz-jii-staging or recidiviz-jii-production)"
}

variable "project_number" {
  type        = string
  description = "The automatically generated identifier for the GCP project (recidiviz-jii-staging or recidiviz-jii-production), used in service account emails"
}

variable "data_platform_project_number" {
  type        = string
  description = "The automatically generated identifier for the corresponding data platform GCP project (recidiviz-staging or recidiviz-123), used in service account emails"
}

variable "sql_instance_name" {
  type        = string
  description = "The name of the SQL instance"
  default     = "jii"
}

variable "sql_base_secret_name" {
  type        = string
  description = "The name of the SQL secret prefixes"
  default     = "jii"
}

variable "database_availability_type" {
  type        = string
  description = "The availability type for the service"
  default     = null
}

variable "database_secondary_zone" {
  type        = string
  description = "The secondary zone for the service"
  default     = null
}

variable "enabled_states" {
  type        = list(string)
  description = "Each will have its own live and demo DB on the SQL instance"
  default     = ["us_ar", "us_az", "us_co", "us_id", "us_ma", "us_nc", "us_nd", "us_ne", "us_tn"]
}

variable "private_network" {
  type        = string
  description = "(Optional) The private network to use for the SQL instance"
  default     = null
}

variable "location" {
  type        = string
  description = "The GCP location (us-east1, us-central1, etc) that we are deploying the service to"
}

variable "server_name" {
  type        = string
  description = "The name of the Cloud Run server"
  default     = "jii-server"
}

variable "service_account_id" {
  type        = string
  description = "The name of the service account"
  default     = "jii-server"
}

variable "server_container_version" {
  type        = string
  description = "The version tag of the image that will deployed for the server"
  default     = "latest"
}

variable "migrate_db_name" {
  type        = string
  description = "The name of service where migrations will be run"
  default     = "jii-migrate-db"
}

variable "migrate_db_container_version" {
  type        = string
  description = "The version tag of the image that will be used for the database migration job"
  default     = "latest"
}

variable "import_job_name" {
  type        = string
  description = "The name of the job for running import from BQ to Postgres. Also used for the name of the Docker image and the Sentry project for this job."
  default     = "jii-data-import"
}

variable "import_job_container_version" {
  type        = string
  description = "The version tag of the image that will be used for the import job"
  default     = "latest"
}

variable "artifact_registry_repo" {
  type        = string
  description = "Artifact Registry repository to use for JII"
}

variable "artifact_registry_project_id" {
  type        = string
  description = "The project id the Artifact Registry repository is in"
}

variable "server_env_filename" {
  type        = string
  description = "Name of server dotenv file"
}

variable "server_env_secrets_filename" {
  type        = string
  description = "Name of SOPS file with secret env vars"
}

variable "secrets_filename" {
  type        = string
  description = "SOPS filename to reference from the secrets component"
}

variable "firebase_auth_project_id" {
  type        = string
  description = "The project id to use for Firebase Auth"
}

variable "deploy_keyring_name" {
  type        = string
  description = "Name of keyring that stores deploy keys"
  default     = "deploy-keys"
}

variable "etl_bucket_name" {
  type        = string
  description = "The name of the GCS bucket used for the import from BQ to Postgres via GCS"
  default     = "jii-etl-data"
}

variable "archive_bucket_name" {
  type        = string
  description = "The name of the GCS bucket used for archives of the data in the ETL bucket"
  default     = "jii-etl-data-archive"
}

variable "import_job_sentry_env" {
  type        = string
  description = "The environment to be used when reporting issues to Sentry from the data import job"
}
