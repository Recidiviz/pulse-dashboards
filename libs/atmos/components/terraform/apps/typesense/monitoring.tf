# Downtime detection: notification channels + uptime check + alert policies.

resource "google_monitoring_notification_channel" "email" {
  count        = local.monitoring_count
  display_name = "Typesense alerts (email)"
  type         = "email"
  labels = {
    email_address = var.monitoring.alert_email
  }
}

# Shared "PagerDuty Alert Forwarder": warning alerts publish to a Pub/Sub topic in the data-platform
# project, where a subscriber forwards them to PagerDuty. NOTE: this project's monitoring notification
# service agent (service-<num>@gcp-sa-monitoring-notification.iam.gserviceaccount.com) must have
# roles/pubsub.publisher on the topic — granted on the shared topic in recidiviz-123, not here.
resource "google_monitoring_notification_channel" "pagerduty_forwarder" {
  count        = local.monitoring_count
  display_name = "PagerDuty Alert Forwarder"
  type         = "pubsub"
  labels = {
    topic = var.monitoring.pagerduty_forwarder_topic
  }
}

locals {
  # Critical alerts page directly (PagerDuty integration) + email.
  # try() so the locals don't error in standby mode (the alert policies that
  # consume these are themselves count-gated, so the values are never read there).
  notification_channels = [
    try(google_monitoring_notification_channel.email[0].id, ""),
    try(google_monitoring_notification_channel.pagerduty_forwarder[0].id, ""),
  ]
  # Warnings: email + forwarded to PagerDuty via the shared forwarder topic.
  warning_channels = [
    try(google_monitoring_notification_channel.email[0].id, ""),
    try(google_monitoring_notification_channel.pagerduty_forwarder[0].id, ""),
  ]

  # Common user_labels merged into every alert policy below. These get shipped to
  # PagerDuty as `policy_user_labels` in the events-API payload regardless of what
  # the PromQL/threshold query returns for resource labels — so they're our
  # guaranteed channel for routing/context (project, region, service).
  base_user_labels = {
    service    = "typesense"
    project_id = var.project_id
    region     = var.region
  }
}

# Public uptime check against Typesense's /health endpoint.
resource "google_monitoring_uptime_check_config" "typesense" {
  count        = local.monitoring_count
  display_name = "typesense-${var.region}-health"
  timeout      = "10s"
  period       = "60s"
  # Log failed probes (status code / TLS / reset reasons) to Cloud Logging —
  # without this the only failure signal is the boolean check_passed metric.
  log_check_failures = true

  http_check {
    path           = "/health"
    port           = 443
    use_ssl        = true
    validate_ssl   = true
    request_method = "GET"
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.hostname
    }
  }
}

# 1) Endpoint down — the public /health uptime check is failing.
resource "google_monitoring_alert_policy" "endpoint_down" {
  count        = local.monitoring_count
  display_name = "Typesense endpoint down (${var.region})"
  combiner     = "OR"
  severity     = "CRITICAL"
  user_labels  = merge(local.base_user_labels, { severity = "critical" })

  conditions {
    display_name = "Typesense - Uptime check failing"
    condition_threshold {
      filter = join(" AND ", [
        "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\"",
        "resource.type=\"uptime_url\"",
        "metric.label.check_id=\"${google_monitoring_uptime_check_config.typesense[0].uptime_check_id}\"",
      ])
      # >2 of the 6 checker regions failing, sustained for ~3 consecutive 60s
      # probe cycles. A real outage fails all regions within one cycle, so this
      # doesn't slow detection; single-probe blips (which self-heal on the next
      # probe) can't satisfy the duration and no longer page.
      comparison      = "COMPARISON_GT"
      threshold_value = 2
      duration        = "180s"
      trigger {
        count = 1
      }
      aggregations {
        alignment_period     = "1200s"
        per_series_aligner   = "ALIGN_NEXT_OLDER"
        cross_series_reducer = "REDUCE_COUNT_FALSE"
        group_by_fields      = ["resource.label.host"]
      }
    }
  }

  notification_channels = local.notification_channels
}

