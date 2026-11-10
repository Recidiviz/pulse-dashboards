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
# Operational (non-security) monitoring: an uptime check on the public
# /api/health route, alerts for the janitor sweep, documents stuck waiting
# on a malware scan, Vertex extraction failures, login-webhook and service-wide
# 5xx, failed scheduled-job executions, and the trend lines feeding dashboard.tf.
#
# The janitor sweep and Vertex extraction alerts below duplicate signals
# that already reach Sentry (the janitor's own captureMessage, and Fastify's
# Sentry error handler auto-capturing the thrown TRPCError from a failed
# extraction) — that's deliberate, not an oversight. Sentry only reports
# what a still-running process can hand it; a Cloud Logging-based alert
# fires independently of the app's own runtime health (e.g. the process
# is killed before it can flush to Sentry, or Sentry ingest itself is
# degraded), so this is defense-in-depth rather than a duplicate page.
# The stuck-scan alert has no Sentry counterpart: the janitor only counts
# those documents in its log line, so that alert is the only signal.
locals {
  health_check_path = "/api/health"
  health_check_regions = [
    "USA_IOWA",
    "USA_OREGON",
    "USA_VIRGINIA",
  ]

  # The Auth0 login webhooks, from SIGNED_WEBHOOK_ROUTES in
  # libs/@idaho-th/trpc/src/auth/webhookSignature.ts. Shared so signed_webhook_5xx
  # and server_5xx split on the same paths.
  signed_webhook_url_pattern = "/internal/(link-provider|link-staff|check-provider-provisioned|check-staff-authorized|check-recidiviz-staff)(\\?|$)"

  # Notification channel + the log-based and job-failure alert policies. Doesn't
  # need the load balancer/domain — those are only required for the uptime check.
  operational_alerts_enabled = var.enable_operational_monitoring && var.operational_alert_email != null

  # Uptime checks probe the public domain through the load balancer and stay
  # separately gated for projects where Cloud Monitoring probes are restricted.
  uptime_check_enabled = (
    local.operational_alerts_enabled &&
    var.enable_load_balancer &&
    var.domain_name != null &&
    var.enable_uptime_check
  )

  operational_log_alert_metrics = {
    document_janitor_swept = {
      display_name            = "document janitor swept stale records"
      condition_resource_type = "cloud_run_job"
      severity                = "WARNING"
      documentation           = "The document-janitor job cleaned up stale intake shells or pending documents, which only happens when a request was killed mid-flight. Also reported via Sentry from the job itself — check there first for the specific failure."
      threshold_value         = 0
      alignment_period        = "60s"
      filter                  = <<-EOT
        resource.type="cloud_run_job"
        jsonPayload.job="document-janitor"
        jsonPayload.event="complete"
        (jsonPayload.expiredIntakeShells>0 OR jsonPayload.expiredPendingDocuments>0)
      EOT
    }
    document_scan_stuck = {
      display_name            = "documents stuck waiting for a malware scan"
      condition_resource_type = "cloud_run_job"
      severity                = "WARNING"
      documentation           = "The document-janitor job found confirmed uploads still waiting on a malware-scan verdict 2+ hours after upload (uploads older than 7 days are not counted, so pre-scanner leftovers don't keep this firing). They stay unreadable until a verdict arrives — check the malware scanner service and its scan-complete Eventarc triggers. The janitor only counts these; nothing is changed or deleted."
      threshold_value         = 0
      alignment_period        = "60s"
      filter                  = <<-EOT
        resource.type="cloud_run_job"
        jsonPayload.job="document-janitor"
        jsonPayload.event="complete"
        jsonPayload.stuckScanDocuments>0
      EOT
    }
    vertex_extraction_failed = {
      display_name            = "Vertex extraction failures"
      condition_resource_type = "cloud_run_revision"
      severity                = "WARNING"
      documentation           = "Document extraction via Vertex AI failed more than 4 times in 15 minutes. Individual failures already reach Sentry with full context; this alert catches elevated failure rates independent of the app runtime."
      threshold_value         = 4
      alignment_period        = "900s"
      filter                  = <<-EOT
        resource.type="cloud_run_revision"
        resource.labels.service_name="${var.server_name}"
        severity="ERROR"
        jsonPayload.message="extractWithVertexAIFromDocument failed"
        jsonPayload.procedureName="vertex.extractWithVertexAIFromDocument"
      EOT
    }
    # Counts Cloud Run's per-response request log, not the app's own error log,
    # so one failed request is one hit. Cloud Run's request_count metric can't
    # isolate these: it is per service and its route label is always empty.
    signed_webhook_5xx = {
      display_name            = "login webhook returned 5xx"
      condition_resource_type = "cloud_run_revision"
      severity                = "ERROR"
      documentation           = "An Auth0 login webhook (link-provider, link-staff, check-provider-provisioned, check-staff-authorized or check-recidiviz-staff) returned a 5xx. These run during login, so affected users may be unable to sign in. server_5xx deliberately excludes these routes, so this is the only alert for them. Check the server's request and error logs, then Sentry."
      threshold_value         = 0
      alignment_period        = "300s"
      filter                  = <<-EOT
        resource.type="cloud_run_revision"
        resource.labels.service_name="${var.server_name}"
        logName="projects/${var.project_id}/logs/run.googleapis.com%2Frequests"
        httpRequest.status>=500
        httpRequest.status<=599
        httpRequest.requestUrl=~"${local.signed_webhook_url_pattern}"
      EOT
    }
    # Request log rather than run.googleapis.com/request_count: that metric
    # leaves out requests that never reach a container (a 5xx during scaling or
    # instance startup), which is when /api/health can stay green on the
    # instances that are up. The login webhooks are excluded so one of them
    # failing sends a single email, from signed_webhook_5xx.
    server_5xx = {
      display_name            = "5xx responses"
      condition_resource_type = "cloud_run_revision"
      severity                = "ERROR"
      documentation           = "The server returned at least one 5xx response in the last 5 minutes, counting responses Cloud Run generated itself (scaling or instance-startup failures) as well as the app's own. Baseline is near zero, so any 5xx is worth a look. The uptime check only catches a total outage, and the login webhooks are covered by signed_webhook_5xx instead. Check the server's request and error logs, then Sentry."
      threshold_value         = 0
      alignment_period        = "300s"
      filter                  = <<-EOT
        resource.type="cloud_run_revision"
        resource.labels.service_name="${var.server_name}"
        logName="projects/${var.project_id}/logs/run.googleapis.com%2Frequests"
        httpRequest.status>=500
        httpRequest.status<=599
        NOT httpRequest.requestUrl=~"${local.signed_webhook_url_pattern}"
      EOT
    }
  }
}

