# Disaster recovery and routine maintenance.
#
# In addition, this file defines two CronJobs that run inside the cluster:
#
#   1. typesense-snapshot — every 6h, ships a Raft snapshot of the leader pod
#      to a CMEK-encrypted GCS bucket for fast local recovery.
#   2. typesense-compact  — daily at 03:00 US/Central, runs /operations/db/compact
#      on each Typesense node to keep RocksDB on-disk size and read latency in check.
#
# Regional DR: see RUNBOOK.md "Regional outages". The `*--secondary` component uses
# var.mode = "standby" to idle the supporting infra here (KMS, snapshot bucket,
# GSA, WI binding) in another region; failover is a stack-file flip to
# mode = "primary" and apply.

locals {
  snapshotter_ksa = "typesense-snapshotter"
}

# the snapshot/ops workloads impersonate via Workload Identity (no SA keys).
resource "google_service_account" "snapshotter" {
  account_id   = "typesense-${var.region}-snap"
  display_name = "Typesense snapshot uploader (${var.region})"
}

resource "google_service_account_iam_member" "snapshotter_wi" {
  service_account_id = google_service_account.snapshotter.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${local.typesense_namespace}/${local.snapshotter_ksa}]"
}

# ---- Snapshots (multi-region storage for regional-DR readability) ----
#
# The snapshot bucket + its KMS key are deliberately multi-region ("US" / "us"):
# the whole point of these backups is regional DR, so they have to remain
# readable when the bucket's home region is the thing that went down. A
# regional bucket co-located with the cluster fails closed in exactly the
# scenario it was meant to mitigate.
#
# Bucket name still carries var.region so each stack (primary, standby) owns
# its own bucket — no cross-stack adoption complexity. On failover, the
# old-primary bucket stays globally reachable, so the failover operator can
# `gcloud storage cp` the latest snapshot to the new primary's bucket and
# do a snapshot-based restore instead of a full reindex (see RUNBOOK).

# Multi-region key ring for the snapshot crypto key. Separate from the
# regional google_kms_key_ring.typesense in kms.tf (which holds the
# etcd/nodes/pd keys — those MUST be co-located with the regional GKE cluster).
resource "google_kms_key_ring" "snapshots" {
  project  = var.project_id
  name     = "typesense-${var.region}-snapshots"
  location = "us"
}

resource "google_kms_crypto_key" "gcs" {
  name            = "typesense-snapshots"
  key_ring        = google_kms_key_ring.snapshots.id
  purpose         = "ENCRYPT_DECRYPT"
  rotation_period = var.kms_rotation_period
}

resource "google_kms_crypto_key_iam_member" "gcs" {
  crypto_key_id = google_kms_crypto_key.gcs.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:service-${data.google_project.this.number}@gs-project-accounts.iam.gserviceaccount.com"
}

resource "google_storage_bucket" "snapshots" {
  name                        = "${var.project_id}-typesense-snapshots-${var.region}"
  location                    = "US"
  uniform_bucket_level_access = true
  force_destroy               = false

  versioning {
    enabled = true
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.gcs.id
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }

  depends_on = [google_kms_crypto_key_iam_member.gcs]
}

resource "google_storage_bucket_iam_member" "snapshotter" {
  bucket = google_storage_bucket.snapshots.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.snapshotter.email}"
}

# Bind the google service account permissions to the kubernetes service account.
# Gated on var.mode — only the GSA + WI binding above live in standby (so the
# bucket is writable from a future cluster once promoted); the KSA + RBAC + CronJobs
# only exist when a cluster does.
resource "kubernetes_service_account" "snapshotter" {
  count = local.workload_count
  metadata {
    name      = local.snapshotter_ksa
    namespace = kubernetes_namespace.typesense[0].metadata[0].name
    annotations = {
      "iam.gke.io/gcp-service-account" = google_service_account.snapshotter.email
    }
  }
}

# RBAC for the snapshotter KSA: it needs to discover the leader and exec `tar`
# in the Typesense container. Namespaced; scoped to the typesense namespace only.
resource "kubernetes_role" "snapshotter_exec" {
  count = local.workload_count
  metadata {
    name      = "typesense-snapshotter-exec"
    namespace = kubernetes_namespace.typesense[0].metadata[0].name
  }
  rule {
    api_groups = [""]
    resources  = ["pods"]
    verbs      = ["get", "list"]
  }
  rule {
    api_groups = [""]
    resources  = ["pods/exec"]
    verbs      = ["create"]
  }
}

