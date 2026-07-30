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

import { z } from "zod";

export const edovoIdTokenPayloadSchema = z
  .object({
    inmate_id: z.string(),
    facility_state: z
      .string()
      .toUpperCase()
      .transform((s) => `US_${s}`),
    facility_name: z.string().optional(),
    language: z.string().optional(),
  })
  .transform((user) => {
    let facilityState = user.facility_state;

    // Edovo uses "NY" for all NY facilities; since our state code for NYC is `US_NYC`,
    // we use facility_name to distinguish it from a future NYDOC deployment
    if (
      user.facility_state === "US_NY" &&
      user.facility_name?.startsWith("NYC DOC")
    ) {
      facilityState = "US_NYC";
    }

    const normalizedUser = { ...user, facility_state: facilityState };

    // For these states, Edovo's IDs here are zero-padded but ours are not
    if (["US_ME", "US_NE", "US_AZ"].includes(normalizedUser.facility_state)) {
      return {
        ...normalizedUser,
        inmate_id: normalizedUser.inmate_id.replace(/^0+/, ""),
      };
    }
    // For these states, our IDs are zero-padded but Edovo's are not
    if (["US_CO"].includes(normalizedUser.facility_state)) {
      return {
        ...normalizedUser,
        inmate_id: normalizedUser.inmate_id.padStart(6, "0"),
      };
    }

    return normalizedUser;
  });

export type EdovoIdTokenPayload = z.infer<typeof edovoIdTokenPayloadSchema>;
