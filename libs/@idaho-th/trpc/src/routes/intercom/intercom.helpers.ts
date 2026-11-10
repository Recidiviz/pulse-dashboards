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

import { INTERCOM_EXTERNAL_ID_NAMESPACE } from "~@idaho-th/trpc/intercom/intercom.constants";
import { buildExternalId } from "~@idaho-th/trpc/intercom/intercom.mapper";
import { computeIntercomUserHash } from "~@idaho-th/trpc/intercom/intercom.messenger";
import { getOptionalEnv } from "~@idaho-th/trpc/routes/common/env";

import { INTERCOM_MESSENGER_ENV } from "./intercom.constants";
export function staffExternalId(staffPseudonymizedId: string): string {
  return buildExternalId(
    INTERCOM_EXTERNAL_ID_NAMESPACE.STAFF,
    staffPseudonymizedId,
  );
}

export function providerExternalId(providerUserId: string): string {
  return buildExternalId(
    INTERCOM_EXTERNAL_ID_NAMESPACE.PROVIDER,
    providerUserId,
  );
}

/**
 * Non-null only when Identity Verification is configured for the workspace. The
 * secret is read here and never leaves the server.
 */
export function resolveMessengerUserHash(userId: string): string | null {
  const secret = getOptionalEnv(
    INTERCOM_MESSENGER_ENV.IDENTITY_VERIFICATION_SECRET,
  );
  return secret ? computeIntercomUserHash(userId, secret) : null;
}
