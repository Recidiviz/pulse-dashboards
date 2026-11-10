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

import { type IdahoThAppMetadata } from "~@idaho-th/shared";
import {
  APP_METADATA_KEY,
  USER_ROLE,
  USER_ROLES,
  type UserRole,
} from "~@idaho-th/trpc/auth/constants";

export type ParsedAuth0User = {
  role: UserRole;
  appMetadata: IdahoThAppMetadata;
  staffPseudonymizedId?: string;
  providerPseudonymizedId?: string;
};

function isUserRole(value: string | undefined): value is UserRole {
  return (
    value !== undefined && (USER_ROLES as readonly string[]).includes(value)
  );
}

export function parseAuth0User(
  payload: Record<string, unknown>,
): ParsedAuth0User | undefined {
  const rawMetadata = payload[APP_METADATA_KEY];
  const appMetadata: IdahoThAppMetadata =
    rawMetadata !== null &&
    typeof rawMetadata === "object" &&
    !Array.isArray(rawMetadata)
      ? (rawMetadata as IdahoThAppMetadata)
      : {};

  const role = isUserRole(appMetadata.role) ? appMetadata.role : undefined;
  const pseudonymizedId = appMetadata.pseudonymizedId;

  if (
    !role ||
    typeof pseudonymizedId !== "string" ||
    pseudonymizedId.length === 0
  ) {
    return undefined;
  }

  return {
    role,
    appMetadata,
    staffPseudonymizedId:
      role === USER_ROLE.STAFF ? pseudonymizedId : undefined,
    providerPseudonymizedId:
      role === USER_ROLE.PROVIDER ? pseudonymizedId : undefined,
  };
}