resource "google_monitoring_notification_channel" "operational_alert_email" {
  count = local.operational_alerts_enabled ? 1 : 0

  project      = var.project_id
  display_name = "${var.project_id} operational alerts"
  type         = "email"

  labels = {
    email_address = var.operational_alert_email
  }
}

resource "google_monitoring_uptime_check_config" "server_health" {
  count = local.uptime_check_enabled ? 1 : 0

  project          = var.project_id
  display_name     = "${var.server_name}-health"
  timeout          = "10s"
  period           = "60s"
  selected_regions = local.health_check_regions
  # Log failed probes (status code / TLS / reset reasons) to Cloud Logging —
  # without this the only failure signal is the boolean check_passed metric.
  log_check_failures = true

  http_check {
    path           = local.health_check_path
    port           = 443
    use_ssl        = true
    validate_ssl   = true
    request_method = "GET"
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.domain_name
    }
  }

  content_matchers {
    content = "\"status\":\"ok\""
    matcher = "CONTAINS_STRING"
  }
}

# The app is unreachable from outside — the one alert here that isn't already
# covered by Sentry, since an in-process SDK can't report anything when the
# process can't be reached at all.
resource "google_monitoring_alert_policy" "server_unreachable" {
  count = local.uptime_check_enabled ? 1 : 0

  project      = var.project_id
  display_name = "${var.server_name}: endpoint unreachable"
  combiner     = "OR"
  severity     = "CRITICAL"
  user_labels = {
    project_id = var.project_id
    severity   = "critical"
  }

  documentation {
    content   = "The public uptime check against https://${var.domain_name}${local.health_check_path} is failing. The app may be down or unreachable — check Cloud Run revision health and recent deploys."
    mime_type = "text/markdown"
  }

  conditions {
    display_name = "Uptime check failing"

    condition_threshold {
      filter = join(" AND ", [
        "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\"",
        "resource.type=\"uptime_url\"",
        "metric.label.check_id=\"${google_monitoring_uptime_check_config.server_health[0].uptime_check_id}\"",
      ])
      # >1 of the 3 US checker regions failing, sustained for ~3 consecutive
      # 60s probe cycles. A real outage fails all regions within one cycle;
      # single-probe blips that self-heal on the next probe don't page.
      comparison      = "COMPARISON_GT"
      threshold_value = 1
      duration        = "180s"
      trigger {
        count = 1
      }
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_NEXT_OLDER"
        cross_series_reducer = "REDUCE_COUNT_FALSE"
        group_by_fields      = ["resource.label.host"]
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.operational_alert_email[0].id,
  ]

  alert_strategy {
    auto_close = "604800s"
  }
}

# Log-based operational metrics used by the dashboard and alert policies.
resource "google_logging_metric" "operational_log_alerts" {
  for_each = var.enable_operational_monitoring ? local.operational_log_alert_metrics : {}

  project = var.project_id
  name    = each.key
  filter  = each.value.filter

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }
}

