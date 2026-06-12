# Cloud Monitoring dashboard for Typesense. Tiles use PromQL (prometheusQuery) for the
# GMP-ingested exporter/blackbox metrics, and timeSeriesFilter for the two native metrics
# (uptime check, pod restarts). Mosaic layout, 12 columns, tiles 6 wide x 4 tall.
resource "google_monitoring_dashboard" "typesense" {
  count = local.monitoring_count
  dashboard_json = jsonencode({
    displayName = "Typesense (${var.region})"
    mosaicLayout = {
      columns = 12
      tiles = [
        # Row 0 — at-a-glance health gauges.
        {
          xPos = 0, yPos = 0, width = 6, height = 4
          widget = {
            title = "Cluster health (probe_success: 1=healthy, 0=down)"
            scorecard = {
              timeSeriesQuery = { prometheusQuery = "min(probe_success)" }
              gaugeView       = { lowerBound = 0.0, upperBound = 1.0 }
            }
          }
        },
        {
          xPos = 6, yPos = 0, width = 6, height = 4
          widget = {
            # Ready quorum members (want 3). Drops to 2 when a member is down-but-quorum-holding —
            # the state probe_success/quorum alerts miss. From the kube-state STATEFULSET package.
            title = "Ready replicas (want 3)"
            scorecard = {
              timeSeriesQuery = { prometheusQuery = "max(kube_statefulset_status_replicas_ready{namespace=\"${local.typesense_namespace}\", statefulset=\"typesense-sts\"})" }
              gaugeView       = { lowerBound = 0.0, upperBound = 3.0 }
            }
          }
        },
        # Row 1 — infra health timelines (uptime + pod restarts).
        {
          xPos = 0, yPos = 4, width = 6, height = 4
          widget = {
            title = "Public endpoint uptime (/health)"
            xyChart = {
              dataSets = [{
                plotType = "LINE"
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter      = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" resource.type=\"uptime_url\""
                    aggregation = { alignmentPeriod = "300s", perSeriesAligner = "ALIGN_FRACTION_TRUE" }
                  }
                }
              }]
            }
          }
        },
        {
          xPos = 6, yPos = 4, width = 6, height = 4
          widget = {
            title = "Pod restarts (typesense namespace)"
            xyChart = {
              dataSets = [{
                plotType = "LINE"
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter      = "metric.type=\"kubernetes.io/container/restart_count\" resource.type=\"k8s_container\" resource.label.\"namespace_name\"=\"${local.typesense_namespace}\""
                    aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_DELTA", crossSeriesReducer = "REDUCE_SUM", groupByFields = ["resource.label.pod_name"] }
                  }
                }
              }]
            }
          }
        },
        # Row 2 — traffic shape.
        {
          xPos = 0, yPos = 8, width = 6, height = 4
          widget = {
            title = "Request rate (req/s)"
            xyChart = {
              dataSets = [
                { plotType = "LINE", legendTemplate = "total", timeSeriesQuery = { prometheusQuery = "typesense_stats_total_requests_per_second" } },
                { plotType = "LINE", legendTemplate = "search", timeSeriesQuery = { prometheusQuery = "typesense_stats_search_requests_per_second" } },
                { plotType = "LINE", legendTemplate = "write", timeSeriesQuery = { prometheusQuery = "typesense_stats_write_requests_per_second" } },
              ]
            }
          }
        },
        {
          xPos = 6, yPos = 8, width = 6, height = 4
          widget = {
            title = "Latency (ms) — aggregate"
            xyChart = {
              # Per-route latency lives in the "Top 5 endpoints by latency" tile below; this one
              # is the search/write aggregate. (typesense_stats_latency_ms is per-endpoint —
              # don't add it back here as an "overall" line; it's not an aggregate.)
              dataSets = [
                { plotType = "LINE", legendTemplate = "search", timeSeriesQuery = { prometheusQuery = "typesense_stats_search_latency_ms" } },
                { plotType = "LINE", legendTemplate = "write", timeSeriesQuery = { prometheusQuery = "typesense_stats_write_latency_ms" } },
              ]
            }
          }
        },
        # Row 3 — per-endpoint detail from /stats.json (sidecar scrapes the typesense API,
        # exposes typesense_stats_{latency_ms,requests_per_second}{typesense_request="GET /..."}).
        # topk(5) keeps the chart legible once dozens of endpoints are in play.
        {
          xPos = 0, yPos = 12, width = 6, height = 4
          widget = {
            title = "Top 5 endpoints by RPS (per-route)"
            xyChart = {
              dataSets = [{
                plotType        = "LINE"
                legendTemplate  = "$${metric.labels.typesense_request}"
                timeSeriesQuery = { prometheusQuery = "topk(5, typesense_stats_requests_per_second)" }
              }]
            }
          }
        },
        {
          xPos = 6, yPos = 12, width = 6, height = 4
          widget = {
            title = "Top 5 endpoints by latency (ms, per-route)"
            xyChart = {
              dataSets = [{
                plotType        = "LINE"
                legendTemplate  = "$${metric.labels.typesense_request}"
                timeSeriesQuery = { prometheusQuery = "topk(5, typesense_stats_latency_ms)" }
              }]
            }
          }
        },
        # Row 4 — backpressure.
        {
          xPos = 0, yPos = 16, width = 6, height = 4
          widget = {
            title = "Overloaded requests/s (should be 0)"
            xyChart = {
              dataSets = [{ plotType = "LINE", timeSeriesQuery = { prometheusQuery = "typesense_stats_overloaded_requests_per_second" } }]
            }
          }
        },
        {
          xPos = 6, yPos = 16, width = 6, height = 4
          widget = {
            title = "Pending write batches (write/replication backlog)"
            xyChart = {
              dataSets = [{ plotType = "LINE", timeSeriesQuery = { prometheusQuery = "typesense_stats_pending_write_batches" } }]
            }
          }
        },
        # Row 5 — compute.
        {
          xPos = 0, yPos = 20, width = 6, height = 4
          widget = {
            title = "CPU usage (cores, per pod)"
            xyChart = {
              dataSets = [{
                plotType = "LINE"
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter      = "metric.type=\"kubernetes.io/container/cpu/core_usage_time\" resource.type=\"k8s_container\" resource.label.\"namespace_name\"=\"${local.typesense_namespace}\""
                    aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_RATE", crossSeriesReducer = "REDUCE_SUM", groupByFields = ["resource.label.pod_name"] }
                  }
                }
              }]
            }
          }
        },
        {
          xPos = 6, yPos = 20, width = 6, height = 4
          widget = {
            title = "Memory used (bytes, per pod)"
            xyChart = {
              dataSets = [{
                plotType = "LINE"
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter      = "metric.type=\"kubernetes.io/container/memory/used_bytes\" resource.type=\"k8s_container\" resource.label.\"namespace_name\"=\"${local.typesense_namespace}\""
                    aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_MEAN", crossSeriesReducer = "REDUCE_SUM", groupByFields = ["resource.label.pod_name"] }
                  }
                }
              }]
            }
          }
        },
        # Row 6 — storage + network.
        {
          xPos = 0, yPos = 24, width = 6, height = 4
          widget = {
            title = "Persistent Volume Claim (disk) utilization (per pod)"
            xyChart = {
              dataSets = [{
                plotType = "LINE"
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter      = "metric.type=\"kubernetes.io/pod/volume/utilization\" resource.type=\"k8s_pod\" resource.label.\"namespace_name\"=\"${local.typesense_namespace}\""
                    aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_MEAN", groupByFields = ["resource.label.pod_name", "metric.label.volume_name"] }
                  }
                }
              }]
            }
          }
        },
        {
          xPos = 6, yPos = 24, width = 6, height = 4
          widget = {
            title = "Network throughput (bytes)"
            xyChart = {
              dataSets = [
                { plotType = "LINE", legendTemplate = "received", timeSeriesQuery = { prometheusQuery = "typesense_metrics_system_network_received_bytes" } },
                { plotType = "LINE", legendTemplate = "sent", timeSeriesQuery = { prometheusQuery = "typesense_metrics_system_network_sent_bytes" } },
              ]
            }
          }
        },
      ]
    }
  })
}
