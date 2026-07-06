variable "project_id" {
  type        = string
  description = "The GCP project that we are deploying Typesense to"
}

# Two deployment shapes:
#  - "primary"  (default) — full deployment: GKE cluster + Typesense workload + LB +
#                           monitoring + dashboard + snapshot/compact CronJobs.
#  - "standby" — supporting infra only: reserved IP, KMS keys, snapshot bucket,
#                 cert DNS authorization. No cluster, no workloads, no LB. Used by
#                 a fallback-region stack to idle the slow-to-provision pieces of a
#                 regional-DR cutover for ~$5–7/mo. Failover = flip this to "primary"
#                 and apply (the same state file owns both phases).
variable "mode" {
  type        = string
  default     = "primary"
  description = "Deployment shape: \"primary\" (full) or \"standby\" (supporting infra only, for the fallback-region stack)."
  validation {
    condition     = contains(["primary", "standby"], var.mode)
    error_message = "mode must be either \"primary\" or \"standby\"."
  }
}

variable "region" {
  type        = string
  description = "The GCP region for the regional GKE cluster (e.g. us-central1)"
  default     = "us-central1"
}

variable "hostname" {
  type        = string
  description = "Public hostname for the Typesense endpoint (e.g. typesense-staging.recidiviz.org)"
}

variable "cors_domains" {
  type        = list(string)
  default     = []
  description = <<-EOT
    Origins permitted to send browser requests directly to Typesense (e.g. the staff
    dashboard's deployed URL plus http://localhost:3000 for local dev). Sets
    --cors-domains via TYPESENSE_CORS_DOMAINS and enables CORS only when the list is
    non-empty. Scoped keys already enforce per-user filtering, so this is
    defense-in-depth against scoped-key theft from a malicious page rather than the
    primary access control. Keep production tight (no localhost); staging can include
    local dev.
  EOT
}

variable "typesense_image" {
  type        = string
  description = "Typesense container image (pin a specific version)"
  default     = "typesense/typesense:30.2"
}

variable "blackbox_image" {
  type        = string
  description = "Image for the Prometheus blackbox exporter (bridges the healthcheck /readyz into GMP)"
  default     = "quay.io/prometheus/blackbox-exporter:v0.25.0"
}

variable "operator_chart_version" {
  type        = string
  description = "Pinned version of the akyriako/typesense-operator (TyKO) Helm chart"
}

variable "node_machine_type" {
  type        = string
  description = "Machine type for the Typesense node pool"
}

variable "node_count_per_zone" {
  type        = number
  description = "Nodes per zone in the regional node pool. 1 => 3 nodes across 3 zones, one schedulable node per quorum member."
  default     = 1
}

variable "data_disk_size" {
  type        = string
  description = "Persistent volume size for each Typesense node's data dir"
  default     = "50Gi"
}

variable "typesense_resources" {
  type = object({
    requests = object({ cpu = string, memory = string })
    limits   = object({ cpu = string, memory = string })
  })
  description = "CPU/memory requests and limits for the Typesense pods"
  default = {
    requests = { cpu = "500m", memory = "1Gi" }
    limits   = { cpu = "2", memory = "2Gi" }
  }
}

variable "kms_rotation_period" {
  type        = string
  description = "Rotation period for the CMEK crypto keys"
  default     = "7776000s" # 90 days
}

variable "maintenance_start_time" {
  type        = string
  description = "RFC3339 start time of the daily/weekly maintenance window (time-of-day is what matters). Default is off-peak for US Central."
  default     = "2025-01-01T07:00:00Z" # 01:00 US/Central
}

variable "maintenance_end_time" {
  type        = string
  description = "RFC3339 end time of the maintenance window"
  default     = "2025-01-01T11:00:00Z" # 05:00 US/Central
}

variable "maintenance_recurrence" {
  type        = string
  description = "RRULE recurrence for the maintenance window"
  default     = "FREQ=WEEKLY;BYDAY=SA,SU"
}

variable "waf_preview" {
  type        = bool
  default     = true
  description = <<-EOT
    Run the OWASP CRS WAF rules in PREVIEW mode (preview = true) instead of enforcing them.
    In preview, a matching request is NOT denied — the would-be deny(403) is only recorded in
    the Cloud Armor request logs (which carry the matched rule + previewed action because the
    policy logs at VERBOSE and the backend logs requests at 100%). This is the safe rollout path
    for the OWASP rules against Typesense's JSON search traffic, which can look like SQLi/XSS:
    deploy in preview, review the VERBOSE logs for false positives, add per-ruleset exclusions,
    then set this to false to start enforcing. Does not affect the rate-limit or default rules.
  EOT
}

variable "monitoring_enabled" {
  type        = bool
  default     = true
  description = <<-EOT
    Whether to create the alert policies, notification channels, uptime check, and dashboard
    (everything in monitoring.tf / dashboard.tf). Only has effect in mode = "primary".

    Defaults to true for steady-state operation. Set to false on the FIRST apply of a brand-new
    or failed-over cluster — the PromQL/GMP-backed policies reference metrics that don't exist
    until the operator's exporter + blackbox probe have been scraped at least once. Bring the
    cluster up with this false, confirm `probe_success` / `typesense_stats_*` are visible in
    Metrics Explorer, then flip to true and re-apply. See RUNBOOK.md "Regional outages".
  EOT
}

variable "monitoring" {
  type = object({
    # Email recipient (e.g. a team distribution list) for downtime alerts.
    alert_email = string
    # Fire the disk-usage alert when used/total disk exceeds this ratio.
    disk_alert_ratio = optional(number, 0.85)
    # Fire the memory-usage alert when used/total system memory exceeds this ratio.
    memory_alert_ratio = optional(number, 0.9)
    # Fire the search-latency alert when typesense_stats_search_latency_ms exceeds this (ms).
    search_latency_alert_ms = optional(number, 500)
    # Fire the write-backlog alert when typesense_stats_pending_write_batches exceeds this.
    pending_writes_alert = optional(number, 100)
    # Pub/Sub topic for the shared "PagerDuty Alert Forwarder" — warning alerts publish here and a
    # subscriber in that project forwards to PagerDuty. The project's monitoring notification service
    # agent must have roles/pubsub.publisher on this topic (granted on the shared topic, not here).
    pagerduty_forwarder_topic = optional(string, "projects/recidiviz-123/topics/cloud-monitoring-alerts-to-forward")
  })
  description = "Monitoring/alerting configuration: alert email recipient, alert thresholds, and the PagerDuty forwarder topic."
}

variable "snapshot_schedule" {
  type        = string
  description = "Cron schedule (UTC) for the Raft-snapshot-to-GCS CronJob"
  default     = "0 */6 * * *"
}

variable "compact_schedule" {
  type        = string
  description = "Cron schedule (UTC) for the per-node RocksDB compaction CronJob. Default: 03:00 US/Central daily."
  default     = "0 8 * * *"
}

variable "backfill_allowlist_ip_ranges" {
  type        = list(string)
  default     = []
  description = <<-EOT
    Source IPs/CIDRs allowlisted past the Cloud Armor WAF + rate limit at high priority
    (see the "allowlist" rule in exposure.tf). Intended for the typesense-backfill function's
    static egress IP so it can bulk-import faster than the per-IP rate limit. Wire it from the
    backfill component's egress_ip output in the stack:
      backfill_allowlist_ip_ranges:
        - !terraform.state apps/typesense-backfill egress_ip
    Empty (the default) creates no allowlist rule, so non-backfill stacks are unaffected.
  EOT
}
