variable "project_id" {
  type        = string
  description = "The project that we are deploying the app to"
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
  default     = ["us_az", "us_id", "us_ma", "us_ne", "us_tn"]
}

variable "private_network" {
  type        = string
  description = "(Optional_ The private network to use for the SQL instance"
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