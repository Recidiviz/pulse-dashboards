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

import { createPrivateKey } from "crypto";
import { compactDecrypt } from "jose";
import { z } from "zod";

import { AuthorizedUserProfile } from "~@jii/auth";

import {
  checkEdovoTestAccountRoster,
  checkResidentsRoster,
} from "../../helpers/firebaseAdmin";
import { getRecidivizUserProfile } from "../../helpers/recidivizUsers";
import { secrets } from "../../helpers/secrets";

export const edovoIdTokenPayloadSchema = z
  .object({
    inmate_id: z.string(),
    facility_state: z
      .string()
      .toUpperCase()
      .transform((s) => `US_${s}`),
    facility_name: z.string().optional(),
  })
  .transform((user) => {
    // known cases where our ID formats do not match
    if (user.facility_state === "US_ME") {
      return { ...user, inmate_id: user.inmate_id.replace(/^0+/, "") };
    }
    if (user.facility_state === "US_NE") {
      return { ...user, inmate_id: user.inmate_id.replace(/^0+/, "") };
    }
    return user;
  });
export type EdovoIdTokenPayload = z.infer<typeof edovoIdTokenPayloadSchema>;

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
    await secrets.getLatestValue("SECURUS_TEST_FACILITIES"),
  );
  if (securusFacilities.includes(userData.facility_name)) {
    // all securus test accounts are mapped to the same test data, for consistency
    return {
      stateCode: "US_MA",
      permissions: [],
      externalId: "RES002",
      pseudonymizedId: "anonres002",
    };
  }
  return;
}

export async function getDecryptedToken(encryptedToken: string) {
  // decrypting gets us a signed JWT to pass on to the next middleware
  const { plaintext } = await compactDecrypt(
    encryptedToken,
    createPrivateKey(await secrets.getLatestValue("EDOVO_TOKEN_PRIVATE_KEY")),
  );

  return plaintext.toString();
}
