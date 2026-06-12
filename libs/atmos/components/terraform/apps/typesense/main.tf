locals {
  cluster_name        = "typesense-${var.region}"
  typesense_namespace = "typesense"
  operator_namespace  = "typesense-system"

  # Count expression used by every workload-shape resource (cluster, k8s/helm/kubectl
  # resources, monitoring, exposure-LB, snapshot/compact CronJobs). When mode = "standby"
  # this evaluates to 0 and those resources are skipped — only the supporting-infra
  # resources (KMS, IP, snapshot bucket, cert DNS auth, VPC NAT) get created.
  workload_count = var.mode == "primary" ? 1 : 0

  # Count expression for the monitoring/alerting resources (monitoring.tf, dashboard.tf).
  # Gated on workload_count AND var.monitoring_enabled so a fresh/failed-over cluster can be
  # brought up first (monitoring_enabled = false) and the alert policies enabled on a second
  # apply once the operator's metrics are actually flowing — the GMP-backed policies reference
  # series that don't exist until the exporter/blackbox probe have been scraped. See variables.tf.
  monitoring_count = local.workload_count == 1 && var.monitoring_enabled ? 1 : 0

  # Raft quorum size. Single source of truth for the TypesenseCluster spec.replicas
  # and the per-replica log-follower Deployments (logging.tf), which key off the
  # operator's per-pod PVCs (data-typesense-sts-<ordinal>).
  replica_count = 3
}

data "google_client_config" "default" {}

data "google_project" "this" {
  project_id = var.project_id
}
