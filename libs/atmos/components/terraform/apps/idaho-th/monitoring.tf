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

# CIS GCP Foundations Benchmark style log-based alerts: storage IAM permission
# changes, audit config changes, firewall rule changes, project ownership
# changes. Project-level audit-log alerts, applied once per project.

locals {
  security_alerts_enabled = var.enable_security_alerts && var.security_alert_email != null
}

resource "google_monitoring_notification_channel" "security_alert_email" {
  count = local.security_alerts_enabled ? 1 : 0

  project      = var.project_id
  display_name = "${var.project_id} security alerts"
  type         = "email"

  labels = {
    email_address = var.security_alert_email
  }
}

locals {
  # condition_resource_type must match the Monitoring resource type each metric binds
  # to. gcs_bucket is a first-class Monitoring resource type, so storage_permission_changes
  # binds there directly; gce_firewall_rule/project aren't, so the rest default to "global".
  security_alert_metrics = {
    storage_permission_changes = {
      display_name            = "Storage IAM permission changes"
      condition_resource_type = "gcs_bucket"
      severity                = "WARNING"
      documentation           = "A Cloud Storage bucket IAM permission was changed in ${var.project_id}. Verify the change was authorized — buckets in this project can hold application data and logs."
      filter                  = <<-EOT
        resource.type="gcs_bucket"
        protoPayload.methodName="storage.setIamPermissions"
      EOT
    }
    audit_config_changes = {
      display_name            = "Audit config changes"
      condition_resource_type = "global"
      severity                = "WARNING"
      documentation           = "An IAM audit config was changed in ${var.project_id} (e.g. Admin Activity/Data Access logging altered). Verify this was authorized — audit config changes can be used to mask other malicious activity."
      filter                  = <<-EOT
        protoPayload.methodName="SetIamPolicy"
        protoPayload.serviceData.policyDelta.auditConfigDeltas:*
      EOT
    }
    firewall_rule_changes = {
      display_name            = "Firewall rule changes"
      condition_resource_type = "global"
      severity                = "WARNING"
      documentation           = "A VPC firewall rule was created, patched, or deleted in ${var.project_id}. Verify the change was authorized and doesn't expose unintended ingress/egress."
      filter                  = <<-EOT
        resource.type="gce_firewall_rule"
        protoPayload.methodName:("compute.firewalls.insert" OR "compute.firewalls.patch" OR "compute.firewalls.delete")
      EOT
    }
    project_ownership_changes = {
      display_name            = "Project ownership changes"
      condition_resource_type = "global"
      severity                = "CRITICAL"
      documentation           = "A principal was granted or removed from roles/owner on ${var.project_id} — the highest privilege level available on the project. Verify this was authorized immediately."
      filter                  = <<-EOT
        resource.type="project"
        protoPayload.serviceName="cloudresourcemanager.googleapis.com"
        protoPayload.serviceData.policyDelta.bindingDeltas.role="roles/owner"
      EOT
    }
  }
}

resource "google_logging_metric" "security_alerts" {
  for_each = local.security_alerts_enabled ? local.security_alert_metrics : {}

  project = var.project_id
  name    = each.key
  filter  = each.value.filter

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }
}

resource "google_monitoring_alert_policy" "security_alerts" {
  for_each = local.security_alerts_enabled ? local.security_alert_metrics : {}

  project      = var.project_id
  display_name = "${var.project_id}: ${each.value.display_name}"
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
    display_name = each.value.display_name

    condition_threshold {
      filter          = "resource.type = \"${each.value.condition_resource_type}\" AND metric.type = \"logging.googleapis.com/user/${google_logging_metric.security_alerts[each.key].name}\""
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
    google_monitoring_notification_channel.security_alert_email[0].id,
  ]

  alert_strategy {
    auto_close = "604800s"
  }
}
