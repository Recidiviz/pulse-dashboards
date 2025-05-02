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

import { AuthorizedUserProfile } from "~auth0-jii";

import {
  checkResidentsRoster,
  getFirestore,
} from "../../helpers/firebaseAdmin";
import { getRecidivizUserProfile } from "../../helpers/recidivizUsers";

export const edovoIdTokenPayloadSchema = z
  .object({
    USER_ID: z.string(),
    STATE: z
      .string()
      .toUpperCase()
      .transform((s) => `US_${s}`),
  })
  .transform((user) => {
    // known cases where our ID formats do not match
    if (user.STATE === "US_ME") {
      return { ...user, USER_ID: user.USER_ID.replace(/^0+/, "") };
    }
    return user;
  });
type EdovoIdTokenPayload = z.infer<typeof edovoIdTokenPayloadSchema>;

export async function lookupResident(
  userData: EdovoIdTokenPayload,
): Promise<AuthorizedUserProfile | undefined> {
  return checkResidentsRoster(userData.STATE, userData.USER_ID);
}

export async function checkRecidivizEmployeeRoster(
  userData: EdovoIdTokenPayload,
): Promise<AuthorizedUserProfile | undefined> {
  const employeeRecord = (
    await (await getFirestore())
      .doc(`JII-edovoToRecidivizMappings/${userData.USER_ID}`)
      .get()
  ).data();

  if (!employeeRecord) return;

  const { email } = z.object({ email: z.string() }).parse(employeeRecord);

  return getRecidivizUserProfile(email);
}
