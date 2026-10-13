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

import { ParsedRecord } from "../../../utils/types";
import { dateStringSchema } from "../../../utils/zod";
import { opportunitySchemaBase } from "../../utils/opportunitySchemaBase";
import { usMiClassificationFormBaseSchema } from "./utils";

export const usMiInitialClassificationSchema = opportunitySchemaBase.extend({
  eligibleCriteria: z
    .object({
      notHasInitialClassificationInStatePrisonCustody: z.null(),
    })
    .partial()
    .passthrough(),
  formInformation: usMiClassificationFormBaseSchema.extend({
    prevLevelFiveNotes: z
      .object({
        hadPrevTrueLevel5Release: z.coerce.number(),
        prevReleaseDate: dateStringSchema.nullable(),
        prevReleaseTrueLevel: z.string().nullable(),
      })
      .nullable(),
    prevLevelFiveScore: z.coerce.number().nullable(),
  }),
});

export type UsMiInitialClassificationRecord = ParsedRecord<
  typeof usMiInitialClassificationSchema
>;

export type UsMiFormInitialInformation =
  UsMiInitialClassificationRecord["output"]["formInformation"];

export type UsMiInitialClassification2026DraftData =
  UsMiFormInitialInformation & {
    s1q1Selection: number;
    s1q2Selection: number;

    s2q3Selection: number;
    s2q4Selection: number;

    s3q5Selection: number;
    s3q6Selection: number;
    s3q7Selection: number;
    s3q8Selection: number;
    s3q9Selection: number;
    s3q10Selection: number;
    s3q11Selection: number;
  };
