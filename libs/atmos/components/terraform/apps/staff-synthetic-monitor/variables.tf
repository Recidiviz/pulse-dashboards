variable "project_id" {
  type        = string
  description = "GCP project hosting the synthetic monitor function, its credential secrets, and the uptime check."
}

variable "workspace_root" {
  type        = string
  description = <<-EOT
    Absolute path to the nx workspace root. Used to locate the build output
    at $${workspace_root}/dist/apps/@staff/synthetic-monitor-fn so the TF file
    doesn't have to do `path.module/../../../../../..` arithmetic.

    Sourced from $NX_WORKSPACE_ROOT via gomplate templating in the stack file:
      workspace_root: '{{ env.Getenv "NX_WORKSPACE_ROOT" (filepath.Dir (filepath.Dir (env.Getenv "PWD"))) }}'

    nx sets $NX_WORKSPACE_ROOT automatically when invoked via `nx <target>`. When
    running `atmos terraform <plan|apply>` directly from libs/atmos, it falls back
    to the repo root (two dirs up from $PWD), so no manual export is needed.
  EOT

  validation {
    condition     = length(var.workspace_root) > 0 && startswith(var.workspace_root, "/")
    error_message = "workspace_root must be an absolute path. Either invoke via `nx deploy '@staff/synthetic-monitor-fn' -c <env>`, or `export NX_WORKSPACE_ROOT=<repo-root>` before running atmos directly."
  }
}

variable "region" {
  type        = string
  default     = "us-east1"
  description = "Cloud Functions v2 region for the synthetic monitor function."
}

variable "function_name" {
  type        = string
  default     = "staff-synthetic-monitor"
  description = "Cloud Function name. Used in the deployed function URL and SA prefix."
}

variable "staff_app_url" {
  type        = string
  description = "Deployed staff dashboard URL the monitor signs in to (e.g. https://dashboard-staging.recidiviz.org). Shared across all states."
}

variable "secret_data_version" {
  type        = number
  default     = 1
  description = <<-EOT
    Write-only secret-version counter. Because the credential values are set via
    write-only arguments (secret_data_wo), Terraform can't detect when a SOPS
    file changes — bump this integer to push a new Secret Manager version after
    rotating credentials in environments/<env>/<STATE_CODE>.enc.yaml.
  EOT
}

variable "secret_replication_locations" {
  type        = list(string)
  default     = ["us-east1"]
  description = <<-EOT
    User-managed replication regions for the credential secrets. Org policy forbids `global`
    replication so this list must be non-empty and US-only.
  EOT
}

variable "function_memory" {
  type        = string
  default     = "4Gi"
  description = "Memory allocated to the function. Headless Chromium rendering the staff SPA crashes (Uncaught signal: 5) under memory pressure — 2Gi was too tight; 4Gi gives headroom."
}

variable "function_cpu" {
  type        = string
  default     = "2"
  description = "vCPUs allocated to the function. Cloud Run otherwise defaults to 1 vCPU for this memory size, which starves headless Chromium and crashes it intermittently; 2 keeps it stable."
}

variable "cmek_enabled" {
  type        = bool
  default     = true
  description = <<-EOT
    Create a dedicated CMEK key (KMS key ring + crypto key, regional in var.region)
    and encrypt the function's resources, source, and build artifacts with it.
    The component also grants the required Google service agents
    cryptoKeyEncrypterDecrypter on the key and routes the build through a
    CMEK-encrypted Artifact Registry repository. Set false to deploy without CMEK.
  EOT
}

variable "kms_key_rotation_period" {
  type        = string
  default     = "7776000s" # 90 days
  description = "Automatic rotation period for the CMEK crypto key, in seconds with an 's' suffix (minimum 86400s / 1 day)."
}

variable "function_timeout_seconds" {
  type        = number
  default     = 300
  description = "Per-invocation timeout. Must exceed the monitor's in-code wait budget (~90s sign-in + ~160s verification + ~80s failure diagnostics), or the runtime kills failing runs before they can capture diagnostics. The uptime check itself still gives up at its 60s API max (see monitoring.tf)."
}

