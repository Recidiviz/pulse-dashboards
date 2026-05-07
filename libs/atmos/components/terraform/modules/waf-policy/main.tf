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

locals {
  deny_403_rules = [
    {
      priority    = 1000
      description = "SQL Injection"
      expression  = "evaluatePreconfiguredWaf('sqli-v33-stable', {'sensitivity': 1})"
    },
    {
      priority    = 1001
      description = "Cross-site scripting"
      expression  = "evaluatePreconfiguredWaf('xss-v33-stable', {'sensitivity': 1})"
    },
    {
      priority    = 1002
      description = "Local file inclusion"
      expression  = "evaluatePreconfiguredWaf('lfi-v33-stable', {'sensitivity': 1})"
    },
    {
      priority    = 1003
      description = "Remote file inclusion"
      expression  = "evaluatePreconfiguredWaf('rfi-v33-stable', {'sensitivity': 2})"
    },
    {
      priority    = 1004
      description = "Remote code execution"
      expression  = "evaluatePreconfiguredWaf('rce-v33-stable', {'sensitivity': 3})"
    },
    {
      priority    = 1005
      description = "Method enforcement"
      expression  = "evaluatePreconfiguredWaf('methodenforcement-v33-stable', {'sensitivity': 1})"
    },
    {
      priority    = 1006
      description = "Scanner detection"
      expression  = "evaluatePreconfiguredWaf('scannerdetection-v33-stable', {'sensitivity': 1})"
    },
    {
      priority    = 1007
      description = "Protocol attack"
      expression  = "evaluatePreconfiguredWaf('protocolattack-v33-stable', {'sensitivity': 3})"
    },
    {
      priority    = 1008
      description = "PHP injection attack"
      expression  = "evaluatePreconfiguredWaf('php-v33-stable', {'sensitivity': 3})"
    },
    {
      priority    = 1009
      description = "Session fixation attack"
      expression  = "evaluatePreconfiguredWaf('sessionfixation-v33-stable', {'sensitivity': 1})"
    },
    {
      priority    = 1010
      description = "Java attack"
      expression  = "evaluatePreconfiguredWaf('java-v33-stable', {'sensitivity': 3})"
    },
    {
      priority    = 1011
      description = "NodeJS attack"
      expression  = "evaluatePreconfiguredWaf('nodejs-v33-stable', {'sensitivity': 1})"
    },
    {
      priority    = 1012
      description = "Newly discovered vulnerabilities"
      expression  = "evaluatePreconfiguredWaf('cve-canary', {'sensitivity': 4})"
    }
  ]

  all_rules = concat(local.deny_403_rules, var.additional_rules)
}

resource "google_compute_region_security_policy" "waf" {
  name    = var.name
  project = var.project
  region  = var.region
  type    = "CLOUD_ARMOR"

  advanced_options_config {
    json_parsing = "STANDARD"
    log_level    = "VERBOSE"
  }

  dynamic "rules" {
    for_each = local.all_rules
    content {
      priority    = rules.value.priority
      action      = "deny(403)"
      description = rules.value.description
      match {
        expr {
          expression = rules.value.expression
        }
      }
    }
  }

  rules {
    priority    = 900
    action      = "throttle"
    description = "Rate limit: 100 requests per minute per IP"
    match {
      expr {
        expression = "true"
      }
    }
    rate_limit_options {
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
    }
  }

  rules {
    priority    = 2147483647
    action      = "allow"
    description = "Default rule, higher priority overrides it"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
  }
}
