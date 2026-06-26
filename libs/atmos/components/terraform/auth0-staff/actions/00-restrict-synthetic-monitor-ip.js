// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

/*****************************************************************************
 * NOTE: This code is managed via Terraform.
 * See libs/atmos/components/terraform/Auth0
 *****************************************************************************/

/**
 * Restrict the synthetic-monitor test users to their Cloud NAT egress IP(s).
 *
 * The staff Synthetic Monitor (apps/@staff/synthetic-monitor-fn) signs in with
 * dedicated per-state test users whose credentials live in Secret Manager. To
 * contain the blast radius if one of those credentials ever leaks, these
 * accounts may ONLY authenticate from approved networks.
 *
 * Scope: this gate ONLY affects users flagged `app_metadata.synthetic_monitor`.
 * Every other login returns immediately and is completely unaffected.
 *
 * Fail-closed: for a monitor user, an empty/missing allowlist denies access —
 * these accounts must never authenticate without the allowlist configured. So
 * set the SYNTHETIC_MONITOR_ALLOWED_IPS secret BEFORE ordering this action into
 * the flow, or the monitor will start failing sign-in (and paging on-call).
 *
 * Audit/alerting: the deny is recorded by Auth0 as a Failed Login and forwarded
 * to BigQuery by the tenant log stream, so this action emits no analytics of its
 * own — alerting is built off those BQ rows.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */

exports.onExecutePostLogin = async (event, api) => {
  // Only synthetic-monitor accounts are subject to the IP allowlist; everyone
  // else is untouched. Keep this check first so real logins do zero extra work.
  // foo
  if (event.user.app_metadata?.synthetic_monitor !== true) {
    return;
  }

  const DENY_MESSAGE =
    "This account may only be used from approved networks. " +
    "If you are seeing this, contact security@recidiviz.org.";

  // Per-tenant allowlist of IP(s). Comma/space separated.
  // Should contain the monitoring egress IPs and Jamf Trust VPN IPs
  const allowedIps = (event.secrets.SYNTHETIC_MONITOR_ALLOWED_IPS || "")
    .split(/[\s,]+/)
    .map((ip) => ip.trim())
    .filter(Boolean);

  const requestIp = event.request.ip;
  if (allowedIps.length > 0 && allowedIps.includes(requestIp)) {
    return;
  }

  // Denied: a monitor credential was used from a disallowed IP.
  api.access.deny(DENY_MESSAGE);
};