variable "static_egress_enabled" {
  type        = bool
  default     = true
  description = "Route function egress through a Serverless VPC connector + Cloud NAT pinned to a reserved static IP (see network.tf + the egress_ip output) so the monitor logins can be IP-allowlisted in Auth0. Set false to revert to Google's shared serverless egress pool."
}

variable "egress_subnet_cidr" {
  type        = string
  default     = "10.124.0.0/28"
  description = "/28 the Serverless VPC connector owns inside the dedicated egress network. Must be a /28; the dedicated network means it won't collide with the default network's ranges."

  validation {
    condition     = can(cidrhost(var.egress_subnet_cidr, 0)) && tonumber(split("/", var.egress_subnet_cidr)[1]) == 28
    error_message = "egress_subnet_cidr must be a valid /28 CIDR (Serverless VPC Access connectors require a /28)."
  }
}

variable "connector_machine_type" {
  type        = string
  default     = "e2-micro"
  description = "Machine type for the Serverless VPC Access connector instances. e2-micro is the cheapest and ample for a sign-in monitor."
}

variable "connector_min_instances" {
  type        = number
  default     = 2
  description = "Minimum connector instances (GCP minimum is 2)."
}

variable "connector_max_instances" {
  type        = number
  default     = 3
  description = "Maximum connector instances. Egress is light, so the floor + 1 is plenty."
}

variable "check_period" {
  type        = string
  default     = "900s"
  description = "How often each synthetic monitor runs (uptime check period). Drives both cost and detection latency. GCP only allows 60s/300s/600s/900s (1/5/10/15 min)."

  validation {
    condition     = contains(["60s", "300s", "600s", "900s"], var.check_period)
    error_message = "check_period must be one of 60s, 300s, 600s, 900s (GCP uptime-check limit; 15 min is the max)."
  }
}

variable "verbose_logging" {
  type        = bool
  default     = false
  description = "Set the function's VERBOSE env var so it logs step-by-step breadcrumbs to Cloud Logging (useful for debugging where a run fails/crashes). Leave off in steady state to keep log volume down."
}

variable "trace_logging" {
  type        = bool
  default     = false
  description = "Set the function's TRACE env var so it records a per-run HAR (network trace) and uploads it to the screenshots bucket on failure. Heavier than verbose_logging; enable when diagnosing network/timing flakes (e.g. slow/hung data requests)."
}

variable "screenshot_bucket_name" {
  type        = string
  default     = null
  description = "Override for the failure-screenshots bucket name. Defaults to \"$${project_id}-staff-synthetic-monitor-screenshots\", which staging already uses (exactly 63 chars); GCS caps dot-free bucket names at 63, so projects with longer ids (e.g. recidiviz-dashboard-production) must set a shorter name here. Changing this on an existing deployment destroys and recreates the bucket (screenshots are lost)."
}

variable "screenshot_retention_days" {
  type        = number
  default     = 14
  description = "Days to retain failure screenshots in the screenshots bucket before lifecycle deletion. Screenshots are only written in VERBOSE mode."
}

variable "monitoring_enabled" {
  type        = bool
  default     = true
  description = "Create the notification channels + aggregated alert policy in monitoring.tf. Set false to deploy the synthetic monitors without alerting."
}

variable "monitoring" {
  type = object({
    # Email recipient for synthetic-monitor failures.
    alert_email = optional(string, "alerts@recidiviz.org")
    # Shared "PagerDuty Alert Forwarder" Pub/Sub topic — CRITICAL alerts publish
    # here and a subscriber in that project forwards to PagerDuty. The project's
    # monitoring notification service agent needs roles/pubsub.publisher on it
    # (granted centrally on the shared topic, not in this component).
    pagerduty_forwarder_topic = optional(string, "projects/recidiviz-123/topics/cloud-monitoring-alerts-to-forward")
    # How long a check must fail continuously before the alert fires. Should
    # exceed one check_period (so a single flaky run doesn't page) but stay under
    # two — 1500s ≈ 2 consecutive 900s runs (~30 min detection).
    failure_duration = optional(string, "1500s")
  })
  default     = {}
  description = "Alerting config: email recipient, the shared PagerDuty forwarder topic, and the sustained-failure duration."
}
