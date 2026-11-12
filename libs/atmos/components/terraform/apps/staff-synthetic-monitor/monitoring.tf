# =============================================================================
# Synthetic Monitor uptime checks + alerting.
#
# The uptime checks invoke the Cloud Function on a schedule and record pass/fail
# + the captured screenshot/log artifacts in Cloud Monitoring → Synthetic
# monitors. A thrown error in the test body shows up here as a failed check.
#
# Alerting (gated by var.monitoring_enabled): a single aggregated alert policy
# fires CRITICAL when ANY of this component's per-state checks has been failing
# continuously for var.monitoring.failure_duration, routed to email + PagerDuty.
# =============================================================================

resource "google_monitoring_uptime_check_config" "staff_signin" {
  for_each = local.states

  project      = var.project_id
  display_name = "${var.function_name}-${local.state_slug[each.key]}"

  # Cadence (configurable; GCP caps this at 900s / 15 min). Drives cost +
  # detection latency, and the alert `duration` math (~2 runs).
  period = var.check_period

  # 60s is the UptimeCheckConfig API maximum. A healthy run finishes in ~30s;
  # past 60s the check fails fast while the function keeps running (Cloud Run
  # completes disconnected requests) to capture its failure diagnostics.
  timeout = "60s"

  synthetic_monitor {
    cloud_function_v2 {
      name = google_cloudfunctions2_function.monitor[each.key].id
    }
  }
}

# -----------------------------------------------------------------------------
# Alerting (notification channels + one aggregated alert policy)
# -----------------------------------------------------------------------------

locals {
  monitoring_count = var.monitoring_enabled ? 1 : 0

  # try() so these don't error when monitoring is disabled (count = 0). The alert
  # policy that reads them is itself count-gated, so the empty strings are never used.
  notification_channels = [
    try(google_monitoring_notification_channel.email[0].id, ""),
    try(google_monitoring_notification_channel.pagerduty_forwarder[0].id, ""),
  ]

  # Shipped to PagerDuty as policy_user_labels for routing/context.
  alert_user_labels = {
    service    = "staff-synthetic-monitor"
    project_id = var.project_id
    region     = var.region
  }
}

resource "google_monitoring_notification_channel" "email" {
  count = local.monitoring_count

  project      = var.project_id
  display_name = "Staff synthetic monitor alerts (email)"
  type         = "email"
  labels = {
    email_address = var.monitoring.alert_email
  }
}

# Warnings/criticals publish to the shared "PagerDuty Alert Forwarder" Pub/Sub
# topic; a subscriber in that central project forwards to PagerDuty. The project's
# monitoring notification service agent must hold roles/pubsub.publisher on the
# topic (granted centrally on the shared topic, not here).
resource "google_monitoring_notification_channel" "pagerduty_forwarder" {
  count = local.monitoring_count

  project      = var.project_id
  display_name = "PagerDuty Alert Forwarder"
  type         = "pubsub"
  labels = {
    topic = var.monitoring.pagerduty_forwarder_topic
  }
}

# One aggregated policy across all per-state checks. Grouping by check_id means
# each state is evaluated independently and the incident names the failing check.
resource "google_monitoring_alert_policy" "synthetic_failing" {
  count = local.monitoring_count

  project      = var.project_id
  display_name = "Staff synthetic monitor failing (${var.region})"
  combiner     = "OR"
  severity     = "CRITICAL"
  user_labels  = merge(local.alert_user_labels, { severity = "critical" })

  conditions {
    display_name = "Synthetic sign-in check failing"
    condition_threshold {
      # Synthetic monitors write check_passed against the cloud_run_revision
      # backing their gen2 function (NOT uptime_url like HTTP checks), and GCP
      # requires a resource.type restriction. Scope to ONLY this component's
      # checks by check_id prefix: every check_id is its display_name
      # ("${var.function_name}-<state-slug>") plus a GCP-generated suffix.
      # (Each synthetic check runs from one location, so there's one series per
      # check — REDUCE_COUNT_FALSE yields 1 when failing, hence threshold > 0.)
      # See: https://cloud.google.com/monitoring/synthetic-monitors/create
      #
      # Deliberately a prefix match rather than one_of(<each check_id>): GCP
      # refuses to delete an uptime check while an alert policy names its
      # check_id, and Terraform does not order this policy's in-place update
      # before the destroy of a check that dropped out of local.states. Naming
      # the ids made removing a state fail with "Request contains an invalid
      # argument. - please ensure all associated Alert Policies are deleted."
      # The prefix also picks up newly added states with no policy change.
      filter = join(" AND ", [
        "resource.type=\"cloud_run_revision\"",
        "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\"",
        "metric.label.check_id = starts_with(\"${var.function_name}-\")",
      ])

      comparison      = "COMPARISON_GT"
      threshold_value = 0
      # Must be failing continuously for this long before paging — filters out
      # single-run flakes. Default ~1500s ≈ 2 consecutive 900s runs.
      duration = var.monitoring.failure_duration
      trigger {
        count = 1
      }

      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_NEXT_OLDER"
        cross_series_reducer = "REDUCE_COUNT_FALSE"
        group_by_fields      = ["metric.label.check_id"]
      }
    }
  }

  notification_channels = local.notification_channels

  documentation {
    mime_type = "text/markdown"
    content   = <<-EOT
      A staff synthetic sign-in monitor (${local.env}) has been failing for more
      than ${var.monitoring.failure_duration}. The failing check is identified by
      its `check_id` in the incident labels; each check is one state's sign-in +
      Workflows verification.

      - Results (screenshots/logs): Cloud Monitoring → Synthetic monitors.
      - Reproduce locally: `nx smoke '@staff/synthetic-monitor-fn' -- --state <STATE> --env ${local.env}`.
    EOT
  }

  alert_strategy {
    auto_close = "1800s"
  }
}
