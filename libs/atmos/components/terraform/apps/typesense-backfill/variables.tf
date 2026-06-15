variable "project_id" {
  type        = string
  description = "GCP project hosting Firestore + the Typesense API key secret + this function."
}

variable "region" {
  type        = string
  default     = "us-east1"
  description = "Cloud Functions v2 region. Match the firestore-typesense-search extension's region so traffic stays local."
}

variable "function_name" {
  type        = string
  default     = "typesense-backfill"
  description = "Cloud Function name. Used in the deployed function URL and SA prefix."
}

variable "typesense_host" {
  type        = string
  description = "Public hostname of the Typesense cluster (e.g. typesense-staging.recidiviz.org)."
}

variable "typesense_port" {
  type        = number
  default     = 443
  description = "Typesense TLS port. Match the LB listener on apps/typesense."
}

variable "typesense_protocol" {
  type        = string
  default     = "https"
  description = "Typesense protocol. Match the LB listener on apps/typesense."
}

variable "typesense_api_key_secret_id" {
  type        = string
  default     = "ext-firestore-typesense-search-TYPESENSE_API_KEY"
  description = <<-EOT
    Secret Manager secret ID of the Typesense write-scoped API key. Defaults to the same secret
    managed by apps/firestore-typesense-search — both jobs need identical scope, so we reuse one
    rather than rotating two in parallel. Only grants the backfill SA accessor on it; the secret
    itself is still owned by the sibling component.
  EOT
}

variable "firestore_database" {
  type        = string
  default     = "(default)"
  description = "Firestore database name. `(default)` is the project's default DB."
}

variable "collections" {
  type = list(object({
    name   = string
    fields = list(string)
  }))
  description = <<-EOT
    Collections to backfill. Mirror libs/@typesense/client/src/schemas/index.ts — keep in sync.
    Each entry's `fields` list determines which Firestore document fields are forwarded to Typesense
    (any other fields are dropped before import). The collection's Typesense schema MUST exist before
    backfill runs (provisioned by `nx provision '@typesense/tools' -c <env>`).
  EOT
}

variable "function_memory" {
  type        = string
  default     = "1Gi"
  description = "Memory allocated to the function. 1Gi gives Firestore client + Typesense batches comfortable headroom."
}

variable "function_timeout_seconds" {
  type        = number
  default     = 3600
  description = "Cloud Functions v2 max is 3600 (60 min). Daily backfill across 5 collections of ~10k docs each finishes well under this."
}

variable "function_max_instances" {
  type        = number
  default     = 1
  description = "Cap concurrent invocations. 1 prevents overlapping backfills (a manual trigger during a scheduled run shouldn't fan out)."
}
