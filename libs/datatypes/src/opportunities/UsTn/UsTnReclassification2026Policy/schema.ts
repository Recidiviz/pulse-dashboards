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
  multiIncidentPeriodReportSchema,
  q1Notes,
  q2Notes,
  q7Notes,
  TrusteeFormSchema,
  trusteeFormSchema,
} from "../utils";

const q6Notes = z
  .object({
    age: z.number(),
  })
  .optional();

export const usTnReclassification2026Schema = opportunitySchemaBase.extend({
  formInformation: z
    .object({
      q1Score: z.coerce.number().nullable(),
      q2Score: z.coerce.number().nullable(),
      q3Score: z.coerce.number().nullable(),
      q4Score: z.coerce.number().nullable(),
      q5Score: z.coerce.number().nullable(),
      q6Score: z.coerce.number().nullable(),
      q7Score: z.coerce.number().nullable(),
      q1Notes,
      q2Notes,
      q3Notes: multiIncidentPeriodReportSchema,
      q4Notes: multiIncidentPeriodReportSchema,
      q5Notes: multiIncidentPeriodReportSchema,
      q6Notes,
      q7Notes,
    })
    .merge(trusteeFormSchema)
    .passthrough(),
});

export type UsTnReclassification2026ReferralRecord = ParsedRecord<
  typeof usTnReclassification2026Schema
>;

export type UsTnReclassification2026DraftData =
  UsTnReclassification2026ReferralRecord["output"]["formInformation"] &
    TrusteeFormSchema & {
      q1Selection: number;
      q2Selection: number;
      q3Selection_0_6: number;
      q3Selection_6_12: number;
      q4Selection_0_6: number;
      q4Selection_6_12: number;
      q5Selection_0_6: number;
      q5Selection_6_12: number;
      q5Selection_12_18: number;
      q5Selection_18_36: number;
      q5Selection_36_60: number;
      q6Selection: number;
      q7Selection: number;
      q1aNotes: string;
      q1bNotes: string;
      q3NotesFormatted: string;
      q4NotesFormatted: string;
      q5NotesFormatted: string;
    };
