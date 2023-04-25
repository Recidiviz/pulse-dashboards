/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
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

import { caseNotesSchema } from "./schemaHelpers";
import {
  getBaseSLDValidator,
  SupervisionLevelDowngradeReferralRecordRaw,
  supervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter,
} from "./SupervisionLevelDowngradeReferralRecord";

type Schema = ReturnType<
  typeof usTnSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter
>;

// TODO: this raw shape is not perfect: it still has index signatures etc.
// It would be nice to figure out how to construct these automatically
export type UsTnSupervisionLevelDowngradeReferralRecordRaw = z.input<Schema> &
  SupervisionLevelDowngradeReferralRecordRaw;
export type UsTnSupervisionLevelDowngradeReferralRecord = z.infer<Schema>;

export const usTnSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter =
  (fmt?: (raw: string) => string) => {
    const base =
      supervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(
        fmt
      );

    return z
      .object({
        metadata: z
          .object({
            violations: z
              .object({
                violationCode: z.string(),
                violationDate: z.string(),
              })
              .array(),
          })
          .passthrough(),
      })
      .passthrough()
      .transform((r) => ({
        ...r,
        caseNotes: {
          Violations: r.metadata.violations.map(
            ({ violationCode, violationDate }) => ({
              noteBody: violationCode,
              eventDate: violationDate,
            })
          ),
        },
      }))
      .pipe(base.and(caseNotesSchema));
  };

export const getValidator = getBaseSLDValidator;
