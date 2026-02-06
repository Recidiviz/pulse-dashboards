variable "project_id" {
  type        = string
  description = "The project that we are deploying the app to"
}

variable "sql_instance_name" {
  type        = string
  description = "The name for our Cloud SQL instance for labeling data"
  default     = "cpa-labeling"
}

variable "sql_base_secret_name" {
  type        = string
  description = "The name of the SQL secret prefixes"
  default     = "cpa_labeling"
}

variable "reentry_db_name" {
  type        = string
  description = "The name of the reentry database to read from"
  default     = "recidiviz"
}

variable "reentry_sql_connection_name" {
  type        = string
  description = "The Cloud SQL connection name for the reentry database (e.g., project:region:instance)"
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

variable "private_network" {
  type        = string
  description = "(Optional) The private network to use for the SQL instance"
  default     = null
}

variable "location" {
  type        = string
  description = "The GCP location (us-east1, us-central1, etc) that we are deploying the service to"
}

variable "server_container_version" {
  type        = string
  description = "The version tag of the image that will deployed for the server"
}

variable "migrate_db_container_version" {
  type        = string
  description = "The version tag of the image that will be used for the database migration job"
}

variable "artifact_registry_repo" {
  type        = string
  description = "Artifact Registry repository to use"
}

variable "artifact_registry_project_id" {
  type        = string
  description = "The project id the Artifact Registry repository is in"
}

variable "allowed_origins" {
  type        = string
  description = "Comma-separated list of allowed CORS origins"
  default     = ""
}

variable "deploy_keyring_name" {
  type        = string
  description = "Name of keyring that stores deploy keys"
  default     = "cpa-labeling-deploy-keys"
}

variable "secrets_filename" {
  type        = string
  description = "SOPS filename to reference for secrets; these keys are automatically created in secrets manager"
}

variable "values_filename" {
  type        = string
  description = "SOPS filename to reference for configuration values"
}

variable "domain_name" {
  type        = string
  description = "Custom domain name for the load balancer (e.g., cpa-labeling.recidiviz.org)"
}

variable "ssl_certificates" {
  type        = list(string)
  description = "Optional list of existing SSL certificate names. If not provided, a managed certificate will be created."
  default     = []
}
