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

import { dateStringSchema, nullishAsUndefined } from "../../../../utils/zod";
import { paroleBoardClientProfileSchema } from "../../paroleBoardClientProfileSchema";

const creditTypeSchema = z.enum([
  "EARNED_TIME",
  "GOOD_TIME",
  "ACHIEVEMENT",
  "OTHER",
  "PROJECTED_EARNED_TIME_FINAL_3_MONTHS",
]);

export const usCoEarnedCreditActivitySchema = z.object({
  creditDate: dateStringSchema,
  creditType: nullishAsUndefined(creditTypeSchema),
  creditsEarned: nullishAsUndefined(z.number()),
  goodTimeChangeReason: z.string().nullable(),
  earnedTimeStatus: z.string().nullable(),
});

export const usCoResidentJiiDataSchema = z.object({
  stateCode: z.literal("US_CO"),
  incarcerationStartDate: dateStringSchema.nullable(),
  mrdTent: nullishAsUndefined(dateStringSchema),
  pedTent: nullishAsUndefined(dateStringSchema),
  sddTent: nullishAsUndefined(dateStringSchema),
  creditActivity: z.array(usCoEarnedCreditActivitySchema),
  lastUpdatedDate: nullishAsUndefined(dateStringSchema),
  cohortLabel: z.enum([
    "STANDARD",
    "INDETERMINATE_LIFE_WITH_PAROLE",
    "LIFE_WITH_PAROLE",
    "LIFE_WITHOUT_PAROLE",
    "INTERSTATE_COMPACT",
  ]),
  // The resident's soonest upcoming Parole Board hearing (backend field
  // next_parole_hearing_date), read by FirestoreStore.getResidentsForState
  // to filter the docket query server-side instead of fetching every US_CO
  // resident and windowing client-side. A plain ISO string, not
  // dateStringSchema (which parses to a Date) -- Firestore's inequality
  // operators compare the raw stored value, and the rest of the parole
  // hearing code (ParoleHearing.hearingDate) already relies on plain
  // string ordering rather than Date parsing for exactly this reason.
  // TEMPORARY: lives under metadata for now because that's where the
  // current sandbox upload puts it. TODO(OBT-47979): move this to
  // WorkflowsResidentRecord's top level (and update the query's field path
  // to match) once the real backend export does the same.
  nextParoleHearingDate: nullishAsUndefined(z.string()),
  paroleBoardClientProfile: paroleBoardClientProfileSchema.optional(),
});

export type RawUsCoResidentJiiData = z.input<typeof usCoResidentJiiDataSchema>;
export type UsCoResidentJiiData = z.output<typeof usCoResidentJiiDataSchema>;
export type UsCoEarnedCreditActivity = z.output<
  typeof usCoEarnedCreditActivitySchema
>;
export type UsCoCreditType = z.output<typeof creditTypeSchema>;
