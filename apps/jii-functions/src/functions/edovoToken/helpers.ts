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

import { AuthorizedUserProfile } from "~auth0-jii";

import {
  checkResidentsRoster,
  getFirestore,
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
  })
  .transform((user) => {
    // known cases where our ID formats do not match
    if (user.facility_state === "US_ME") {
      return { ...user, inmate_id: user.inmate_id.replace(/^0+/, "") };
    }
    return user;
  });
type EdovoIdTokenPayload = z.infer<typeof edovoIdTokenPayloadSchema>;

export async function lookupResident(
  userData: EdovoIdTokenPayload,
): Promise<AuthorizedUserProfile | undefined> {
  return checkResidentsRoster(userData.facility_state, userData.inmate_id);
}

export async function checkRecidivizEmployeeRoster(
  userData: EdovoIdTokenPayload,
): Promise<AuthorizedUserProfile | undefined> {
  const employeeRecord = (
    await (await getFirestore())
      .doc(`JII-edovoToRecidivizMappings/${userData.inmate_id}`)
      .get()
  ).data();

  if (!employeeRecord) return;

  const { email } = z.object({ email: z.string() }).parse(employeeRecord);

  return getRecidivizUserProfile(email);
}

export async function getDecryptedToken(encryptedToken: string) {
  // decrypting gets us a signed JWT to pass on to the next middleware
  const { plaintext } = await compactDecrypt(
    encryptedToken,
    createPrivateKey(await secrets.getLatestValue("EDOVO_TOKEN_PRIVATE_KEY")),
  );

  return plaintext.toString();
}
