// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

export const sentenceTypeSchema = z.enum(["PROBATION", "PAROLE", "DUAL"]);

export const crcSharedCriteria = z
  .object({
    custodyLevelIsMinimum: z.object({
      custodyLevel: z.string(),
    }),
    notServingForSexualOffense: z.object({}).nullable().optional(),
    notServingForViolentOffense: z.object({}).nullable().optional(),
    usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: z
      .object({})
      .nullable(),
    usIdNotDetainersForXcrcAndCrc: z.object({}).nullable(),
  })
  .passthrough();

export const crcSharedIneligibleCriteria = crcSharedCriteria.pick({
  notServingForViolentOffense: true,
});
