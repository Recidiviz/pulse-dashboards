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
import type {
  IntercomContactInput,
  ProviderContactSource,
  StaffContactSource,
} from "~@idaho-th/trpc/intercom/intercom.types";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function buildExternalId(namespace: string, id: string): string {
  return `${namespace}:${id}`;
}

export function mapProviderToIntercomContact(
  provider: ProviderContactSource,
): IntercomContactInput | null {
  const email = provider.email ? normalizeEmail(provider.email) : "";
  const providerId = provider.id.trim();
  if (!email || !providerId) return null;

  const name = provider.name.trim();
  return {
    email,
    externalId: buildExternalId(
      INTERCOM_EXTERNAL_ID_NAMESPACE.PROVIDER,
      providerId,
    ),
    ...(name ? { name } : {}),
  };
}

export function mapStaffToIntercomContact(
  staff: StaffContactSource,
): IntercomContactInput | null {
  const email = normalizeEmail(staff.email);
  const pseudonymizedId = staff.pseudonymizedId.trim();
  if (!email || !pseudonymizedId) return null;

  return {
    email,
    externalId: buildExternalId(
      INTERCOM_EXTERNAL_ID_NAMESPACE.STAFF,
      pseudonymizedId,
    ),
  };
}
