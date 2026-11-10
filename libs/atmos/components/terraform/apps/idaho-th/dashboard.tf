# Recidiviz - a data platform for criminal justice reform
# Copyright (C) 2026 Recidiviz, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
# =============================================================================
#
# Cloud Monitoring dashboard for the idaho-th server. Unlike typesense's
# dashboard, there's no Prometheus/GMP exporter here — every tile uses
# timeSeriesFilter against native Cloud Run metrics plus the log-based
# metrics from operational_monitoring.tf. Mosaic layout, 12 columns, tiles
# 6 wide x 4 tall (xPos/yPos omitted when 0 per the dashboard API contract).

locals {
  dashboard_base_tiles = [
    {
      width = 6, height = 4
      widget = {
        title = "Request rate by response class (req/s)"
        xyChart = {
          dataSets = [{
            plotType       = "LINE"
            targetAxis     = "Y1"
            legendTemplate = "$${metric.labels.response_code_class}"
            timeSeriesQuery = {
              timeSeriesFilter = {
                filter      = "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${var.server_name}\""
                aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_RATE", crossSeriesReducer = "REDUCE_SUM", groupByFields = ["metric.label.response_code_class"] }
              }
            }
          }]
        }
      }
    },
    {
      xPos = 6, width = 6, height = 4
      widget = {
        title = "Request latency (ms) — p50/p95/p99"
        xyChart = {
          dataSets = [
            {
              plotType = "LINE", targetAxis = "Y1", legendTemplate = "p50"
              timeSeriesQuery = { timeSeriesFilter = {
                filter      = "metric.type=\"run.googleapis.com/request_latencies\" resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${var.server_name}\""
                aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_PERCENTILE_50" }
              } }
            },
            {
              plotType = "LINE", targetAxis = "Y1", legendTemplate = "p95"
              timeSeriesQuery = { timeSeriesFilter = {
                filter      = "metric.type=\"run.googleapis.com/request_latencies\" resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${var.server_name}\""
                aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_PERCENTILE_95" }
              } }
            },
            {
              plotType = "LINE", targetAxis = "Y1", legendTemplate = "p99"
              timeSeriesQuery = { timeSeriesFilter = {
                filter      = "metric.type=\"run.googleapis.com/request_latencies\" resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${var.server_name}\""
                aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_PERCENTILE_99" }
              } }
            },
          ]
        }
      }
    },
    {
      yPos = 4, width = 6, height = 4
      widget = {
        title = "Instance count (active vs idle)"
        xyChart = {
          dataSets = [{
            plotType       = "LINE"
            targetAxis     = "Y1"
            legendTemplate = "$${metric.labels.state}"
            timeSeriesQuery = {
              timeSeriesFilter = {
                filter      = "metric.type=\"run.googleapis.com/container/instance_count\" resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${var.server_name}\""
                aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_MEAN", crossSeriesReducer = "REDUCE_SUM", groupByFields = ["metric.label.state"] }
              }
            }
          }]
        }
      }
    },
    {
      xPos = 6, yPos = 4, width = 6, height = 4
      widget = {
        title = "5xx responses (count)"
        xyChart = {
          dataSets = [{
            plotType   = "LINE"
            targetAxis = "Y1"
            timeSeriesQuery = {
              timeSeriesFilter = {
                filter      = "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${var.server_name}\" metric.label.response_code_class=\"5xx\""
                aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_DELTA", crossSeriesReducer = "REDUCE_SUM" }
              }
            }
          }]
        }
      }
    },
    {
      yPos = 8, width = 6, height = 4
      widget = {
        # Same metric backs an alert policy too — see operational_monitoring.tf.
        title = "Document janitor: runs that swept something"
        xyChart = {
          dataSets = [{
            plotType   = "LINE"
            targetAxis = "Y1"
            timeSeriesQuery = {
              timeSeriesFilter = {
                filter      = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.operational_log_alerts["document_janitor_swept"].name}\" resource.type=\"cloud_run_job\""
                aggregation = { alignmentPeriod = "3600s", perSeriesAligner = "ALIGN_DELTA", crossSeriesReducer = "REDUCE_SUM" }
              }
            }
          }]
        }
      }
    },
    {
      xPos = 6, yPos = 8, width = 6, height = 4
      widget = {
        # Same metric backs an alert policy too — see operational_monitoring.tf.
        title = "Vertex extraction failures"
        xyChart = {
          dataSets = [{
            plotType   = "LINE"
            targetAxis = "Y1"
            timeSeriesQuery = {
              timeSeriesFilter = {
                filter      = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.operational_log_alerts["vertex_extraction_failed"].name}\" resource.type=\"cloud_run_revision\""
                aggregation = { alignmentPeriod = "300s", perSeriesAligner = "ALIGN_DELTA", crossSeriesReducer = "REDUCE_SUM" }
              }
            }
          }]
        }
      }
    },
    {
      # Sits beside the uptime tile (below), which owns column 0 of this row.
      xPos = 6, yPos = 12, width = 6, height = 4
      widget = {
        # Same metric backs an alert policy too — see operational_monitoring.tf.
        title = "Document janitor: runs that found documents stuck in scanning"
        xyChart = {
          dataSets = [{
            plotType   = "LINE"
            targetAxis = "Y1"
            timeSeriesQuery = {
              timeSeriesFilter = {
                filter      = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.operational_log_alerts["document_scan_stuck"].name}\" resource.type=\"cloud_run_job\""
                aggregation = { alignmentPeriod = "3600s", perSeriesAligner = "ALIGN_DELTA", crossSeriesReducer = "REDUCE_SUM" }
              }
            }
          }]
        }
      }
    },
  ]

  dashboard_uptime_tile = [{
    yPos = 12, width = 6, height = 4
    widget = {
      title = "Public endpoint uptime (${local.health_check_path})"
      xyChart = {
        dataSets = [{
          plotType   = "LINE"
          targetAxis = "Y1"
          timeSeriesQuery = {
            timeSeriesFilter = {
              # This local is evaluated even when the uptime tile is omitted;
              # guard the count-based resource reference for disabled checks.
              filter      = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" resource.type=\"uptime_url\" metric.label.check_id=\"${try(google_monitoring_uptime_check_config.server_health[0].uptime_check_id, "")}\""
              aggregation = { alignmentPeriod = "300s", perSeriesAligner = "ALIGN_FRACTION_TRUE" }
            }
          }
        }]
      }
    }
  }]

  dashboard_tiles = concat(
    local.dashboard_base_tiles,
    local.uptime_check_enabled ? local.dashboard_uptime_tile : [],
  )
}

resource "google_monitoring_dashboard" "server" {
  count = var.enable_operational_monitoring ? 1 : 0

  project = var.project_id

  dashboard_json = jsonencode({
    displayName = "${var.server_name} (${var.location})"
    mosaicLayout = {
      columns = 12
      tiles   = local.dashboard_tiles
    }
  })
}
