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

import { TokenAuthUser } from "~auth0-jii";

import { getFirestore } from "../../helpers/firebaseAdmin";
import { getAllowedStates } from "../../helpers/recidivizAllowedStates";

export const edovoIdTokenPayloadSchema = z
  .object({ USER_ID: z.string(), STATE: z.string().toUpperCase() })
  .transform((user) => {
    // known cases where our ID formats do not match
    if (user.STATE === "ME") {
      return { ...user, USER_ID: user.USER_ID.replace(/^0+/, "") };
    }
    return user;
  });
type EdovoIdTokenPayload = z.infer<typeof edovoIdTokenPayloadSchema>;

export async function checkResidentsRoster(
  userData: EdovoIdTokenPayload,
): Promise<TokenAuthUser | undefined> {
  const stateCode = `US_${userData.STATE}`;
  const userResidentRecord = (
    await (await getFirestore())
      .doc(`residents/${stateCode.toLowerCase()}_${userData.USER_ID}`)
      .get()
  ).data();

  if (!userResidentRecord) return;

  // in practice this should always parse, but we can't import the full schema from ~datatypes
  // due to Vite dependency issues. We only care about this field anyway
  const { pseudonymizedId } = z
    .object({ pseudonymizedId: z.string() })
    .parse(userResidentRecord);

  return {
    stateCode,
    externalId: userData.USER_ID,
    pseudonymizedId,
    permissions: ["live_data"],
  };
}

export async function checkRecidivizEmployeeRoster(
  userData: EdovoIdTokenPayload,
): Promise<TokenAuthUser | undefined> {
  const employeeRecord = (
    await (await getFirestore())
      .doc(`JII-edovoToRecidivizMappings/${userData.USER_ID}`)
      .get()
  ).data();

  if (!employeeRecord) return;

  const { email, name } = z
    .object({ email: z.string(), name: z.string().optional() })
    .parse(employeeRecord);

  return {
    stateCode: "RECIDIVIZ",
    name,
    allowedStates: await getAllowedStates(email),
    permissions: ["enhanced", "live_data"],
  };
}
