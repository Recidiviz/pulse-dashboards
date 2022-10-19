// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { cloneDeep, Dictionary } from "lodash";

import { Client } from "../Client";
import { TransformFunction, ValidateFunction } from "../subscriptions";
import { fieldToDate } from "../utils";

export type SupervisionLevelDowngradeReferralRecord = {
  stateCode: string;
  externalId: string;
  criteria: {
    usTnSupervisionLevelHigherThanAssessmentLevel: {
      assessmentLevel: string;
      latestAssessmentDate: Date;
      supervisionLevel: string;
    };
  };

  metadata: {
    violations: { violationDate: Date; violationType: string }[];
  };
};

export const transformReferral: TransformFunction<SupervisionLevelDowngradeReferralRecord> = (
  record
) => {
  if (!record) return;

  const transformedRecord = cloneDeep(
    record
  ) as SupervisionLevelDowngradeReferralRecord;

  transformedRecord.criteria.usTnSupervisionLevelHigherThanAssessmentLevel.latestAssessmentDate = fieldToDate(
    record.criteria.usTnSupervisionLevelHigherThanAssessmentLevel
      .latestAssessmentDate
  );
  transformedRecord.metadata.violations = record.metadata.violations.map(
    ({ violationType, violationDate }: Dictionary<string>) => ({
      violationType,
      violationDate: fieldToDate(violationDate),
    })
  );

  return transformedRecord;
};

export function getValidator(
  client: Client
): ValidateFunction<SupervisionLevelDowngradeReferralRecord> {
  return (record) => {
    if (!record) return;

    const {
      supervisionLevel,
    } = record.criteria.usTnSupervisionLevelHigherThanAssessmentLevel;

    if (
      client.rootStore.workflowsStore.formatSupervisionLevel(
        supervisionLevel
      ) !== client.supervisionLevel
    )
      return;
    return record as SupervisionLevelDowngradeReferralRecord;
  };
}