resource "kubernetes_role_binding" "snapshotter_exec" {
  count = local.workload_count
  metadata {
    name      = "typesense-snapshotter-exec"
    namespace = kubernetes_namespace.typesense[0].metadata[0].name
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role.snapshotter_exec[0].metadata[0].name
  }
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.snapshotter[0].metadata[0].name
    namespace = kubernetes_namespace.typesense[0].metadata[0].name
  }
}

resource "kubernetes_cron_job_v1" "snapshot" {
  count = local.workload_count
  metadata {
    name      = "typesense-snapshot"
    namespace = kubernetes_namespace.typesense[0].metadata[0].name
  }
  spec {
    schedule                      = var.snapshot_schedule
    concurrency_policy            = "Forbid"
    successful_jobs_history_limit = 3
    failed_jobs_history_limit     = 3

    job_template {
      metadata {}
      spec {
        backoff_limit           = 1
        active_deadline_seconds = 1800
        template {
          metadata {}
          spec {
            service_account_name = kubernetes_service_account.snapshotter[0].metadata[0].name
            restart_policy       = "Never"
            container {
              name = "snapshot"
              # `:stable` and `:slim` don't include kubectl — use the component-based
              # tag (debian + all components pre-installed: kubectl, python, gsutil, …).
              image   = "google/cloud-sdk:570.0.0-debian_component_based"
              command = ["/bin/bash", "-c"]
              args = [
                <<-EOT
                set -euo pipefail
                NS=${local.typesense_namespace}
                TS=$(date -u +%Y%m%dT%H%M%SZ)
                SNAP_DIR="/usr/share/typesense/data/snapshots/$${TS}"

                # The typesense container (ubuntu:22.04 + ca-certificates) ships no curl,
                # so HTTP calls run from THIS cron pod against each pod's headless-service
                # DNS. kubectl exec is reserved for `tar` and `rm`, which are in the
                # ubuntu base.

                # 1. Find the leader via /debug. Typesense returns state as a braft enum
                #    (1=LEADER, 2=TRANSFERRING, 3=CANDIDATE, 4=FOLLOWER, ...).
                #    Retry through an election. Only consider Running pods.
                PODS=$(kubectl -n "$${NS}" get pods -l app=typesense-sts \
                  --field-selector=status.phase=Running \
                  -o jsonpath='{.items[*].metadata.name}')
                echo "running typesense pods: $${PODS}"
                if [ -z "$${PODS}" ]; then
                  echo "no Running typesense pods" >&2; exit 1
                fi

                LEADER=
                for attempt in 1 2 3 4 5; do
                  for P in $${PODS}; do
                    URL="http://$${P}.typesense-sts-svc.$${NS}.svc.cluster.local:8108/debug"
                    DEBUG_OUT=$(curl -sf -H "X-TYPESENSE-API-KEY: $${TYPESENSE_API_KEY}" "$${URL}") \
                      || { echo "  $${P}: /debug request failed"; continue; }
                    STATE=$(echo "$${DEBUG_OUT}" \
                      | sed -n 's/.*"state"[[:space:]]*:[[:space:]]*\([0-9]\+\).*/\1/p')
                    echo "  $${P}: state=$${STATE:-?} raw=$${DEBUG_OUT}"
                    if [ "$${STATE}" = "1" ]; then LEADER="$${P}"; break 2; fi
                  done
                  echo "attempt $${attempt}: no leader yet; sleeping 5s"
                  sleep 5
                done
                if [ -z "$${LEADER}" ]; then
                  echo "no Typesense leader found after retries" >&2
                  exit 1
                fi
                echo "leader: $${LEADER}; snapshot path: $${SNAP_DIR}"

                # 2. Trigger the snapshot on the leader directly (no Service round-robin).
                #    Surface HTTP errors with the response body instead of dying silently.
                echo "triggering snapshot on $${LEADER} ..."
                SNAP_URL="http://$${LEADER}.typesense-sts-svc.$${NS}.svc.cluster.local:8108/operations/snapshot?snapshot_path=$${SNAP_DIR}"
                HTTP_BODY=$(mktemp)
                HTTP_CODE=$(curl -sS -X POST -o "$${HTTP_BODY}" -w '%%{http_code}' \
                  -H "X-TYPESENSE-API-KEY: $${TYPESENSE_API_KEY}" "$${SNAP_URL}")
                echo "  http $${HTTP_CODE}: $(cat "$${HTTP_BODY}")"
                if [ "$${HTTP_CODE}" != "200" ] && [ "$${HTTP_CODE}" != "201" ]; then
                  echo "snapshot API call failed" >&2; exit 1
                fi
                rm -f "$${HTTP_BODY}"

                # 3. Stream the snapshot out of the leader (tar is in the ubuntu base).
                echo "streaming snapshot to gs://${google_storage_bucket.snapshots.name}/typesense-$${TS}.tar.gz ..."
                kubectl -n "$${NS}" exec "$${LEADER}" -c typesense -- \
                  tar -C /usr/share/typesense/data/snapshots -czf - "$${TS}" \
                  | gcloud storage cp - "gs://${google_storage_bucket.snapshots.name}/typesense-$${TS}.tar.gz"
                gcloud storage ls -L "gs://${google_storage_bucket.snapshots.name}/typesense-$${TS}.tar.gz" \
                  | grep -E 'Content-Length|Storage class' || true

                # 4. Free the snapshot from the leader's data PVC.
                echo "cleaning up $${SNAP_DIR} on $${LEADER} ..."
                kubectl -n "$${NS}" exec "$${LEADER}" -c typesense -- rm -rf "$${SNAP_DIR}"
                echo "snapshot complete: gs://${google_storage_bucket.snapshots.name}/typesense-$${TS}.tar.gz"
                EOT
              ]
              env {
                name = "TYPESENSE_API_KEY"
                value_from {
                  secret_key_ref {
                    name = kubernetes_secret.typesense_admin_api_key[0].metadata[0].name
                    key  = "typesense-api-key"
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  # Ensure RBAC exists before the first scheduled run.
  depends_on = [kubernetes_role_binding.snapshotter_exec]
}

# ---- Daily RocksDB compaction ----
#
# /operations/db/compact runs locally on whichever node receives the request
# (verified from upstream source: requires_leader=false, calls store->compact_all()),
# so the job fans out a plain HTTP POST to each pod via the headless StatefulSet
# service. Pod discovery uses the snapshotter KSA's `pods get/list` permission so
# we only compact Running members — a Pending/Failed pod is skipped, not fatal.
resource "kubernetes_cron_job_v1" "compact" {
  count = local.workload_count
  metadata {
    name      = "typesense-compact"
    namespace = kubernetes_namespace.typesense[0].metadata[0].name
  }
  spec {
    schedule                      = var.compact_schedule
    concurrency_policy            = "Forbid"
    successful_jobs_history_limit = 3
    failed_jobs_history_limit     = 3

    job_template {
      metadata {}
      spec {
        backoff_limit           = 1
        active_deadline_seconds = 3600
        template {
          metadata {}
          spec {
            service_account_name = kubernetes_service_account.snapshotter[0].metadata[0].name
            restart_policy       = "Never"
            container {
              name = "compact"
              # Needs kubectl (for pod discovery) + curl, so use the same component-based
              # gcloud image as the snapshot job rather than a curl-only one.
              image   = "google/cloud-sdk:570.0.0-debian_component_based"
              command = ["/bin/bash", "-c"]
              args = [
                <<-EOT
                set -euo pipefail
                NS=${local.typesense_namespace}
                PODS=$(kubectl -n "$${NS}" get pods -l app=typesense-sts \
                  --field-selector=status.phase=Running \
                  -o jsonpath='{.items[*].metadata.name}')
                echo "running typesense pods: $${PODS}"
                if [ -z "$${PODS}" ]; then
                  echo "no Running typesense pods" >&2; exit 1
                fi
                for P in $${PODS}; do
                  URL="http://$${P}.typesense-sts-svc.$${NS}.svc.cluster.local:8108/operations/db/compact"
                  echo "compacting $${P}"
                  curl -fsS -X POST --max-time 1800 \
                    -H "X-TYPESENSE-API-KEY: $${TYPESENSE_API_KEY}" "$${URL}"
                  echo
                done
                EOT
              ]
              env {
                name = "TYPESENSE_API_KEY"
                value_from {
                  secret_key_ref {
                    name = kubernetes_secret.typesense_admin_api_key[0].metadata[0].name
                    key  = "typesense-api-key"
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  depends_on = [kubernetes_role_binding.snapshotter_exec]
}
