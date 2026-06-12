# Regional GKE Standard cluster on the Stable channel.
#
# CMEK: etcd application-layer secrets are encrypted with google_kms_crypto_key.etcd,
# node boot disks with google_kms_crypto_key.nodes (on the node pool), and the Typesense
# data persistent disks with google_kms_crypto_key.pd (via the StorageClass in typesense.tf).
# database_encryption + boot-disk keys can only be set at cluster/node-pool creation.
resource "google_container_cluster" "primary" {
  count    = local.workload_count
  name     = local.cluster_name
  location = var.region

  deletion_protection = false

  network    = "default"
  subnetwork = "default"

  # Node pools are managed separately below.
  remove_default_node_pool = true
  initial_node_count       = 1

  # Shielded GKE nodes.
  enable_shielded_nodes = true

  # The temporary default node pool created (and immediately removed) at cluster
  # creation must also satisfy constraints/compute.requireShieldedVm, so enable
  # Secure Boot here too — otherwise its nodes fail to come up and cluster
  # creation errors out before remove_default_node_pool can delete it.
  node_config {
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }

  release_channel {
    channel = "STABLE"
  }

  # CMEK for application-layer secrets stored in etcd.
  database_encryption {
    state    = "ENCRYPTED"
    key_name = google_kms_crypto_key.etcd.id
  }

  # Workload Identity lets the snapshot CronJob reach GCS without service-account keys.
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Gateway API lets the Typesense operator expose the service via HTTPRoute.
  gateway_api_config {
    channel = "CHANNEL_STANDARD"
  }

  # Metrics collection:
  #  - SYSTEM_COMPONENTS keeps GKE system metrics (kubernetes.io/{container,pod,node}/*)
  #    flowing — needed by the pod-restart alert and the per-pod disk/memory/CPU views.
  #    Setting monitoring_config WITHOUT enable_components silently disables these.
  #  - STATEFULSET + POD enable the GKE kube-state-metrics packages (kube_statefulset_*,
  #    kube_pod_*) — used by the "ready replicas < 3" alert/tile to surface a quorum member
  #    that is down while quorum still holds (which probe_success/quorum alerts don't catch).
  #  - managed_prometheus scrapes the Typesense sidecar + blackbox (metrics.tf).
  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS", "STATEFULSET", "POD"]
    managed_prometheus {
      enabled = true
    }
  }

  # Run node upgrades/repairs during an off-peak window.
  maintenance_policy {
    recurring_window {
      start_time = var.maintenance_start_time
      end_time   = var.maintenance_end_time
      recurrence = var.maintenance_recurrence
    }
  }

  ip_allocation_policy {}

  lifecycle {
    # The default node pool (and therefore this node_config) is removed right after
    # creation, after which GKE reports a fuller default node_config. Ignore that
    # drift so it never forces an in-place update or replacement of the cluster.
    ignore_changes = [node_config]
  }

  depends_on = [
    google_kms_crypto_key_iam_member.etcd,
  ]
}

resource "google_container_node_pool" "primary_nodes" {
  count    = local.workload_count
  name     = "${local.cluster_name}-np"
  cluster  = google_container_cluster.primary[0].name
  location = var.region

  # Regional node pool: node_count is PER ZONE, so the default of 1 yields 3 nodes
  # across the region's 3 zones — one schedulable node per Typesense quorum member.
  node_count = var.node_count_per_zone

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  network_config {
    enable_private_nodes = true
  }

  node_config {
    machine_type = var.node_machine_type

    # CMEK for node boot disks.
    boot_disk_kms_key = google_kms_crypto_key.nodes.id

    # Required by org policy constraints/compute.requireShieldedVm.
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    # Required for Workload Identity.
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    labels = {
      app = "typesense"
    }
  }

  depends_on = [
    google_kms_crypto_key_iam_member.nodes,
  ]
}
