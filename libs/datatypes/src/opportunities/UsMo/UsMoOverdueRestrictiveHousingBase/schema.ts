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
import { usMoMetadataSchema } from "../common";

export const usMoInRestrictiveHousingCriteria = z.object({
  confinementType: z.string(),
});

export const usMoNoActiveProgressiveDisciplineSanctions = z
  .object({
    latestSanctionStartDate: dateStringSchema.nullable(),
    latestSanctionEndDate: dateStringSchema.nullable(),
  })
  .nullish();

export const baseUsMoOverdueRestrictiveHousingSchema =
  opportunitySchemaBase.extend({
    metadata: usMoMetadataSchema,
    eligibleCriteria: z
      .object({
        usMoInRestrictiveHousing: usMoInRestrictiveHousingCriteria,
        usMoNoActiveProgressiveDisciplineSanctions,
      })
      .passthrough(),
    ineligibleCriteria: z.object({}).passthrough(), // Empty shape here so that it can be pulled out and extended
  });

export type BaseUsMoOverdueRestrictiveHousingReferralRecord = ParsedRecord<
  typeof baseUsMoOverdueRestrictiveHousingSchema
>;
