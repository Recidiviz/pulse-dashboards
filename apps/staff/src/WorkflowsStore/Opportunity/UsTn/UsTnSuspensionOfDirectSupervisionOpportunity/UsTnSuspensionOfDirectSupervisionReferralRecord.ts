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

export const usTnSuspensionOfDirectSupervisionSchema =
  opportunitySchemaBase.extend({
    eligibleCriteria: z.object({}).passthrough(),
    formInformation: z
      .object({
        convictionCounties: z.array(z.string()),
        convictionCharge: z.string(),
        sentenceDate: dateStringSchema,
        supervisionDuration: z.string(),
        supervisionOfficeLocation: z.string(),
      })
      .partial(),
    metadata: z
      .object({
        latestNegativeArrestCheck: z.object({
          contactDate: dateStringSchema,
          contactType: z.string(),
          contactComment: z.string().optional(),
        }),
      })
      .passthrough(),
  });

export type UsTnSuspensionOfDirectSupervisionReferralRecord = z.infer<
  typeof usTnSuspensionOfDirectSupervisionSchema
>;

export type UsTnSuspensionOfDirectSupervisionReferralRecordRaw = z.input<
  typeof usTnSuspensionOfDirectSupervisionSchema
>;

export type UsTnSuspensionOfDirectSupervisionDraftData = {
  downloadDate: string;
  clientName: string;
  externalId: string;
  address: string;
  phoneNumber: string;
  allConvictionCounties: string;
  convictionCharge: string;
  sentenceDate: string;
  expirationDate: string;
  supervisionDuration: string;
  assignedStaffFullName: string;
  district: string;
  supervisionOfficeLocation: string;
};
