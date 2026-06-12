variable "project_id" {
  type        = string
  description = "The GCP project hosting the Firestore database + Firebase extension."
}

variable "extension_instance_id" {
  type        = string
  default     = "firestore-typesense-search"
  description = "Instance ID for the Firebase extension installation. Defaults to the publisher's canonical name."
}

variable "extension_ref" {
  type        = string
  default     = "typesense/firestore-typesense-search@2.1.0"
  description = "Pinned extension reference (publisher/name@version) from the Firebase Extensions marketplace."
}

variable "location" {
  type        = string
  description = "Cloud Functions v2 region for the extension's triggers (e.g. us-east1). Should sit close to the Firestore database region."
}

variable "firestore_database_location" {
  type        = string
  description = <<-EOT
    Location the project's Firestore database lives in. Can be a single region (e.g. us-east1 for staging)
    OR a multi-region (e.g. nam5 for production) — matches GCP's `location_id` field on Firestore.
    MUST match the existing Firestore configuration — the extension registers Eventarc triggers against this
    location, and a mismatch prevents the document-change triggers from firing.
  EOT
}

variable "firestore_database" {
  type        = string
  default     = "(default)"
  description = "Firestore database name. `(default)` is the project's default database; override only if you're using a named secondary database."
}

variable "log_typesense_inserts" {
  type        = bool
  default     = false
  description = "Toggle the extension's verbose insert-logging. Useful for debugging extension sync failures; should stay off in production."
}

variable "typesense_host" {
  type        = string
  description = "Public hostname of the Typesense cluster (e.g. typesense-staging.recidiviz.org). Mirrors var.hostname on the sibling apps/typesense component."
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
    Secret Manager secret ID for the Typesense API key the extension uses to upsert/delete documents.
    Default matches the name the Firebase Extensions CLI would generate (`ext-<instance>-<PARAM>`),
    which keeps tooling round-trip-compatible.

    The secret value comes from the SOPS-encrypted file at `secrets/<project_id>.enc.yaml` under
    the key `typesense_extension_api_key`. This is a SEPARATE key from the cluster bootstrap admin
    key managed by the sibling apps/typesense component — it should be a Typesense API key
    minted via the cluster's `/keys` endpoint with only the document write/delete actions the
    extension needs.
  EOT
}

variable "secret_replication_locations" {
  type        = list(string)
  default     = ["us-east1"]
  description = <<-EOT
    User-managed replication regions for the API-key secret. Org policy forbids `global` replication
    so this list must be non-empty and US-only. Default mirrors the existing manually-created secret
    in staging; production can override (e.g. add a second region for multi-region durability).
  EOT
}

variable "collections" {
  type = list(object({
    name                     = string
    fields                   = list(string)
    flatten_nested_documents = optional(bool, false)
  }))
  description = <<-EOT
    Collection bindings driving the extension's four parallel-list params:
      - FIRESTORE_COLLECTION_PATHS         (name, joined with `,`)
      - TYPESENSE_COLLECTION_NAMES         (name, joined with `,`)
      - FIRESTORE_COLLECTION_FIELDS_LIST   (fields per collection, comma-joined within, pipe-separated between)
      - FLATTEN_NESTED_DOCUMENTS_LIST      (flatten flag per collection, joined with `,`)

    Mirror the schemas declared in libs/typesense/src/schemas/index.ts — keep in sync.
  EOT
}
