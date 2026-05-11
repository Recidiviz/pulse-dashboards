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
  description = "Extra rules to append to the base OWASP rule set. Priority must not conflict with the base rules (1000–1012), the rate limiter (2000), or the default allow rule (2147483647)."
  type = list(object({
    priority    = number
    action      = string
    description = optional(string, "")
    expression  = string
  }))
  default = []
}
