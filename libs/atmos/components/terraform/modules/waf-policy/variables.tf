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

variable "name" {
  type        = string
  description = "Name of the Cloud Armor security policy resource"
}

variable "project" {
  type        = string
  description = "GCP project ID"
}

variable "region" {
  type        = string
  description = "Region to create the security policy in"
}

variable "additional_rules" {
  description = <<-EOT
    Optional extra rules appended to the base OWASP deny set. Empty by default
    (no effect for callers that omit this variable, e.g. Meetings).

    Each rule must set `action` (commonly `allow` or `deny(403)`). Priority must
    not conflict with base rules (999–1012), the rate limiter (2000), or the
    default allow rule (2147483647). Lower priority numbers are evaluated first.
  EOT
  type = list(object({
    priority    = number
    action      = string
    description = optional(string, "")
    expression  = string
  }))
  default = []
}

variable "category_exclusions" {
  description = <<-EOT
    Optional path-scoped exclusions for specific base OWASP rules (identified
    by priority, 999-1012). When a request matches exclude_when, that rule is
    skipped for it (evaluation continues to the next rule) instead of denying
    - for known false positives on a specific endpoint, without disabling the
    rule for every other request. Empty by default (no effect for callers
    that omit this variable, e.g. Meetings).
  EOT
  type = list(object({
    priority     = number
    exclude_when = string
  }))
  default = []
}
