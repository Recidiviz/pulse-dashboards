// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import {
  caseNotesSchema,
  dateStringSchema,
  opportunitySchemaBase,
} from "./schemaHelpers";
import {
  custodyLevelIsMinimum,
  noAbsconsionWithin10Years,
  notServingForSexualOffense,
  usIdNoEludingPoliceOffenseWithin10Years,
  usIdNoEscapeOffenseWithin10Years,
} from "./UsIdSharedCriteria";

export const usIdExpandedCRCSchema = opportunitySchemaBase
  .extend({
    eligibleCriteria: z.object({
      custodyLevelIsMinimum,
      notServingForSexualOffense,
      noAbsconsionWithin10Years,
      usIdNoEludingPoliceOffenseWithin10Years,
      usIdNoEscapeOffenseWithin10Years,
      usIdNoDetainersForXcrc: z.object({}).nullable(),
      usIdIncarcerationWithin6MonthsOfFtcdOrPedOrTpd: z.object({
        fullTermCompletionDate: dateStringSchema.nullable(),
        paroleEligibilityDate: dateStringSchema.nullable(),
        tentativeParoleDate: dateStringSchema.nullable(),
      }),
      usIdInCrcFacility: z.object({
        crcStartDate: dateStringSchema,
        facilityName: z.string(),
      }),
      usIdInCrcFacilityFor60Days: z.object({
        sixtyDaysInCrcFacilityDate: dateStringSchema,
      }),
    }),
    ineligibleCriteria: z.object({}),
  })
  .merge(caseNotesSchema);

export type UsIdExpandedCRCReferralRecord = z.infer<
  typeof usIdExpandedCRCSchema
>;

export type UsIdExpandedCRCReferralRecordRaw = z.input<
  typeof usIdExpandedCRCSchema
>;
