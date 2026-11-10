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
  providerExternalId,
  resolveMessengerUserHash,
  staffExternalId,
} from "./intercom.helpers";
import type { MessengerAuth } from "./intercom.types";

/**
 * `userId` is the same namespaced external_id the backend contact sync uses
 * (`staff:<pseudonymizedId>` / `provider:<providerUser.id>`), so the Messenger
 * attaches to the already-synced contact instead of spawning a duplicate.
 *
 * No PII (name/email) is ever returned here.
 */
function signMessengerIdentity(userId: string): MessengerAuth {
  return { userId, userHash: resolveMessengerUserHash(userId) };
}

export function getStaffMessengerAuth(
  staffPseudonymizedId: string,
): MessengerAuth {
  return signMessengerIdentity(staffExternalId(staffPseudonymizedId));
}

/**
 * The Intercom contact is the person, not the organization, so the external_id
 * is keyed by the HousingProviderUser row id — the same id the contact sync
 * writes. `providerProcedure` has already resolved it from the caller's
 * pseudonymizedId, so there is nothing to look up here.
 */
export function getProviderMessengerAuth(
  providerUserId: string,
): MessengerAuth {
  return signMessengerIdentity(providerExternalId(providerUserId));
}
