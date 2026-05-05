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
  base_rules = [
    {
      priority    = 900
      action      = "throttle"
      description = "Rate limit: 100 requests per minute per IP"
      expression  = "true"
      rate_limit_options = {
        rate_limit_threshold = {
          count        = 100
          interval_sec = 60
        }
        conform_action = "allow"
        exceed_action  = "deny(429)"
        enforce_on_key = "IP"
      }
    },
    {
      priority    = 1000
      action      = "deny(403)"
      description = "SQL Injection"
      expression  = "evaluatePreconfiguredWaf('sqli-v33-stable', {'sensitivity': 1})"
    },
    {
      priority    = 1001
      action      = "deny(403)"
      description = "Cross-site scripting"
      expression  = "evaluatePreconfiguredWaf('xss-v33-stable', {'sensitivity': 1})"
    },
    {
      priority    = 1002
      action      = "deny(403)"
      description = "Local file inclusion"
      expression  = "evaluatePreconfiguredWaf('lfi-v33-stable', {'sensitivity': 1})"
    },
    {
      priority    = 1003
      action      = "deny(403)"
      description = "Remote file inclusion"
      expression  = "evaluatePreconfiguredWaf('rfi-v33-stable', {'sensitivity': 2})"
    },
    {
      priority    = 1004
      action      = "deny(403)"
      description = "Remote code execution"
      expression  = "evaluatePreconfiguredWaf('rce-v33-stable', {'sensitivity': 3})"
    },
    {
      priority    = 1005
      action      = "deny(403)"
      description = "Method enforcement"
      expression  = "evaluatePreconfiguredWaf('methodenforcement-v33-stable', {'sensitivity': 1})"
    },
    {
      priority    = 1006
      action      = "deny(403)"
      description = "Scanner detection"
      expression  = "evaluatePreconfiguredWaf('scannerdetection-v33-stable', {'sensitivity': 1})"
    },
    {
      priority    = 1007
      action      = "deny(403)"
      description = "Protocol attack"
      expression  = "evaluatePreconfiguredWaf('protocolattack-v33-stable', {'sensitivity': 3})"
    },
    {
      priority    = 1008
      action      = "deny(403)"
      description = "PHP injection attack"
      expression  = "evaluatePreconfiguredWaf('php-v33-stable', {'sensitivity': 3})"
    },
    {
      priority    = 1009
      action      = "deny(403)"
      description = "Session fixation attack"
      expression  = "evaluatePreconfiguredWaf('sessionfixation-v33-stable', {'sensitivity': 1})"
    },
    {
      priority    = 1010
      action      = "deny(403)"
      description = "Java attack"
      expression  = "evaluatePreconfiguredWaf('java-v33-stable', {'sensitivity': 3})"
    },
    {
      priority    = 1011
      action      = "deny(403)"
      description = "NodeJS attack"
      expression  = "evaluatePreconfiguredWaf('nodejs-v33-stable', {'sensitivity': 1})"
    },
    {
      priority    = 1012
      action      = "deny(403)"
      description = "Newly discovered vulnerabilities"
      expression  = "evaluatePreconfiguredWaf('cve-canary', {'sensitivity': 4})"
    }
  ]

  all_rules = concat(local.base_rules, var.additional_rules)
}

resource "google_compute_security_policy" "waf" {
  name    = var.name
  project = var.project

  advanced_options_config {
    json_parsing = "STANDARD"
    log_level    = "VERBOSE"
  }

  dynamic "rule" {
    for_each = local.all_rules
    content {
      priority    = rule.value.priority
      action      = rule.value.action
      description = rule.value.description
      match {
        expr {
          expression = rule.value.expression
        }
      }
    }
  }

  rule {
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
