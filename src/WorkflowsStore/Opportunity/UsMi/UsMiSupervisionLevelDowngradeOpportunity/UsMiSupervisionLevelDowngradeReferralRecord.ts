/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { z } from "zod";

import { caseNotesSchema, dateStringSchema } from "../../schemaHelpers";
import {
  getBaseSLDValidator,
  supervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter,
} from "../../SupervisionLevelDowngradeReferralRecord";

type Schema = ReturnType<
  typeof usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter
>;

export type UsMiSupervisionLevelDowngradeReferralRecordRaw = z.input<Schema>;
export type UsMiSupervisionLevelDowngradeReferralRecord = z.infer<Schema>;

export const usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter =
  (fmt?: (raw: string) => string) => {
    const base =
      supervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(
        fmt
      );

    return base
      .extend({
        eligibleCriteria: base.shape.eligibleCriteria.extend({
          usMiNotPastInitialClassificationReviewDate: z.object({
            eligibleDate: dateStringSchema,
          }),
          usMiNotServingIneligibleOffensesForDowngradeFromSupervisionLevel: z
            .object({})
            .nullable(),
        }),
      })
      .merge(caseNotesSchema);
  };

export const getValidator = getBaseSLDValidator;
