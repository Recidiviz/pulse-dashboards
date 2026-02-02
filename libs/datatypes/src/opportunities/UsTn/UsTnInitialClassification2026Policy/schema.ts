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

import { ParsedRecord } from "../../../utils/types";
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";
import {
  q1Notes,
  q2Notes,
  singleIncidentPeriodReportSchema,
  TrusteeFormAdditionalFields,
  trusteeFormSchema,
} from "../utils";

export const usTnInitialClassification2026Schema = opportunitySchemaBase.extend(
  {
    eligibleCriteria: z
      .object({
        custodyLevelIsNotMax: z.null(),
        notHasInitialClassificationInStatePrisonCustody: z.null(),
      })
      .partial()
      .passthrough(),
    ineligibleCriteria: z
      .object({
        custodyLevelIsNotMax: z.object({}).passthrough(),
        notHasInitialClassificationInStatePrisonCustody: z
          .object({})
          .passthrough(),
      })
      .partial()
      .passthrough(),
    formInformation: z
      .object({
        q1Score: z.coerce.number().nullable(),
        q2Score: z.coerce.number().nullable(),
        q3Score: z.coerce.number().nullable(),
        q4Score: z.coerce.number().nullable(),
        q5Score: z.coerce.number().nullable(),
        q6Score: z.coerce.number().nullable(),
        q1Notes,
        q2Notes,
        q3Notes: singleIncidentPeriodReportSchema,
        q4Notes: singleIncidentPeriodReportSchema,
        q5Notes: singleIncidentPeriodReportSchema,
      })
      .merge(trusteeFormSchema)
      .passthrough(),
  },
);

export type UsTnInitialClassification2026ReferralRecord = ParsedRecord<
  typeof usTnInitialClassification2026Schema
>;

export type UsTnInitialClassification2026DraftData =
  UsTnInitialClassification2026ReferralRecord["output"]["formInformation"] &
    TrusteeFormAdditionalFields & {
      q1Selection: number;
      q2Selection: number;
      q3Selection: number;
      q4Selection: number;
      q5Selection: number;
      q6Selection: number;
      q1aNotes: string;
      q1bNotes: string;
    };
