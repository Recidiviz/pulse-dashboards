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

import {
  dateStringSchema,
  eligibleDateSchema,
  opportunitySchemaBase,
} from "../../schemaHelpers";

export const usPaAdminSupervisionSchema = opportunitySchemaBase.extend({
  eligibleCriteria: z.object({
    usPaNoHighSanctionsInPastYear: z
      .object({
        latestHighSanctionDate: dateStringSchema,
      })
      .nullable(),
    usPaFulfilledRequirements: eligibleDateSchema.nullable(),
    usPaNotServingIneligibleOffenseForAdminSupervision: z
      .object({
        ineligibleOffenses: z.array(z.string()),
        ineligibleSentencesExpirationDate: z.array(dateStringSchema),
      })
      .nullable(),
    supervisionLevelIsNotLimited: z
      .object({
        limitedStartDate: dateStringSchema.nullable(),
        supervisionLevel: z.string(),
      })
      .nullable(),
  }),
  ineligibleCriteria: z.object({}),
});

export type UsPaAdminSupervisionReferralRecord = z.infer<
  typeof usPaAdminSupervisionSchema
>;

export type UsPaAdminSupervisionReferralRecordRaw = z.input<
  typeof usPaAdminSupervisionSchema
>;

export type UsPaAdminSupervisionDraftData = {
  reentrantName: string;
  paroleNumber: string;
  dateOfReview: string;
  currentGradeOfSupervisionLevel: string;
};
