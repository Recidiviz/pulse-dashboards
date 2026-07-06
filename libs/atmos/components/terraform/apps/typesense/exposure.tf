# External exposure: a REGIONAL external Application LB (provisioned by the GKE
# Gateway in typesense.tf) fronted by regional Cloud Armor and a Certificate
# Manager regional managed cert.
#
# Regional (not global) is required because the org policy
# constraints/compute.disableGlobalCloudArmorPolicy forbids global Cloud Armor
# security policies — which a global external ALB would need.
#
# DNS for the hostname is managed OUTSIDE this project (there is no Cloud DNS
# managed zone here), so this component does not create DNS records. The A record
# and the managed-cert validation CNAME must be added in the system of record for
# recidiviz.org — see the endpoint_ip and cert_dns_authorization_record outputs.

# Regional external IP for the endpoint.
resource "google_compute_address" "typesense" {
  name         = "typesense-${var.region}-ip"
  region       = var.region
  address_type = "EXTERNAL"
}

locals {
  # OWASP ModSecurity CRS preconfigured WAF rule sets. Evaluated at sensitivity 1
  # (the least aggressive tier) to limit false positives on legitimate Typesense
  # JSON search traffic, which can otherwise look like SQLi/XSS payloads.
  #
  # NOTE: these are OR'd into a SINGLE rule rather than one rule each. The region's
  # SECURITY_POLICY_ADVANCED_RULES_PER_REGION quota (limit 20) is shared across all
  # Cloud Armor policies in the region (meetings-server-waf already uses most of it),
  # so the component keeps its footprint to two advanced rules: this WAF rule + the
  # rate-limit rule below.
  waf_rulesets = [
    "sqli-v33-stable",
    "xss-v33-stable",
    "lfi-v33-stable",
    "rfi-v33-stable",
    "rce-v33-stable",
    "scannerdetection-v33-stable",
    "protocolattack-v33-stable",
  ]
  # Cloud Armor allows at most 5 evaluatePreconfiguredWaf expressions per rule, so
  # the 7 rule sets are split across two rules (priorities 900/901) — two advanced
  # rules total for the WAF. Gated on var.mode (empty map in standby).
  waf_rule_groups = var.mode == "primary" ? {
    "900" = slice(local.waf_rulesets, 0, 5)
    "901" = slice(local.waf_rulesets, 5, length(local.waf_rulesets))
  } : {}

  # Per-ruleset OWASP rule IDs to opt out of (sensitivity-1 false positives we've
  # confirmed in the logs). Applied via evaluatePreconfiguredWaf's opt_out_rule_ids,
  # so the rest of each ruleset keeps enforcing — no extra advanced rule needed.
  #
  # 921150 (protocolattack) = "HTTP header injection via CR/LF in an argument NAME".
  # Typesense's /documents/import takes newline-delimited JSON (JSONL); with
  # json_parsing=STANDARD, Cloud Armor surfaces the record-separator '\n's as arg
  # names, so every bulk import trips 921150 (matchedFieldType=ARG_NAMES, value="\n").
  # Typesense never reflects request arg names into response headers, so this rule
  # adds no protection here. Opted out cluster-wide rather than path-scoped because a
  # path carve-out would cost a third advanced rule against the tight regional quota.
  waf_opt_out_rule_ids = {
    "protocolattack-v33-stable" = ["owasp-crs-v030301-id921150-protocolattack"]
  }

  # The CEL options fragment appended after 'sensitivity': 1 for each ruleset (empty
  # unless that ruleset has opt-outs above).
  waf_opt_out_fragment = {
    for rs in local.waf_rulesets :
    rs => contains(keys(local.waf_opt_out_rule_ids), rs) ? ", 'opt_out_rule_ids': [${join(", ", [for id in local.waf_opt_out_rule_ids[rs] : "'${id}'"])}]" : ""
  }

  # The full evaluatePreconfiguredWaf(...) clause per ruleset, opt-outs applied.
  waf_clauses = {
    for rs in local.waf_rulesets :
    rs => "evaluatePreconfiguredWaf('${rs}', {'sensitivity': 1${local.waf_opt_out_fragment[rs]}})"
  }
}

# Regional Cloud Armor (WAF) policy, attached to the Gateway backend via the
# GCPBackendPolicy in typesense.tf.
resource "google_compute_region_security_policy" "typesense" {
  count  = local.workload_count
  name   = "typesense-${var.region}-armor"
  region = var.region
  type   = "CLOUD_ARMOR"

  # STANDARD json_parsing lets the OWASP rules inspect JSON request bodies, which
  # is essential since Typesense's search/import endpoints are all JSON POSTs.
  # VERBOSE logging surfaces which WAF rule matched, which is essential for tuning.
  advanced_options_config {
    json_parsing = "STANDARD"
    log_level    = "VERBOSE"
  }
}

