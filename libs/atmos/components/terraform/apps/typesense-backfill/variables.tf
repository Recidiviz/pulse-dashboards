variable "project_id" {
  type        = string
  description = "GCP project hosting Firestore + the Typesense API key secret + this function."
}

variable "workspace_root" {
  type        = string
  description = <<-EOT
    Absolute path to the nx workspace root. Used to locate the build output
    at $${workspace_root}/dist/apps/@typesense/backfill-fn so the TF file
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
    error_message = "workspace_root must be an absolute path. Either invoke via `nx deploy '@typesense/backfill-fn' -c <env>`, or `export NX_WORKSPACE_ROOT=<repo-root>` before running atmos directly."
  }
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
  default     = "4Gi"
  description = "Memory allocated to the function. Bumped from 1Gi, which pegged (and OOM-restarted the instance) during a full backfill — concurrent collections each buffer a page of docs plus the Typesense client/Firestore SDK overhead. Raise further if the memory metric still tops out."
}

variable "function_cpu" {
  type        = string
  default     = "2"
  description = "vCPUs allocated to the function. Cloud Run defaults to 1 at this memory; 2 gives the concurrent (rate-limited) collection workers headroom to project/serialize batches without pegging CPU. Must satisfy Cloud Run's CPU/memory pairing rules (e.g. 4 CPU needs >=2Gi)."
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

variable "backfill_concurrency" {
  type        = number
  default     = 6
  description = "How many collections backfill concurrently. Provides overlap so a large collection's slow tail runs alongside the others; the import rate itself is bounded by backfill_import_rate_per_sec, not by this."
}

variable "backfill_import_rate_per_sec" {
  type        = number
  default     = 40
  description = "Global cap on Typesense import requests/sec across all concurrent collections. Now that the function's static egress IP is allowlisted past Cloud Armor, this protects the SHARED Typesense cluster (same nodes serve live search) rather than dodging the per-IP 429 ceiling. Set to 0 to disable limiting entirely (e.g. a staging run with no live traffic). Note: with a large backfill_batch_size the request rate is naturally low, so this rarely binds."
}

variable "backfill_batch_size" {
  type        = number
  default     = 4000
  description = "Firestore page size = Typesense import batch size. Pagination is serial within a collection, so for large collections (e.g. clients) the round-trip count dominates wall-clock — bigger batches mean fewer round trips and a much faster backfill. Bounded by function_memory (a page of docs is held in memory). This, not the rate limit, is the lever for single-collection speed."
}

# -----------------------------------------------------------------------------
# Static egress (so the typesense Cloud Armor policy can allowlist this function)
# -----------------------------------------------------------------------------

variable "static_egress_enabled" {
  type        = bool
  default     = false
  description = "Route ALL function egress through a Serverless VPC connector + Cloud NAT so outbound traffic uses a reserved static IP (the egress_ip output). Enable so the typesense Cloud Armor policy can allowlist the backfill past its per-IP rate limit. When false, the function uses the shared Google egress pool and is subject to the rate limit."
}

variable "egress_subnet_cidr" {
  type        = string
  default     = "10.124.0.0/28"
  description = "The /28 the Serverless VPC Access connector owns in the dedicated egress network. Must be a /28. Any private range works since the egress network is isolated; just avoid a range you might later peer with overlapping CIDRs."
}

variable "connector_machine_type" {
  type        = string
  default     = "e2-micro"
  description = "Serverless VPC Access connector machine type. e2-micro is sufficient for the backfill's modest throughput."
}

variable "connector_min_instances" {
  type        = number
  default     = 2
  description = "Connector minimum instances. GCP's floor is 2."
}

variable "connector_max_instances" {
  type        = number
  default     = 3
  description = "Connector maximum instances. Must be greater than connector_min_instances. 3 is ample for this workload."
}
