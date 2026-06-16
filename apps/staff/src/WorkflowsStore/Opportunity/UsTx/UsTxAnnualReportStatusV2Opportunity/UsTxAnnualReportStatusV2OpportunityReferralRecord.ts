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

import {
  dateStringSchemaWithoutTimeShift,
  opportunitySchemaBase,
} from "~datatypes";

import type { UsTxArsErsSharedDraftData } from "../UsTxArsErsSharedUtils";
import { usTxArsErsSharedFormInformationSchema } from "../UsTxEarlyReleaseFromSupervisionOpportunityReferralRecord";

export const usTxAnnualReportStatusV2Schema = opportunitySchemaBase.extend({
  formInformation: usTxArsErsSharedFormInformationSchema,
  metadata: z
    .object({
      grantedAt: dateStringSchemaWithoutTimeShift.nullish(),
    })
    .passthrough(),
});

export type UsTxAnnualReportStatusV2ReferralRecord = z.infer<
  typeof usTxAnnualReportStatusV2Schema
>;

export type UsTxAnnualReportStatusV2DraftData = UsTxArsErsSharedDraftData & {
  threeYearsTRASCheck: boolean;
  comment1: string;
  complianceFeesAndEducationCheck: boolean;
  comment2: string;
  comment3: string;
  comment4: string;
  comment5: string;
};
