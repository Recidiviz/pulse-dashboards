variable "project_id" {
  type        = string
  description = "The project that we are deploying the app to"
}

variable "location" {
  type        = string
  description = "The GCP location (us-east1, us-central1, etc) that we are deploying the service to"
}

variable "server_container_version" {
  type        = string
  description = "The version tag of the image that will deployed for the server"
  default     = "latest"
}

variable "migrate_db_container_version" {
  type        = string
  description = "The version tag of the image that will be used for the database migration job"
  default     = "latest"
}

variable "seed_db_container_version" {
  type        = string
  description = "The version tag of the image that will be used for the one-time database seed job"
  default     = "latest"
}

variable "artifact_registry_repo" {
  type        = string
  description = "Artifact Registry repository to use for Idaho TH"
}

variable "artifact_registry_project_id" {
  type        = string
  description = "The project id the Artifact Registry repository is in"
}

variable "secrets_filename" {
  type        = string
  description = "SOPS filename to reference for Idaho TH secrets"
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

variable "sql_instance_name" {
  type        = string
  description = "The name of the SQL instance"
  default     = "idaho-th"
}

variable "sql_base_secret_name" {
  type        = string
  description = "The name of the SQL secret prefixes"
  default     = "idaho_th"
}

variable "server_name" {
  type        = string
  description = "The name of the Cloud Run service"
  default     = "idaho-th-server"
}

variable "server_ingress" {
  type        = string
  description = "Ingress setting for the Idaho TH Cloud Run service"
  default     = "INGRESS_TRAFFIC_ALL"

  validation {
    condition = contains(
      ["INGRESS_TRAFFIC_ALL", "INGRESS_TRAFFIC_INTERNAL_ONLY", "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"],
      var.server_ingress,
    )
    error_message = "Allowed values for server_ingress are INGRESS_TRAFFIC_ALL, INGRESS_TRAFFIC_INTERNAL_ONLY, or INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER."
  }
}

variable "server_invoker_members" {
  type        = list(string)
  description = "Cloud Run invoker IAM members. Auth0 validates requests at the app layer."
  default     = ["allUsers"]
}

variable "server_cpu" {
  type        = string
  description = "CPU limit for the Idaho TH Cloud Run server container"
  default     = "2000m"
}

variable "server_memory" {
  type        = string
  description = "Memory limit for the Idaho TH Cloud Run server container"
  default     = "2Gi"
}

variable "server_min_instance_count" {
  type        = number
  description = "Minimum number of Cloud Run server instances"
  default     = 0
}

variable "server_max_instance_count" {
  type        = number
  description = "Maximum number of Cloud Run server instances"
  default     = 100
}

variable "server_max_instance_request_concurrency" {
  type        = number
  description = "Max concurrent requests per Cloud Run server instance. Null keeps the Cloud Run default."
  default     = null
}

variable "database_tier" {
  type        = string
  description = "Cloud SQL machine tier for the Idaho TH database"
  default     = "db-custom-1-3840"
}

variable "grant_artifact_registry_cloudrun_agent_iam" {
  type        = bool
  description = "When true, grants this stack's Cloud Run service agent artifactregistry.reader on artifact_registry_project_id. Set true for stacks that deploy Cloud Run from a registry in another project (e.g. production pulling images from the dev Artifact Registry). Same-project staging deploys do not need this."
  default     = false
}

variable "migrate_db_name" {
  type        = string
  description = "The name of the migration job"
  default     = "idaho-th-migrate-db"
}

variable "seed_db_name" {
  type        = string
  description = "The name of the one-time database seed job"
  default     = "idaho-th-seed-db"
}

# Public / non-credential config from SOPS, injected as plain Cloud Run env values.
variable "server_plain_env_keys" {
  type        = list(string)
  description = "SOPS keys injected as plaintext env vars on the Idaho TH Cloud Run server (not Secret Manager refs)"
  default = [
    "AUTH0_DOMAIN",
    "AUTH0_AUDIENCE",
    "DOCUMENT_AI_PROJECT_ID",
    "DOCUMENT_AI_LOCATION",
    "DOCUMENT_AI_PROCESSOR_ID",
    "GOOGLE_PROJECT_ID",
    "GOOGLE_PROJECT_LOCATION",
    "VERTEX_AI_MODEL",
  ]
}

# True secrets from SOPS → GSM (module.secrets); Cloud Run references them via secret_key_ref.
variable "server_secret_env_keys" {
  type        = list(string)
  description = "SOPS keys synced to Secret Manager and injected on the server via secret_key_ref (not plaintext env values)"
  default = [
    "BACKEND_WEBHOOK_SECRET",
    "IDAHO_TH_GOOGLE_PLACES_API_KEY",
    #TODO: TEMPORARY: Comma-separated @recidiviz.org SSO test allowlist (empty = kill switch); remove per auth.ts when complete.
    "IDAHO_TH_RECIDIVIZ_STAFF_ALLOWLIST",
    "SEGMENT_WRITE_KEY",
    "INTERCOM_IDENTITY_VERIFICATION_SECRET",
  ]
}

variable "service_account_id" {
  type        = string
  description = "The name of the server (API) service account; migrate/seed/frontend use their job/service names"
  default     = "idaho-th"
}

# Not a Secret Manager / SOPS value: a Sentry DSN only allows sending events
# to the project, so it's a plain per-stack Terraform value.
variable "sentry_dsn" {
  type        = string
  description = "Sentry DSN for the Idaho TH server. Empty string leaves Sentry disabled for this stack."
  default     = ""
}

variable "sentry_env" {
  type        = string
  description = "Sentry environment tag for the Idaho TH server."
  default     = ""
}

variable "app_env" {
  type        = string
  description = "Idaho TH application environment tag, e.g. \"staging\" or \"production\"."
  default     = ""
}

variable "private_network" {
  type        = string
  description = "(Optional) The private network to use for the SQL instance"
  default     = null
}

variable "enable_security_alerts" {
  type        = bool
  description = "When true, deploy the storage/audit-config/firewall/project-ownership log-based security alerts in monitoring.tf."
  default     = false
}

variable "security_alert_email" {
  type        = string
  description = "Notification channel email for the security alerts in monitoring.tf. Required (non-null) when enable_security_alerts is true; set explicitly per stack, not defaulted here."
  default     = null
}

variable "enable_operational_monitoring" {
  type        = bool
  description = "Deploys operational log-based metrics and the dashboard. With operational_alert_email, also deploys alert policies."
  default     = false
}

variable "operational_alert_email" {
  type        = string
  description = "Notification channel email for operational alerts. When null, metrics and the dashboard can still deploy, but alert policies and uptime checks are skipped."
  default     = null
}

variable "enable_uptime_check" {
  type        = bool
  description = "Deploys the public uptime check and unreachable alert. Also requires enable_operational_monitoring, operational_alert_email, enable_load_balancer, and domain_name."
  default     = false
}

variable "ipv4_enabled" {
  type        = bool
  description = "Whether the Cloud SQL instance keeps a public IP. Set false once Direct VPC Egress private connectivity is wired and verified."
  default     = true

  validation {
    condition     = var.ipv4_enabled ? true : var.enable_private_db_egress
    error_message = "ipv4_enabled = false requires enable_private_db_egress = true, or every Cloud Run resource loses its only path to the database."
  }
}

variable "create_private_service_access" {
  type        = bool
  description = "When true, creates the Private Service Access peering (reserved range + service networking connection) for this project's default VPC. False when a peering already exists and should be adopted via terraform import instead."
  default     = false
}

variable "private_service_access_address" {
  type        = string
  description = "Starting address for the reserved Private Service Access range, when create_private_service_access is true. Pinned explicitly (not left to GCP auto-allocation) so it can't collide with the direct-egress subnet created in the same apply. Must match an adopted peering's existing range exactly if importing rather than creating fresh."
  default     = null

  validation {
    condition     = var.create_private_service_access ? var.private_service_access_address != null : true
    error_message = "private_service_access_address is required when create_private_service_access is true."
  }
}

variable "private_service_access_prefix_length" {
  type        = number
  description = "Prefix length for the reserved Private Service Access range, when create_private_service_access is true. Must match an adopted peering's existing range exactly if importing rather than creating fresh."
  default     = 20
}

variable "create_direct_egress_subnet" {
  type        = bool
  description = "When true, creates a new subnet for Direct VPC Egress (direct_egress_subnet_cidr required). False to instead read an existing subnet named direct_egress_subnetwork_name via a data source."
  default     = false
}

variable "direct_egress_subnet_cidr" {
  type        = string
  description = "CIDR range for the new Direct VPC Egress subnet, when create_direct_egress_subnet is true."
  default     = null

  validation {
    condition     = var.create_direct_egress_subnet ? var.direct_egress_subnet_cidr != null : true
    error_message = "direct_egress_subnet_cidr is required when create_direct_egress_subnet is true."
  }
}

variable "direct_egress_subnetwork_name" {
  type        = string
  description = "Name of the existing subnet to use for Direct VPC Egress when create_direct_egress_subnet is false. Defaults to the auto-mode network's own regional subnet name."
  default     = "default"
}

variable "enable_private_db_egress" {
  type        = bool
  description = "When true, wires Direct VPC Egress (PRIVATE_RANGES_ONLY) into every Cloud Run resource that connects to Cloud SQL, so it can reach the instance over its private IP."
  default     = false
}

variable "enable_load_balancer" {
  type        = bool
  description = "When true, deploy a regional HTTPS load balancer with Cloud Armor that serves the SPA and API on domain_name."
  default     = false
}

variable "lock_server_ingress_to_lb" {
  type        = bool
  description = "When true, restrict the API Cloud Run service to INTERNAL_LOAD_BALANCER ingress. Independent of enable_load_balancer so the LB can be provisioned before cutting over public traffic."
  default     = false
}

variable "domain_name" {
  type        = string
  description = "Public hostname for the Idaho TH app when enable_load_balancer is true."
  default     = null

  validation {
    condition     = !var.enable_load_balancer || var.domain_name != null
    error_message = "domain_name is required when enable_load_balancer is true."
  }
}

variable "frontend_name" {
  type        = string
  description = "Cloud Run service name for the Idaho TH static frontend"
  default     = "idaho-th-frontend"
}

variable "frontend_container_version" {
  type        = string
  description = "The version tag of the image deployed for the static frontend Cloud Run service"
  default     = "latest"
}

variable "frontend_cpu" {
  type        = string
  description = "CPU limit for the Idaho TH frontend Cloud Run container"
  default     = "1000m"
}

variable "frontend_memory" {
  type        = string
  description = "Memory limit for the Idaho TH frontend Cloud Run container"
  default     = "512Mi"
}

variable "frontend_min_instance_count" {
  type        = number
  description = "Minimum number of frontend Cloud Run instances"
  default     = 0
}

variable "frontend_invoker_members" {
  type        = list(string)
  description = "Cloud Run invoker IAM members for the frontend service"
  default     = ["allUsers"]
}

variable "lb_create_proxy_only_subnet" {
  type        = bool
  description = "Create a REGIONAL_MANAGED_PROXY subnet in the default VPC. Set false when one already exists in the region."
  default     = false
}

variable "lb_proxy_only_subnet_ip" {
  type        = string
  description = "CIDR for the REGIONAL_MANAGED_PROXY subnet when lb_create_proxy_only_subnet is true. Must be outside 10.128.0.0/9 on auto-mode VPCs (e.g. 10.127.0.0/23)."
  default     = "10.129.0.0/23"
}

# SPA Auth0 values are public (shipped to the browser via /config.js); keep as plain env.
variable "frontend_env_keys" {
  type        = list(string)
  description = "SOPS keys passed as plaintext env to the frontend Cloud Run service (injected as /config.js at startup). API_URL is set separately in Terraform, not from SOPS."
  default = [
    "AUTH0_DOMAIN",
    "AUTH0_CLIENT_ID",
    "AUTH0_AUDIENCE",
    "INTERCOM_APP_ID",
  ]
}

variable "pdf_gcs_unscanned_bucket_name" {
  type        = string
  description = "GCS bucket for unscanned PDF uploads. Default {project_id}-idaho-th-pdf-unscanned (must match malware_services[]). Optional override."
  default     = null
}

variable "pdf_gcs_clean_bucket_name" {
  type        = string
  description = "GCS bucket for malware-scanned PDF files. Default {project_id}-idaho-th-pdf-uploads (must match malware_services[]). Optional override."
  default     = null
}

variable "pdf_gcs_quarantined_bucket_name" {
  type        = string
  description = "GCS bucket for quarantined PDF files. Default {project_id}-idaho-th-pdf-quarantined (must match malware_services[]). Optional override."
  default     = null
}

variable "scan_events_sa_email" {
  type        = string
  description = "Eventarc invoker SA for scan-complete webhooks. Default idaho-th-scan-events@{project}. Optional override."
  default     = null
}

variable "malware_scan_complete_triggers_enabled" {
  type        = bool
  description = "Whether scan-complete Eventarc triggers are deployed. Keep in sync with apps/malware-scanning enable_scan_complete_triggers. Used in malware_scan_webhook_config output."
  default     = false
}

variable "malware_scan_complete_callback_path" {
  type        = string
  description = "Cloud Run path receiving scan-complete CloudEvents"
  default     = "/internal/gcs-object-scanned"
}

variable "malware_scan_enabled" {
  type        = bool
  description = "App scan feature flag (IDAHO_TH_MALWARE_SCAN_ENABLED). When true, uploads go to unscanned — requires app dual-bucket reads. When false, IDAHO_TH_PDF_GCS_BUCKET stays on the clean/uploads bucket and the scan webhook ignores clean-bucket events, so scan-aware server code never marks a document CLEAN and new documents stay PENDING, unreadable, until the flag is true. Defaults to true so a stack that omits it fails closed. Needs malware_scan_complete_triggers_enabled (default false) to mirror apps/malware-scanning enable_scan_complete_triggers: with the flag true and the triggers left off, no verdict is ever delivered and documents stay PENDING forever."
  default     = true
}

variable "enable_intercom_digest_scheduler" {
  type        = bool
  description = "When true, deploy the Intercom digest Cloud Run Job and weekday Cloud Scheduler (America/Denver)."
  default     = false
}

variable "intercom_digest_job_name" {
  type        = string
  description = "Cloud Run Job name for the Intercom housing digest"
  default     = "idaho-th-intercom-digest"
}

variable "intercom_digest_schedule" {
  type        = string
  description = "Unix-cron schedule for the Intercom digest job (5 fields)"
  default     = "0 10 * * 1-5"

  validation {
    condition     = can(regex("^\\S+\\s+\\S+\\s+\\S+\\s+\\S+\\s+\\S+$", var.intercom_digest_schedule))
    error_message = "intercom_digest_schedule must be a 5-field unix-cron expression (e.g. \"0 10 * * 1-5\")."
  }
}

variable "intercom_digest_time_zone" {
  type        = string
  description = "IANA time zone for the Intercom digest Cloud Scheduler job"
  default     = "America/Denver"

  validation {
    condition = (
      var.intercom_digest_time_zone == "UTC"
      || can(regex("^[A-Za-z_]+/[A-Za-z0-9_+\\-]+(/[A-Za-z0-9_+\\-]+)*$", var.intercom_digest_time_zone))
    )
    error_message = "intercom_digest_time_zone must be UTC or an IANA zone like America/Denver."
  }
}

variable "enable_intercom_provider_sync" {
  type        = bool
  description = "When true, deploy the manually executed Intercom provider contact sync Cloud Run Job (no scheduler). Independent of enable_intercom_digest_scheduler so a stack can create contacts before digest emails start going out."
  default     = false
}

variable "intercom_provider_sync_job_name" {
  type        = string
  description = "Cloud Run Job name for the one-off Intercom provider contact sync"
  default     = "idaho-th-intercom-provider-sync"
}

variable "intercom_jobs_service_account_id" {
  type        = string
  description = "Service account for the Intercom Cloud Run Jobs and their scheduler. Dedicated on purpose: the server account must not be able to read the Intercom token."
  default     = "idaho-th-intercom-jobs"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{5,29}$", var.intercom_jobs_service_account_id))
    error_message = "intercom_jobs_service_account_id must be 6-30 chars, lowercase letters, digits, or hyphens, starting with a letter."
  }
}