# 2) Pods restarting — crashloop / instability in the Typesense namespace (warning).
resource "google_monitoring_alert_policy" "pod_restarts" {
  count        = local.monitoring_count
  display_name = "Typesense pods restarting (${var.region})"
  combiner     = "OR"
  severity     = "WARNING"
  user_labels  = merge(local.base_user_labels, { severity = "warning" })

  conditions {
    display_name = "Typesense - Elevated container restart rate"
    condition_threshold {
      filter = join(" AND ", [
        "resource.type=\"k8s_container\"",
        "resource.label.\"namespace_name\"=\"${local.typesense_namespace}\"",
        "metric.type=\"kubernetes.io/container/restart_count\"",
      ])
      comparison      = "COMPARISON_GT"
      threshold_value = 2
      duration        = "300s"
      trigger {
        count = 1
      }
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_DELTA"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.label.pod_name"]
      }
    }
  }

  notification_channels = local.warning_channels
}

# ---- PromQL (Google Managed Prometheus) alert policies ----
# These reference metrics scraped by metrics.tf. On a steady-state cluster the
# series already exist, so the policies create cleanly. On a brand-new / failed-over
# cluster the series don't exist until the exporter + blackbox probe have been
# scraped — set var.monitoring_enabled = false on the first apply and flip it to true
# once metrics are flowing (see variables.tf / RUNBOOK.md). Critical → both channels
# (page); warning → email only.

# 3) Quorum / health down — the blackbox probe of the healthcheck /readyz is failing.
resource "google_monitoring_alert_policy" "quorum_down" {
  count        = local.monitoring_count
  display_name = "Typesense quorum/health down (${var.region})"
  combiner     = "OR"
  severity     = "CRITICAL"
  user_labels  = merge(local.base_user_labels, { severity = "critical" })

  conditions {
    display_name = "probe_success == 0 for 3m"
    condition_prometheus_query_language {
      query               = "probe_success == 0"
      duration            = "180s"
      evaluation_interval = "60s"
    }
  }

  documentation {
    content = "The blackbox probe of the Typesense healthcheck /readyz is failing (quorum/cluster unhealthy). Does NOT fire if the probe series is absent — the endpoint-down uptime alert covers a fully-unreachable endpoint."
  }

  notification_channels = local.notification_channels
}

