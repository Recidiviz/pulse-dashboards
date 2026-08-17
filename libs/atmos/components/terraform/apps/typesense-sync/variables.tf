variable "project_id" {
  type        = string
  description = "GCP project hosting Firestore + the Typesense API key secret + these functions."
}

variable "workspace_root" {
  type        = string
  description = <<-EOT
    Absolute path to the nx workspace root. Used to locate the build output
    at $${workspace_root}/dist/apps/@typesense/sync-fn so the TF file
    doesn't have to do `path.module/../../../../../..` arithmetic.

    Sourced from $NX_WORKSPACE_ROOT via gomplate templating in the stack file:
      workspace_root: '{{ env.Getenv "NX_WORKSPACE_ROOT" }}'

    nx sets this env var automatically when invoked via `nx <target>`. If
    running `atmos terraform <plan|apply>` directly outside an nx target,
    export NX_WORKSPACE_ROOT first (e.g. `export NX_WORKSPACE_ROOT=$PWD`
    from the repo root).
  EOT

  validation {
    condition     = length(var.workspace_root) > 0 && startswith(var.workspace_root, "/")
    error_message = "workspace_root must be an absolute path. Either invoke via `nx deploy '@typesense/sync-fn' -c <env>`, or `export NX_WORKSPACE_ROOT=<repo-root>` before running atmos directly."
  }
}

variable "region" {
  type        = string
  default     = "us-east1"
  description = "Cloud Functions v2 region the functions run in. Match the backfill function's region so traffic stays local."
}

variable "firestore_database_location" {
  type        = string
  description = <<-EOT
    Location of the project's Firestore database — a single region (us-east1 in staging)
    OR a multi-region (nam5 in production). This is the Eventarc trigger_region, which is
    NOT the same as var.region: the trigger must live where the database lives, and a
    mismatch produces a trigger that is created successfully but never fires.
  EOT
}

variable "function_name_prefix" {
  type        = string
  default     = "typesense-sync"
  description = "Prefix for the deployed function names. Each trigger appends its own suffix (e.g. typesense-sync-client-update)."
}

variable "firestore_database" {
  type        = string
  default     = "(default)"
  description = "Firestore database name. `(default)` is the project's default DB. Also used as the Eventarc `database` event filter."
}

variable "typesense_host" {
  type        = string
  description = "Public hostname of the Typesense cluster (e.g. typesense-staging.recidiviz.org). Mirrors var.hostname on the apps/typesense component."
}

variable "typesense_port" {
  type        = number
  default     = 443
  description = "Typesense TLS port. Default 443 — match the LB listener on the typesense component."
}

variable "typesense_protocol" {
  type        = string
  default     = "https"
  description = "Typesense protocol. Default https — match the LB listener on the typesense component."
}

variable "typesense_api_key_secret_id" {
  type        = string
  default     = "ext-firestore-typesense-search-TYPESENSE_API_KEY"
  description = <<-EOT
    Secret Manager secret ID of the Typesense write-scoped API key. Defaults to the same secret
    managed by apps/firestore-typesense-search — the extension, the backfill function and these
    sync functions all need the same document write/delete scope, so they share one key rather
    than rotating three in parallel. Only grants the sync SA accessor on it; the secret itself is
    still owned by the firestore-typesense-search component.
  EOT
}

variable "function_memory" {
  type        = string
  default     = "256Mi"
  description = "Memory per function. These handlers project a single small document per invocation, so the Cloud Run floor is ample."
}

variable "function_timeout_seconds" {
  type        = number
  default     = 60
  description = "Per-invocation timeout. One Typesense upsert or delete; anything approaching a minute means the cluster is unhealthy and the retry policy should take over."
}

variable "function_max_instances" {
  type        = number
  default     = 10
  description = "Cap on concurrent invocations. Workflows writes are low-volume (tens per day), so this exists to bound a runaway retry storm rather than to serve throughput."
}