# True secrets only, matching server_secret_env_keys. The Intercom access token is
# the sole credential; the admin id is an identifier and stays plain env.
variable "intercom_secret_env_keys" {
  type        = list(string)
  description = "SOPS keys required as Secret Manager refs on the Intercom jobs when either Intercom flag is true"
  default = [
    "INTERCOM_TOKEN",
  ]
}

variable "intercom_plain_env_keys" {
  type        = list(string)
  description = "SOPS keys injected as plaintext env on the Intercom jobs (not Secret Manager refs)"
  default = [
    "INTERCOM_ADMIN_ID",
  ]
}

variable "enable_document_janitor_scheduler" {
  type        = bool
  description = "When true, deploy the document janitor Cloud Run Job and its Cloud Scheduler."
  default     = false
}

variable "document_janitor_job_name" {
  type        = string
  description = "Cloud Run Job name for the document janitor"
  default     = "idaho-th-document-janitor"
}

variable "document_janitor_schedule" {
  type        = string
  description = "Unix-cron schedule for the document janitor job (5 fields)"
  default     = "0 */6 * * *"

  validation {
    condition     = can(regex("^\\S+\\s+\\S+\\s+\\S+\\s+\\S+\\s+\\S+$", var.document_janitor_schedule))
    error_message = "document_janitor_schedule must be a 5-field unix-cron expression (e.g. \"0 */6 * * *\")."
  }
}

variable "document_janitor_service_account_id" {
  type        = string
  description = "Service account for the document janitor Cloud Run Job and its scheduler. Dedicated on purpose: needs clean-bucket GCS delete access the main server identity does not have."
  default     = "idaho-th-doc-janitor"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{5,29}$", var.document_janitor_service_account_id))
    error_message = "document_janitor_service_account_id must be 6-30 chars, lowercase letters, digits, or hyphens, starting with a letter."
  }
}
