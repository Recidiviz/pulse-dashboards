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

import { dateStringSchema, opportunitySchemaBase } from "~datatypes";

export const usMoWorkReleaseSchema = opportunitySchemaBase.extend({
  formInformation: z.object({
    historyEscapesAbsconsions: z
      .object({
        eventDate: dateStringSchema,
        eventType: z.string(),
      })
      .array(),
    historyViolationsLast24Months: z
      .object({
        violationCode: z.string(),
        violationDate: dateStringSchema,
      })
      .array(),
  }),
  metadata: z
    .object({
      currentC3Sanctions: z
        .object({
          sanctionStartDate: dateStringSchema,
          sanctionEndDate: dateStringSchema,
        })
        .array(),
    })
    .passthrough(),
});

export type UsMoWorkReleaseReferralRecord = z.output<
  typeof usMoWorkReleaseSchema
>;

export type UsMoWorkReleaseDraftData = {
  institution: string;
  date: string;
  offenderName: string;
  docId: string;
  housingUnit: string;
  scoreM: string;
  scoreMH: string;
  scoreP: string;
  scoreI: string;
  scoreE: string;
  scoreC: string;
  fullDuty: boolean;
  limitedDuty: boolean;
  sentence: string;
  sentenceTrimmed: string;
  releaseDatesType: string;
  detailsReleaseDates: string;
  detainer: string;
  completedPrograms: string;
  completedProgramsTrimmed: string;
  incarcerationAdjustmentRecord: string;
  incarcerationAdjustmentRecordTrimmed: string;
  substanceUseHistory: string;
  organizedCrimeInvolvement: string;
  historyOfViolence: string;
  historyOfChildAbuse: boolean;
  historyOfSexualAbuse: boolean;
  otherOffense: boolean;
  offenseHistoryText: string;
  escapeAbscond: string;
  summary: string;
  additionalInformationNotPreviouslyAddressed: string;
  workReleaseOutsideAssignmentInformation: string;
  opportunityName: string;
};