# 4) Disk usage high — per-pod PVC utilization across ALL nodes (guards against OUT_OF_DISK).
# Uses the GKE system metric (per pod), not the exporter's single-node system_disk view —
# requires SYSTEM_COMPONENTS metrics (enabled in cluster.tf). Fires if ANY pod's data volume
# exceeds the threshold. VERIFY: this matches every PVC volume in the namespace; if a non-data
# volume causes noise, scope with metric.label."volume_name".
resource "google_monitoring_alert_policy" "disk_high" {
  count        = local.monitoring_count
  display_name = "Typesense disk usage high (${var.region})"
  combiner     = "OR"
  severity     = "CRITICAL"
  user_labels  = merge(local.base_user_labels, { severity = "critical" })

  conditions {
    display_name = "Typesense - PVC utilization > ${var.monitoring.disk_alert_ratio} on any node for 10m"
    condition_threshold {
      filter = join(" AND ", [
        "resource.type=\"k8s_pod\"",
        "resource.label.\"namespace_name\"=\"${local.typesense_namespace}\"",
        "metric.type=\"kubernetes.io/pod/volume/utilization\"",
      ])
      comparison      = "COMPARISON_GT"
      threshold_value = var.monitoring.disk_alert_ratio
      duration        = "600s"
      trigger {
        count = 1
      }
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = local.notification_channels
}

# 5) Memory usage high — per-pod container memory vs its limit (predicts OOMKill), all nodes.
# Scoped to the "typesense" container (the 64Mi sidecars would otherwise trip it). Uses the GKE
# system metric — requires SYSTEM_COMPONENTS (enabled in cluster.tf) and a container memory limit
# (the StatefulSet sets 2Gi). OOMKills happen at the container limit, so this is the right signal.
resource "google_monitoring_alert_policy" "memory_high" {
  count        = local.monitoring_count
  display_name = "Typesense memory usage high (${var.region})"
  combiner     = "OR"
  severity     = "CRITICAL"
  user_labels  = merge(local.base_user_labels, { severity = "critical" })

  conditions {
    display_name = "Typesense - container mem/limit > ${var.monitoring.memory_alert_ratio} on any node for 10m"
    condition_threshold {
      filter = join(" AND ", [
        "resource.type=\"k8s_container\"",
        "resource.label.\"namespace_name\"=\"${local.typesense_namespace}\"",
        "resource.label.\"container_name\"=\"typesense\"",
        "metric.type=\"kubernetes.io/container/memory/limit_utilization\"",
      ])
      comparison      = "COMPARISON_GT"
      threshold_value = var.monitoring.memory_alert_ratio
      duration        = "600s"
      trigger {
        count = 1
      }
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = local.notification_channels
}

# 6) Requests overloaded — Typesense is rejecting requests (HTTP 503 overload).
resource "google_monitoring_alert_policy" "overloaded" {
  count        = local.monitoring_count
  display_name = "Typesense requests overloaded (${var.region})"
  combiner     = "OR"
  severity     = "WARNING"
  user_labels  = merge(local.base_user_labels, { severity = "warning" })

  conditions {
    display_name = "Typesense - overloaded requests/s > 0 for 5m"
    condition_prometheus_query_language {
      query               = "typesense_stats_overloaded_requests_per_second > 0"
      duration            = "300s"
      evaluation_interval = "60s"
    }
  }

  notification_channels = local.warning_channels
}

# 7) Write backlog — pending write batches building up (replication/write pressure).
resource "google_monitoring_alert_policy" "write_backlog" {
  count        = local.monitoring_count
  display_name = "Typesense write backlog (${var.region})"
  combiner     = "OR"
  severity     = "WARNING"
  user_labels  = merge(local.base_user_labels, { severity = "warning" })

  conditions {
    display_name = "pending write batches > ${var.monitoring.pending_writes_alert} for 10m"
    condition_prometheus_query_language {
      query               = "typesense_stats_pending_write_batches > ${var.monitoring.pending_writes_alert}"
      duration            = "600s"
      evaluation_interval = "60s"
    }
  }

  notification_channels = local.warning_channels
}

# 8) Search latency high — performance SLO.
resource "google_monitoring_alert_policy" "search_latency" {
  count        = local.monitoring_count
  display_name = "Typesense search latency high (${var.region})"
  combiner     = "OR"
  severity     = "WARNING"
  user_labels  = merge(local.base_user_labels, { severity = "warning" })

  conditions {
    display_name = "Typesense - search latency > ${var.monitoring.search_latency_alert_ms}ms for 10m"
    condition_prometheus_query_language {
      query               = "typesense_stats_search_latency_ms > ${var.monitoring.search_latency_alert_ms}"
      duration            = "600s"
      evaluation_interval = "60s"
    }
  }

  notification_channels = local.warning_channels
}

# 9) Replicas degraded — a quorum member is down while quorum still holds (early warning).
# Sourced from the GKE kube-state-metrics STATEFULSET package (enabled in cluster.tf). This is the
# gap probe_success/quorum can't see: at 2/3 the cluster still reports QuorumReady, so nothing else
# fires. VERIFY metric/label names once the package is scraping (standard kube-state-metrics names).
resource "google_monitoring_alert_policy" "replicas_degraded" {
  count        = local.monitoring_count
  display_name = "Typesense replicas degraded (${var.region})"
  combiner     = "OR"
  severity     = "WARNING"
  user_labels  = merge(local.base_user_labels, { severity = "warning" })

  conditions {
    display_name = "Typesense - ready StatefulSet replicas < 3 for 10m"
    condition_prometheus_query_language {
      # 3 = the TypesenseCluster replica count (typesense.tf). typesense-sts = operator StatefulSet name.
      # `max by (...)` preserves the GMP-projected PromQL labels so the alert payload carries
      # `resource.labels` (cluster/location/namespace) — bare `max(...)` strips everything and leaves
      # PagerDuty with `resource: {labels: {}}` / `resource_name: "__missing__"`.
      query               = "max by (cluster, location, namespace, statefulset) (kube_statefulset_status_replicas_ready{namespace=\"${local.typesense_namespace}\", statefulset=\"typesense-sts\"}) < 3"
      duration            = "600s"
      evaluation_interval = "60s"
    }
  }

  documentation {
    content = "Fewer than 3 Typesense StatefulSet pods are Ready. Quorum still holds at 2/3 (so probe_success stays green) — one more failure means an outage. Common cause: a pod stuck Pending from a zonal-PV / zone-spread collision after a node-pool change. See RUNBOOK.md."
  }

  notification_channels = local.warning_channels
}
