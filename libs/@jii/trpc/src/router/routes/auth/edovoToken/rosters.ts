// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { z } from "zod";

import { AuthorizedUserProfile } from "~@jii/auth";

import { getRecidivizUserProfile } from "../../../../auth/recidivizUsers";
import {
  checkEdovoTestAccountRoster,
  checkResidentsRoster,
} from "../../../../auth/roster";
import type { EdovoIdTokenPayload } from "./payload";

export async function lookupResident(
  userData: EdovoIdTokenPayload,
): Promise<AuthorizedUserProfile | undefined> {
  return checkResidentsRoster(userData.facility_state, userData.inmate_id);
}

export async function checkRecidivizEmployeeRoster(
  userData: EdovoIdTokenPayload,
): Promise<AuthorizedUserProfile | undefined> {
  const employeeRecord = await checkEdovoTestAccountRoster(userData.inmate_id);

  if (!employeeRecord) return;

  const { email } = z.object({ email: z.string() }).parse(employeeRecord);

  return getRecidivizUserProfile(email);
}

const securusSecretSchema = z
  .string()
  .transform((s) => JSON.parse(s))
  .pipe(z.array(z.string()));

export async function securusTestIdentity(
  userData: EdovoIdTokenPayload,
): Promise<AuthorizedUserProfile | undefined> {
  if (!userData.facility_name) return;

  const securusFacilities = securusSecretSchema.parse(
    process.env["SECURUS_TEST_FACILITIES"],
  );
  if (securusFacilities.includes(userData.facility_name)) {
    // all securus test accounts are mapped to the same test data, for consistency
    return {
      stateCode: "US_AZ",
      permissions: [],
      externalId: "RES001",
      pseudonymizedId: "anonres001",
    };
  }
  return;
}
