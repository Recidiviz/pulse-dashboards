# =============================================================================
# Pages through PagerDuty when a sync function cannot write to Typesense.
#
# sync-fn writes one JSON log entry with event typesense_sync_failed for each
# failed delivery, and the trigger's retry policy retries the event. The alert
# pages only when an event is still failing after failure_alert_min_age_seconds,
# so a failure that a retry fixes does not page. An event that carries no
# document cannot be retried, so it pages at once.
#
# This alert does not detect a function that does not run at all, for example
# a function that a failed apply never created. Such a function writes no logs.
# =============================================================================

locals {
  # Eventarc retries with a backoff of up to 10 minutes, so an event that still
  # fails after this age has failed several retries.
  failure_alert_min_age_seconds = 600
}

# Shared "PagerDuty Alert Forwarder": alerts publish to a Pub/Sub topic in the
# data-platform project, where a subscriber forwards them to PagerDuty. This
# project's monitoring notification service agent must have
# roles/pubsub.publisher on the topic. The apps/typesense component in the same
# project needs the same grant, so it is already in place.
resource "google_monitoring_notification_channel" "pagerduty_forwarder" {
  project      = var.project_id
  display_name = "PagerDuty Alert Forwarder (typesense-sync)"
  type         = "pubsub"
  labels = {
    topic = var.pagerduty_forwarder_topic
  }
}

resource "google_monitoring_alert_policy" "sync_failed" {
  project      = var.project_id
  display_name = "Typesense sync failing (${var.function_name_prefix})"
  combiner     = "OR"
  severity     = "ERROR"
  # The same service label as the apps/typesense alerts, so the forwarder routes
  # these alerts the same way.
  user_labels = {
    service    = "typesense"
    component  = "typesense-sync"
    project_id = var.project_id
    region     = var.region
    severity   = "error"
  }

  conditions {
    display_name = "typesense_sync_failed log entry"
    condition_matched_log {
      filter = join(" AND ", [
        "resource.type=\"cloud_run_revision\"",
        "resource.labels.service_name:\"${var.function_name_prefix}-\"",
        "jsonPayload.event=\"typesense_sync_failed\"",
        "(jsonPayload.reason=\"no_event_data\" OR jsonPayload.eventAgeSeconds>=${local.failure_alert_min_age_seconds})",
      ])
      label_extractors = {
        collections = "EXTRACT(jsonPayload.collections)"
        reason      = "EXTRACT(jsonPayload.reason)"
      }
    }
  }

  # A log-match condition requires a rate limit. One page an hour is enough,
  # because one fault usually fails every write.
  alert_strategy {
    notification_rate_limit {
      period = "3600s"
    }
    auto_close = "1800s"
  }

  documentation {
    mime_type = "text/markdown"
    content   = <<-EOT
      A Firestore update did not reach Typesense, and retries did not fix it. Search results for the
      affected collections are stale until the sync recovers or the next backfill runs.

      Find the failures in Logs Explorer:

      ```
      resource.type="cloud_run_revision"
      resource.labels.service_name:"${var.function_name_prefix}-"
      jsonPayload.event="typesense_sync_failed"
      ```

      - reason "no_event_data": the function runs in the wrong signature mode. Check
        GOOGLE_FUNCTION_SIGNATURE_TYPE in the component's build_config.
      - reason "sync_failed": errorType, httpStatus, and message give the Typesense or Firestore error.
    EOT
  }

  notification_channels = [
    google_monitoring_notification_channel.pagerduty_forwarder.id,
  ]
}
