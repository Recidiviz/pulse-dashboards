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

import { dateStringSchema, residentCommonSchema } from "~datatypes";

import { camelCaseObject } from "./utils/camelCaseObject";

export const rnaWritebackSchema = z.object({
  pseudonymized_id: z.string(),
  seq_number: z.string().nullish(),
  opus_id: z.string(),
  admit_date: dateStringSchema.nullable(),
});

// JSON fields are exported as strings and need to be parsed
const jsonStringToObjectSchema = z.string().transform((s) => JSON.parse(s));

const exportPreprocessSchema = z
  .object({
    person_name: jsonStringToObjectSchema,
    state_specific_data: jsonStringToObjectSchema,
  })
  .passthrough()
  .transform(camelCaseObject);

export const residentSchema = exportPreprocessSchema.pipe(
  residentCommonSchema.extend({
    // placeholder until we have schemas for all SSD
    stateSpecificData: z.object({}).passthrough(),
  }),
);
