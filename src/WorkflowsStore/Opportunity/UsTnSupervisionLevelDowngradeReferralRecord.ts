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

import { cloneDeep, Dictionary } from "lodash";

import { TransformFunction } from "../subscriptions";
import { fieldToDate } from "../utils";
import {
  getBaseSLDTransformer,
  getBaseSLDValidator,
  SupervisionLevelDowngradeReferralRecord,
} from "./SupervisionLevelDowngradeReferralRecord";
import { WithCaseNotes } from "./types";

export type UsTnSupervisionLevelDowngradeReferralRecord = SupervisionLevelDowngradeReferralRecord &
  WithCaseNotes;

export function getTransformer(
  supervisionLevelFormatter: (raw: string) => string | undefined
): TransformFunction<UsTnSupervisionLevelDowngradeReferralRecord> {
  const transformer: TransformFunction<UsTnSupervisionLevelDowngradeReferralRecord> = (
    record
  ) => {
    if (!record) {
      throw new Error("No record found");
    }

    const localRecord = cloneDeep(record);

    const { usTnSupervisionLevelHigherThanAssessmentLevel } = record.criteria;
    if (usTnSupervisionLevelHigherThanAssessmentLevel) {
      localRecord.criteria.supervisionLevelHigherThanAssessmentLevel = usTnSupervisionLevelHigherThanAssessmentLevel;
      delete localRecord.criteria.usTnSupervisionLevelHigherThanAssessmentLevel;
    }

    const baseTransformer = getBaseSLDTransformer(supervisionLevelFormatter);

    const baseTransformedRecord = baseTransformer(localRecord);
    if (!baseTransformedRecord) {
      throw new Error("Unable to transform base SLD record");
    }

    const {
      metadata: { violations },
    } = localRecord;

    const caseNotes = {
      Violations: violations.map(
        ({ violationCode, violationDate }: Dictionary<string>) => {
          return {
            noteBody: violationCode,
            eventDate: fieldToDate(violationDate),
          };
        }
      ),
    };

    return { ...baseTransformedRecord, caseNotes };
  };
  return transformer;
}

export const getValidator = getBaseSLDValidator;
