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

import { dateStringSchema, opportunitySchemaBase } from "~datatypes";

export const usPaAdminSupervisionSchema = opportunitySchemaBase.extend({
  eligibleCriteria: z
    .object({
      usPaNoHighSanctionsInPastYear: z.object({}).nullable(),
      usPaNotServingIneligibleOffenseForAdminSupervision: z
        .object({
          ineligibleOffenses: z.array(z.string()),
          ineligibleSentencesExpirationDate: z.array(dateStringSchema),
        })
        .nullable(),
    })
    .passthrough(),
  formInformation: z
    .object({
      drugCharge: z.boolean(),
      statue14: z.boolean(),
      statue30: z.boolean(),
      statue37: z.boolean(),
    })
    .partial(),
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
  offense18_25: boolean;
  offense18_27: boolean;
  offense18_29: boolean;
  offense18_31: boolean;
  offense18_33: boolean;
  offense18_37: boolean;
  offense18_49: boolean;
  offense30_5502_1: boolean;
  offense75_3731: boolean;
  offense75_3732: boolean;
  offense75_3735: boolean;
  offense75_3735_1: boolean;
  offense75_3742: boolean;
  offensePersonalInjury: boolean;
  offensePFAOrder: boolean;
  offense18_4302: boolean;
  offense18_5901: boolean;
  offense18_5902b: boolean;
  offense18_5903: boolean;
  offense18_76: boolean;
  offense42_9795_1: boolean;
  offense18_6312: boolean;
  offense18_6318: boolean;
  offense18_6320: boolean;
  offense42_9712: boolean;
  offenseFirearms: boolean;
  offenseControlledSubstance: boolean;
  offense204_303: boolean;
  offenseSexuallyViolentPredator: boolean;
  criteriaHighSanction: boolean;
  criteriaFulfilledTreatmentRequirements: boolean;
  criteriaFulfilledSpecialConditions: boolean;
  criteriaFinancialEfforts: boolean;
  unreportedDispositions: boolean;
  eligibleForAdministrativeParole: boolean;
  guiltyPADrugCharge: boolean;
  noDispositionPADrugCharge: boolean;
  guiltyOOSDrugCharge: boolean;
  noDispositionOOSDrugCharge: boolean;
  charge780_11314: boolean;
  charge780_11330: boolean;
  charge780_11337: boolean;
  offense7508_a1: boolean;
  offense7508_a2: boolean;
  offense7508_a3: boolean;
  offense7508_a4: boolean;
  offense7508_a7: boolean;
  offense7508_a8: boolean;
  reviewICOTSRecords: boolean;
  notDeliveryRelated: boolean;
  unclearRecords: boolean;
};
