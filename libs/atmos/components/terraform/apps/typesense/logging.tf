# =============================================================================
# Access + search logging, streamed to stdout (Cloud Logging).
#
# Typesense only writes typesense-access.log (API requests + IPs) and the search
# query log (typesense.log) when --log-dir is set, and the moment --log-dir is set
# the normal log ALSO moves from stdout into typesense.log. So both features are
# inherently file-based — nothing reaches stdout on its own.
#
# The TyKO operator (chart 0.4.x) builds the StatefulSet itself: the typesense-server
# container uses the image's default entrypoint (no command/args override) and the
# only sidecars are the operator's own (metrics-exporter, healthcheck). There is no
# extraContainers / sidecars field, so we cannot add a `tail` sidecar inside the
# operator-managed pod, and a StatefulSet patch would be reverted on the next
# reconcile.
#
# Approach instead:
#   1. additionalServerConfiguration ConfigMap (mounted by the operator via envFrom)
#      enables both logging flags and points --log-dir at the data-dir, which lives
#      on the per-pod PVC.
#   2. One small follower Deployment per replica, co-located on the same node as its
#      typesense pod (podAffinity) and mounting that pod's PVC read-only, runs
#      `tail -F` on both files so they land in the follower's stdout → Cloud Logging.
#
# The PVCs are ReadWriteOnce (storage.accessMode in typesense.tf), so a second reader
# is only possible on the SAME node as the writer — hence the required podAffinity.
# RWO (not ReadWriteOncePod) permits multiple pods per node to mount the same volume.
#
# VERIFY-AGAINST-OPERATOR (see typesense.tf header): after the first apply confirm
#   - the operator mounts additionalServerConfiguration via `envFrom` (so these become
#     TYPESENSE_* env vars on typesense-server):  kubectl -n typesense get sts typesense-sts -o yaml | grep -A3 envFrom
#   - the per-pod PVC names are data-typesense-sts-<ordinal>:  kubectl -n typesense get pvc
#   - the data-dir mountPath is /usr/share/typesense/data (TYPESENSE_DATA_DIR)
#   - the pod-name label is statefulset.kubernetes.io/pod-name=typesense-sts-<ordinal>
# =============================================================================

locals {
  # The operator names the StatefulSet "<cluster>-sts" and its volumeClaimTemplate
  # "data", so PVCs are data-<sts>-<ordinal>. The cluster CR is named "typesense".
  typesense_sts_name = "typesense-sts"

  # Typesense's data-dir on the PVC (TYPESENSE_DATA_DIR set by the operator). We log
  # into the data-dir root rather than a subdir because the operator gives us no way
  # to create a subdir before typesense starts, but the data-dir is guaranteed to
  # exist and be writable. The two log files land alongside the RocksDB data.
  typesense_log_dir = "/usr/share/typesense/data"

  # Extra server flags the operator injects as TYPESENSE_* env vars
  # These should only be flags which are not supported by the operator's settings
  typesense_server_config = {
    TYPESENSE_LOG_DIR               = local.typesense_log_dir
    TYPESENSE_ENABLE_ACCESS_LOGGING = "true"
    TYPESENSE_ENABLE_SEARCH_LOGGING = "true"
  }

  typesense_server_config_hash = substr(sha256(jsonencode(local.typesense_server_config)), 0, 8)
}

# Extra server config environment variables that the operator mounts onto typesense-server
resource "kubernetes_config_map" "typesense_configuration" {
  count = local.workload_count
  metadata {
    # Use a content hash so that changing any flag produces a new ConfigMap —
    # forcing the operator to roll the StatefulSet so pods pick up the change.
    name      = "typesense-config-${local.typesense_server_config_hash}"
    namespace = kubernetes_namespace.typesense[0].metadata[0].name
  }
  data = local.typesense_server_config

  lifecycle {
    # create_before_destroy keeps the new ConfigMap present before the old one is removed,
    # so the operator never briefly references a deleted ConfigMap during the swap.
    create_before_destroy = true
  }
}

# One follower per replica. Each pins itself to the node running its matching
# typesense pod and tails that pod's log files from the shared PVC.
resource "kubernetes_deployment" "typesense_log_follower" {
  count = local.workload_count == 0 ? 0 : local.replica_count

  metadata {
    name      = "typesense-log-follower-${count.index}"
    namespace = kubernetes_namespace.typesense[0].metadata[0].name
    labels = {
      app     = "typesense-log-follower"
      ordinal = tostring(count.index)
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        app     = "typesense-log-follower"
        ordinal = tostring(count.index)
      }
    }

    template {
      metadata {
        labels = {
          app     = "typesense-log-follower"
          ordinal = tostring(count.index)
        }
      }

      spec {
        # Co-locate on the node running typesense-sts-<ordinal> — required because the
        # PVC is ReadWriteOnce and can only be mounted by pods on the disk's node.
        affinity {
          pod_affinity {
            required_during_scheduling_ignored_during_execution {
              topology_key = "kubernetes.io/hostname"
              label_selector {
                match_labels = {
                  "statefulset.kubernetes.io/pod-name" = "${local.typesense_sts_name}-${count.index}"
                }
              }
            }
          }
        }

        # The log files are owned by typesense's runtime user; run as root so the
        # follower can read them regardless of their mode. (Read-only mount below.)
        security_context {
          run_as_user = 0
        }

        container {
          name  = "tail"
          image = "busybox:1.37"

          # tail -F retries on missing/rotated files, so it tolerates the gap before
          # typesense first writes each file. -n +1 replays from the top on (re)start.
          command = ["/bin/sh", "-c"]
          args = [
            "exec tail -n +1 -F ${local.typesense_log_dir}/typesense.log ${local.typesense_log_dir}/typesense-access.log",
          ]

          volume_mount {
            name       = "data"
            mount_path = local.typesense_log_dir
            read_only  = true
          }

          resources {
            requests = {
              cpu    = "10m"
              memory = "16Mi"
            }
            limits = {
              memory = "64Mi"
            }
          }
        }

        volume {
          name = "data"
          persistent_volume_claim {
            claim_name = "data-${local.typesense_sts_name}-${count.index}"
            read_only  = true
          }
        }
      }
    }
  }

  # PVCs only exist once the operator's StatefulSet has provisioned its pods.
  depends_on = [kubectl_manifest.typesense_cluster]
}
