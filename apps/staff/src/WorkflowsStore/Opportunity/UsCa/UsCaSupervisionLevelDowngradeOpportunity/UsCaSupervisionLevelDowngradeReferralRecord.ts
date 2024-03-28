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

import { dateStringSchema } from "~datatypes";

export const usCaSupervisionLevelDowngradeSchema = z.object({
  stateCode: z.string(),
  externalId: z.string(),
  formInformation: z.object({
    cdcno: z.string(),
  }),
  eligibleCriteria: z.object({
    noSupervisionViolationWithin6Months: z.object({}).nullable(),
    supervisionLevelIsHighFor6Months: z.object({
      highStartDate: dateStringSchema,
    }),
    usCaAssessmentLevel3OrLower: z.object({}).nullable(),
    usCaHousingTypeIsNotTransient: z.object({}).nullable(),
  }),
  ineligibleCriteria: z.object({}),
});

export type UsCaSupervisionLevelDowngradeReferralRecordRaw = z.input<
  typeof usCaSupervisionLevelDowngradeSchema
>;

export type UsCaSupervisionLevelDowngradeReferralRecord = z.infer<
  typeof usCaSupervisionLevelDowngradeSchema
>;

export type UsCaSupervisionLevelDowngradeDraftData = {
  cdcNumber: string;
  fullName: string;
  lastReleaseDate: string;
  unit: string;
  offense: string;
  csraScore: string;
  supervisionLevel: string;
  reviewType: "ABBREVIATED" | "STANDARD" | "DISCHARGE";
  seeDischargeReport: boolean;
  dischargeReportDate: string;
  objectiveScore1: number;
  objectiveScore2: number;
  objectiveScore3: number;
  objectiveScore4: number;
  objectiveScore5: number;
  form1650Attached: boolean;
  additionalReportAttached: boolean;
  moveToNewCategory: boolean;
  newCategory: string;
  dateNotified: string;
  notifiedInPerson: boolean;
  notifiedByMail: boolean;
  notifiedByPhone: boolean;
  notifiedByEmail: boolean;
  notifiedByLetter: boolean;
  paroleePresent: "YES" | "NO" | "NOT_REQUIRED";
  paroleeNotPresent: "TELEPHONED" | "FAILED" | "DECLINED" | "NOT_RESPOND";
  cdcr1502DRProvided: boolean;
  reasonableAccommodationProvided: boolean;
  accommodationDescription: string;
  otherParticipant1Name: string;
  otherParticipant1Relation: string;
  otherParticipant1Comments: string;
  otherParticipant2Name: string;
  otherParticipant2Relation: string;
  otherParticipant2Comments: string;
  agentSignatureBadge: string;
  agentSignatureDate: string;
  supervisorComments: string;
  supervisorDecision: "REMAIN" | "MOVE" | "SCHEDULE";
  supervisorNewCategory: string;
  supervisorEffectiveDate: string;
  dischargeCommitteeAction: "DISCHARGE" | "RETAIN" | "DEFER";
  presidingAuthorityName: string;
  dischargeCommitteeComments: string;
  supervisorSignatureBadge: string;
  supervisorSignatureDate: string;
};
