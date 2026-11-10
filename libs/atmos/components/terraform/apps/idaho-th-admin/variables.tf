variable "project_id" {
  type        = string
  description = "The project that we are deploying the admin panel to"
}

variable "location" {
  type        = string
  description = "The GCP region for the Cloud Run service and its resources"
}

variable "artifact_registry_project_id" {
  type        = string
  description = "The project id the admin panel's Artifact Registry repository is in"
}

variable "artifact_registry_repository_id" {
  type        = string
  description = "Repository id for the admin panel's dedicated Artifact Registry repository (separate from the public app's own repo)"
  default     = "idaho-th-admin"
}

variable "create_registry" {
  type        = bool
  description = "When true, creates the Artifact Registry repository named artifact_registry_repository_id in artifact_registry_project_id. False for stacks that share an already-existing repo created by another stack (e.g. production sharing staging's)."
  default     = true
}

variable "grant_artifact_registry_cloudrun_agent_iam" {
  type        = bool
  description = "When true, grants this stack's Cloud Run service agent artifactregistry.reader on artifact_registry_project_id. Set true for stacks that deploy Cloud Run from a registry in another project (e.g. production pulling images from the dev Artifact Registry). Same-project staging deploys do not need this."
  default     = false
}

variable "service_account_id" {
  type        = string
  description = "The name of the admin panel Cloud Run service account"
  default     = "idaho-th-admin"
}

variable "server_name" {
  type        = string
  description = "The name of the admin panel Cloud Run service"
  default     = "idaho-th-admin-server"
}

variable "server_container_version" {
  type        = string
  description = "The version tag of the admin panel image to deploy"
  default     = "latest"
}

variable "server_container_image" {
  type        = string
  description = "Full image reference to deploy. Defaults to this component's own Artifact Registry repo + server_container_version. Override with a placeholder (e.g. us-docker.pkg.dev/cloudrun/container/hello) for the bootstrap apply, before any image has been pushed to the (empty) dedicated repo."
  default     = null
}

variable "server_cpu" {
  type        = string
  description = "CPU limit for the admin panel container. Matches the shared recidiviz-data admin panel's own sizing (cloud-run-admin-panel.tf) — same codebase, same full set of schemas/blueprints to boot."
  default     = "2000m"
}

variable "server_memory" {
  type        = string
  description = "Memory limit for the admin panel container. See server_cpu — sized to match the shared admin panel, not guessed. 512Mi is insufficient and OOMs on startup."
  default     = "2Gi"
}

variable "server_gunicorn_workers" {
  type        = number
  description = "Gunicorn workers per instance; 3 is cpus + 1 for the default 2-vCPU server_cpu. Each worker loads the full recidiviz-data codebase, so raise server_memory before raising this."
  default     = 3
}

variable "server_min_instance_count" {
  type        = number
  description = "Minimum number of admin panel Cloud Run instances"
  default     = 0
}

variable "server_max_instance_count" {
  type        = number
  description = "Maximum number of admin panel Cloud Run instances"
  default     = 5
}

variable "recidiviz_env" {
  type        = string
  description = "Value for the RECIDIVIZ_ENV env var (drives environment.in_gcp_staging()/in_gcp_production() in recidiviz-data). Not derived from project_id — this project isn't one of recidiviz-data's own recognized projects."

  validation {
    condition     = contains(["staging", "production"], var.recidiviz_env)
    error_message = "recidiviz_env must be \"staging\" or \"production\"."
  }
}

# Pre-existing secrets from apps/idaho-th, not managed here. Staging uses
# "idaho_th_dev"; prod uses plain "idaho_th". Must match
# IDAHO_TH_STAGING_DB_SECRET_PREFIX / SchemaType.IDAHO_TH's prefix in
# recidiviz-data.
variable "sql_base_secret_name" {
  type        = string
  description = "Prefix for the four pre-existing Idaho TH Cloud SQL secrets this service reads (db_user, db_password, cloudsql_instance_id, db_host)"
}

variable "domain_name" {
  type        = string
  description = "Public hostname for the admin panel, used for the Google-managed SSL certificate"
}

variable "iap_enabled" {
  type        = bool
  description = "Whether IAP is enabled on the backend service. Apply as false first (before the backend service exists to turn IAP on via the Console), then flip to true. Uses Google-managed OAuth — no client id/secret needed here."
  default     = false
}

variable "enable_private_db_egress" {
  type        = bool
  description = "When true, wires Direct VPC Egress (PRIVATE_RANGES_ONLY) into the admin panel server so it can reach the pre-existing Idaho TH Cloud SQL instance over its private IP. Must match apps/idaho-th's own enable_private_db_egress and point at the same subnet, since both apps share one instance."
  default     = false
}

variable "direct_egress_subnetwork_name" {
  type        = string
  description = "Name of the Direct VPC Egress subnet created by apps/idaho-th, required when enable_private_db_egress is true."
  default     = null

  validation {
    condition     = var.enable_private_db_egress ? var.direct_egress_subnetwork_name != null : true
    error_message = "direct_egress_subnetwork_name is required when enable_private_db_egress is true."
  }
}

variable "values_filename" {
  type        = string
  description = "SOPS filename for this component's own iap_access_groups/iap_access_users config, kept separate from apps/idaho-th's secrets since that file's every key is mirrored into its own GSM secret"
}
