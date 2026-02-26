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
    // For these states, Edovo's IDs here are zero- padded but ours are not
    if (["US_ME", "US_NE"].includes(user.facility_state)) {
      return { ...user, inmate_id: user.inmate_id.replace(/^0+/, "") };
    }
    // For these states, our IDs are zero-padded but Edovo's are not
    if (["US_CO"].includes(user.facility_state)) {
      return { ...user, inmate_id: user.inmate_id.padStart(6, "0") };
    }

    return user;
  });

export type EdovoIdTokenPayload = z.infer<typeof edovoIdTokenPayloadSchema>;