resource "google_monitoring_alert_policy" "operational_log_alerts" {
  for_each = local.operational_alerts_enabled ? local.operational_log_alert_metrics : {}

  project      = var.project_id
  display_name = "${var.server_name}: ${each.value.display_name}"
  combiner     = "OR"
  severity     = each.value.severity
  user_labels = {
    project_id = var.project_id
    severity   = lower(each.value.severity)
  }

  documentation {
    content   = each.value.documentation
    mime_type = "text/markdown"
  }

  conditions {
    display_name = "${each.key} > ${each.value.threshold_value}"

    condition_threshold {
      filter          = "resource.type=\"${each.value.condition_resource_type}\" AND metric.type=\"logging.googleapis.com/user/${google_logging_metric.operational_log_alerts[each.key].name}\""
      comparison      = "COMPARISON_GT"
      threshold_value = each.value.threshold_value
      duration        = "0s"

      aggregations {
        alignment_period   = each.value.alignment_period
        per_series_aligner = "ALIGN_DELTA"
      }

      trigger {
        count = 1
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.operational_alert_email[0].id,
  ]

  alert_strategy {
    auto_close = "604800s"
  }
}

# A scheduled job execution that ended without succeeding. Each job reports its
# own failures to Sentry, but a killed or OOM'd container can't — this reads
# Cloud Run's own execution result instead.
resource "google_monitoring_alert_policy" "scheduled_job_failed" {
  count = local.operational_alerts_enabled ? 1 : 0

  project      = var.project_id
  display_name = "${var.server_name}: scheduled job execution failed"
  combiner     = "OR"
  severity     = "ERROR"
  user_labels = {
    project_id = var.project_id
    severity   = "error"
  }

  documentation {
    content   = "A document-janitor, Intercom digest or Intercom provider-sync execution did not succeed. Check the job's execution logs in Cloud Run, then Sentry for any reported error."
    mime_type = "text/markdown"
  }

  conditions {
    display_name = "Job execution result != succeeded"

    condition_threshold {
      # != "succeeded" rather than == "failed", so every execution that did not
      # succeed alerts.
      filter = join(" AND ", [
        "metric.type=\"run.googleapis.com/job/completed_execution_count\"",
        "resource.type=\"cloud_run_job\"",
        "metric.label.result!=\"succeeded\"",
        "resource.label.job_name=one_of(\"${var.document_janitor_job_name}\", \"${var.intercom_digest_job_name}\", \"${var.intercom_provider_sync_job_name}\")",
      ])
      comparison      = "COMPARISON_GT"
      threshold_value = 0
      duration        = "0s"

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_DELTA"
      }

      trigger {
        count = 1
      }
    }
  }

  notification_channels = [
    google_monitoring_notification_channel.operational_alert_email[0].id,
  ]

  alert_strategy {
    auto_close = "604800s"
  }
}

moved {
  from = google_logging_metric.document_janitor_swept[0]
  to   = google_logging_metric.operational_log_alerts["document_janitor_swept"]
}

moved {
  from = google_monitoring_alert_policy.document_janitor_swept[0]
  to   = google_monitoring_alert_policy.operational_log_alerts["document_janitor_swept"]
}

moved {
  from = google_logging_metric.vertex_extraction_failed[0]
  to   = google_logging_metric.operational_log_alerts["vertex_extraction_failed"]
}

moved {
  from = google_monitoring_alert_policy.vertex_extraction_failed[0]
  to   = google_monitoring_alert_policy.operational_log_alerts["vertex_extraction_failed"]
}