# OWASP preconfigured WAF rules. Rule sets are OR'd within each rule and split
# across two rules to respect the 5-expressions-per-rule limit while conserving the
# shared regional advanced-rules quota.
#
# preview = var.waf_preview (default true) ships these in PREVIEW mode: a match is
# logged as a would-be deny(403) but NOT enforced. The match still appears in the
# Cloud Armor request logs (policy log_level = VERBOSE above + backend request
# logging in typesense.tf), so you can review false positives against real Typesense
# JSON traffic and add per-ruleset exclusions before flipping waf_preview to false
# to enforce.
resource "google_compute_region_security_policy_rule" "waf" {
  for_each = local.waf_rule_groups

  region          = var.region
  security_policy = google_compute_region_security_policy.typesense[0].name
  action          = "deny(403)"
  preview         = var.waf_preview
  priority        = tonumber(each.key)
  description     = "OWASP CRS preconfigured WAF (group ${each.key}): ${join(", ", each.value)}"

  match {
    expr {
      expression = join(" || ", [for rs in each.value : local.waf_clauses[rs]])
    }
  }
}

# Allowlist trusted source IPs (the typesense-backfill function's static egress)
# past the WAF + rate limit. Priority 500 sits ABOVE the WAF (900/901) and the
# rate-limit (1000) rules; a match short-circuits evaluation to `allow` before
# either is reached, so the backfill can bulk-import without tripping the per-IP
# rate limit (and without the WAF's JSONL false positives).
#
# Only created when the workload is present AND an allowlist is configured, so
# stacks that don't set backfill_allowlist_ip_ranges are unaffected.
#
# NOTE: this fully exempts the listed IPs from the WAF too. That's intentional for
# our own trusted egress IP; if you ever allowlist a less-trusted source and want
# the WAF to still apply, give that rule a priority between 901 and 1000 instead.
resource "google_compute_region_security_policy_rule" "allowlist" {
  count           = local.workload_count > 0 && length(var.backfill_allowlist_ip_ranges) > 0 ? 1 : 0
  region          = var.region
  security_policy = google_compute_region_security_policy.typesense[0].name
  action          = "allow"
  priority        = 500
  description     = "Allowlist trusted source IPs (typesense-backfill static egress) past WAF + rate limit"

  match {
    versioned_expr = "SRC_IPS_V1"
    config {
      src_ip_ranges = var.backfill_allowlist_ip_ranges
    }
  }
}

# Per-IP rate limiting.
resource "google_compute_region_security_policy_rule" "rate_limit" {
  count           = local.workload_count
  region          = var.region
  security_policy = google_compute_region_security_policy.typesense[0].name
  action          = "rate_based_ban"
  priority        = 1000
  description     = "Rate-limit requests per source IP"

  match {
    versioned_expr = "SRC_IPS_V1"
    config {
      src_ip_ranges = ["*"]
    }
  }

  rate_limit_options {
    conform_action   = "allow"
    exceed_action    = "deny(429)"
    enforce_on_key   = "IP"
    ban_duration_sec = 300
    rate_limit_threshold {
      count        = 600
      interval_sec = 60
    }
  }
}

# Regional security policies require an explicit default rule.
resource "google_compute_region_security_policy_rule" "default" {
  count           = local.workload_count
  region          = var.region
  security_policy = google_compute_region_security_policy.typesense[0].name
  action          = "allow"
  priority        = 2147483647
  description     = "Default allow"

  match {
    versioned_expr = "SRC_IPS_V1"
    config {
      src_ip_ranges = ["*"]
    }
  }
}

# Certificate Manager REGIONAL managed cert, validated by DNS. The validation
# CNAME (cert_dns_authorization_record output) must be added to the external
# recidiviz.org zone before the cert leaves PROVISIONING.
resource "google_certificate_manager_dns_authorization" "typesense" {
  name     = "typesense-${var.region}-dnsauth"
  location = var.region
  domain   = var.hostname
  type     = "PER_PROJECT_RECORD"
}

resource "google_certificate_manager_certificate" "typesense" {
  count    = local.workload_count
  name     = "typesense-${var.region}-cert"
  location = var.region
  managed {
    domains            = [var.hostname]
    dns_authorizations = [google_certificate_manager_dns_authorization.typesense.id]
  }
}
