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

import {
  isAllowlistedRecidivizStaffEmail,
  isRecidivizStaffEmail,
  parseStaffEmailAllowlist,
} from "~@idaho-th/shared";
import { getOptionalEnv } from "~@idaho-th/trpc/routes/common/env";

/**
 * Whether this Recidiviz address has been granted Idaho TH staff access.
 *
 * Named for Recidiviz specifically, because it answers for nobody else: a
 * fully authorized @idoc.idaho.gov staffer gets `false` here. Their grant is
 * the Admin Panel roster, which the Action reads directly on every login, and
 * a name that implied this covered them would be a trap.
 *
 * Recidiviz staff are on no roster, and the connection they arrive on is
 * shared tenant-wide across every state's app — an account on it means an
 * admin created it for some application, not that anyone granted this person
 * Idaho TH. So the grant has to be recorded somewhere, and this is where. It
 * lives in a system this team owns rather than in Recidiviz's auth bucket, so
 * granting access does not depend on another team.
 *
 * Deliberately requires the @recidiviz.org domain as well as a list entry, so
 * a mis-set secret cannot hand staff access to an arbitrary address.
 *
 * The list is the starting implementation, not the design. When staff
 * provisioning gets a real home — a table, an admin screen — only this
 * function changes; the webhook contract and the Action stay as they are.
 */
export function isRecidivizStaffAuthorized(email: string): boolean {
  // Staging has no provisioning flow and its testers change constantly, so the
  // domain is the grant there — matching how the sign-in router already treats
  // staging. Production requires the explicit entry.
  if (getOptionalEnv("APP_ENV") === "staging") {
    return isRecidivizStaffEmail(email);
  }

  return isAllowlistedRecidivizStaffEmail(
    email,
    parseStaffEmailAllowlist(
      getOptionalEnv("IDAHO_TH_RECIDIVIZ_STAFF_ALLOWLIST"),
    ),
  );
}
