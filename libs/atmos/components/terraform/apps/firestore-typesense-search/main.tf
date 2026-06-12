# =============================================================================
# firestore-typesense-search Firebase extension
#
# Installs the upstream `typesense/firestore-typesense-search` extension as a
# Cloud-Functions-v2 trigger pipeline that mirrors Firestore document changes
# into the Typesense cluster (managed by the sibling apps/typesense component).
#
# The four parallel-list params (FIRESTORE_COLLECTION_PATH, TYPESENSE_COLLECTION_NAME,
# FIRESTORE_COLLECTION_FIELDS, FLATTEN_NESTED_DOCUMENTS) are derived from a
# single var.collections list — this keeps the extension config in lockstep with
# the typesense collection schemas declared in libs/typesense/src/schemas/index.ts.
# 
# v2.1 of the extension can only sync a single collection schema per instance of
# the extension. Later versions allow the sync of multiple collection schema via 
# params FIRESTORE_COLLECTION_PATHS, TYPESENSE_COLLECTION_NAMES,
# FIRESTORE_COLLECTION_FIELDS_LIST, FLATTEN_NESTED_DOCUMENTS_LIST.
#
# Secret handling: TYPESENSE_API_KEY is a `secret`-typed param. We own the secret
# (and its current version) here; the value comes from the SOPS-encrypted file
# under secrets/<project_id>.enc.yaml. The Firebase Extensions service grants
# the per-instance service agent
# (`ext-${instance_id}@${project}.iam.gserviceaccount.com`) accessor on the
# secret automatically at install time.
#
# This is intentionally NOT the same key as the cluster bootstrap admin key
# managed by apps/typesense — that one is the operator's root credential. The
# extension uses a separately-minted Typesense API key with just the document
# write/delete actions it needs.
# =============================================================================

data "google_project" "this" {
  project_id = var.project_id
}

data "sops_file" "secrets" {
  source_file = "${path.module}/secrets/${var.project_id}.enc.yaml"
}

resource "google_secret_manager_secret" "typesense_api_key" {
  project   = var.project_id
  secret_id = var.typesense_api_key_secret_id

  # Org policy forbids `global`-region replication, so user-managed with explicit
  # US-only locations. Defaults to a single us-east1 replica (mirrors the existing
  # manually-created staging secret); override via var.secret_replication_locations.
  replication {
    user_managed {
      dynamic "replicas" {
        for_each = var.secret_replication_locations
        content {
          location = replicas.value
        }
      }
    }
  }
}

resource "google_secret_manager_secret_version" "typesense_api_key" {
  secret      = google_secret_manager_secret.typesense_api_key.id
  secret_data = data.sops_file.secrets.data["typesense_extension_api_key"]
}

# Grant the Firebase Extensions service agent permission to manage IAM on this
# secret. At install time the extensions service tries to add the per-instance SA
# (`ext-${instance_id}@${project}.iam.gserviceaccount.com`) as a secretAccessor;
# that grant requires getIamPolicy + setIamPolicy on the secret, which the agent
# does NOT get implicitly when the secret is TF-owned (the CLI install path
# grants this through a separate side-channel). Without this binding the
# extension instance create operation fails partway through with a
# "Permission 'secretmanager.secrets.getIamPolicy' denied" error.
resource "google_secret_manager_secret_iam_member" "firebasemods_admin" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.typesense_api_key.id
  role      = "roles/secretmanager.admin"
  member    = "serviceAccount:service-${data.google_project.this.number}@gcp-sa-firebasemods.iam.gserviceaccount.com"
}

locals {
  collection_paths       = join(",", [for c in var.collections : c.name])
  collection_names       = join(",", [for c in var.collections : c.name])
  collection_fields_list = join("|", [for c in var.collections : join(",", c.fields)])
  flatten_list           = join(",", [for c in var.collections : tostring(c.flatten_nested_documents)])

  # Bind to the exact TF-managed version (.name is the full resource path
  # `projects/<p>/secrets/<id>/versions/<n>`). When the SOPS-encrypted value
  # changes, a new SMSV is created and the extension is reconfigured to point
  # at it on the next apply.
  typesense_api_key_ref = google_secret_manager_secret_version.typesense_api_key.name
}

resource "google_firebase_extensions_instance" "search" {
  provider    = google-beta
  project     = var.project_id
  instance_id = var.extension_instance_id

  config {
    extension_ref = var.extension_ref

    params = {
      LOCATION                    = var.location
      DATABASE                    = var.firestore_database
      FIRESTORE_DATABASE          = var.firestore_database
      FIRESTORE_DATABASE_REGION   = var.firestore_database_location
      TYPESENSE_HOSTS             = var.typesense_host
      TYPESENSE_PORT              = tostring(var.typesense_port)
      TYPESENSE_PROTOCOL          = var.typesense_protocol
      TYPESENSE_API_KEY           = local.typesense_api_key_ref
      FIRESTORE_COLLECTION_PATH   = local.collection_paths
      TYPESENSE_COLLECTION_NAME   = local.collection_names
      FIRESTORE_COLLECTION_FIELDS = local.collection_fields_list
      FLATTEN_NESTED_DOCUMENTS    = local.flatten_list
      LOG_TYPESENSE_INSERTS       = var.log_typesense_inserts ? "Yes" : "No"
    }
  }

  depends_on = [
    google_secret_manager_secret_version.typesense_api_key,
    google_secret_manager_secret_iam_member.firebasemods_admin,
  ]
}
