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

import type { Prisma } from "~@idaho-th/prisma/client";
import { isRider } from "~@idaho-th/shared";

import {
  HOUSING_APPLICATION_NOT_FOUND,
  throwHousingApplicationNotFound,
} from "./housingApplication.errors";

type StaffOwnedApplication = {
  staffApplication: { staffPseudonymizedId: string } | null;
};

/** Scopes a HousingApplication query to the owning staff — every read/write must filter through one of these. */
export function buildApplicationWhereForStaff(
  applicationId: string,
  staffPseudonymizedId: string,
): Prisma.HousingApplicationWhereInput {
  return {
    id: applicationId,
    staffApplication: { staffPseudonymizedId },
  };
}

/**
 * Scopes a HousingApplication query to the organization the caller is acting as
 * — every provider read/write must filter through this.
 *
 * `providerId` is the verified active organization from `ctx.providerId`, never
 * the person's pseudonymized id: colleagues at one organization share a queue,
 * and a person managing two organizations must not reach the other one's rows.
 */
export function buildApplicationWhereForProvider(
  applicationId: string,
  providerId: string,
): Prisma.HousingApplicationWhereInput {
  return {
    id: applicationId,
    providerApplications: { some: { providerId } },
  };
}

export function requireStaffOwnsApplication<
  TApplication extends StaffOwnedApplication,
>(
  application: TApplication | null,
  staffPseudonymizedId: string,
): asserts application is TApplication {
  if (
    application != null &&
    application.staffApplication?.staffPseudonymizedId === staffPseudonymizedId
  ) {
    return;
  }
  throwHousingApplicationNotFound(
    HOUSING_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
  );
}

export function requireProviderOwnedApplication<
  TProviderApplications extends readonly { id: string }[],
>(
  providerApplications: TProviderApplications,
): NonNullable<TProviderApplications[number]> {
  const providerApp = providerApplications[0];
  if (providerApp != null) {
    return providerApp;
  }
  throwHousingApplicationNotFound(
    HOUSING_APPLICATION_NOT_FOUND.PROVIDER_APPLICATION_FOR_PROVIDER,
  );
}

export const HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS = {
  maxWait: 5000,
  timeout: 10000,
} as const;

export async function lockHousingApplicationForUpdate(
  client: Prisma.TransactionClient,
  applicationId: string,
): Promise<void> {
  const lockedApplication = await client.$queryRaw<{ id: string }[]>`
    SELECT id FROM "HousingApplication"
    WHERE id = ${applicationId}
    FOR UPDATE
  `;

  if (lockedApplication.length === 0) {
    throwHousingApplicationNotFound(HOUSING_APPLICATION_NOT_FOUND.APPLICATION);
  }
}

/**
 * The release-flow cohort of a stored `formData` blob. The column is untyped
 * JSON, so anything other than a string Q6 counts as Termer/PV (see isRider).
 */
export function isRiderFormData(formData: Prisma.JsonValue): boolean {
  if (
    typeof formData !== "object" ||
    formData === null ||
    Array.isArray(formData)
  ) {
    return false;
  }

  const value = formData["legalCurrentStatus"];
  return isRider(typeof value === "string" ? value : null);
}
