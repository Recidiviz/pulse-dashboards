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

import { formatWorkflowsDate, toTitleCase } from "../../utils";
import { Client } from "../Client";
import { TransformFunction, ValidateFunction } from "../subscriptions";
import { fieldToDate, OpportunityValidationError } from "../utils";
import { OpportunityRequirement } from "./types";

export type SupervisionLevelDowngradeReferralRecord = {
  stateCode: string;
  externalId: string;
  criteria: {
    supervisionLevelHigherThanAssessmentLevel: {
      assessmentLevel: string;
      latestAssessmentDate: Date;
      supervisionLevel: string;
    };
  };
};

export function getBaseSLDTransformer(
  supervisionLevelFormatter: (raw: string) => string | undefined
): TransformFunction<SupervisionLevelDowngradeReferralRecord> {
  const transformer: TransformFunction<SupervisionLevelDowngradeReferralRecord> = (
    record
  ): SupervisionLevelDowngradeReferralRecord => {
    if (!record) {
      throw new Error("No record found");
    }

    const {
      stateCode,
      externalId,
      criteria: {
        supervisionLevelHigherThanAssessmentLevel: {
          latestAssessmentDate,
          assessmentLevel,
          supervisionLevel,
        },
      },
    } = record;

    const reasons = {
      latestAssessmentDate: fieldToDate(latestAssessmentDate),
      assessmentLevel: toTitleCase(assessmentLevel),
      supervisionLevel:
        supervisionLevelFormatter(supervisionLevel) ?? supervisionLevel,
    };

    return {
      stateCode,
      externalId,
      criteria: {
        supervisionLevelHigherThanAssessmentLevel: reasons,
      },
    };
  };

  return transformer;
}

export function getBaseSLDValidator(
  client: Client
): ValidateFunction<SupervisionLevelDowngradeReferralRecord> {
  const validator: ValidateFunction<SupervisionLevelDowngradeReferralRecord> = (
    transformedRecord
  ) => {
    const {
      supervisionLevel,
    } = transformedRecord.criteria.supervisionLevelHigherThanAssessmentLevel;

    if (supervisionLevel !== client.supervisionLevel)
      throw new OpportunityValidationError(
        "Supervision level does not match client record"
      );
  };

  return validator;
}

export function formatBaseSLDRequirements(
  transformedRecord: SupervisionLevelDowngradeReferralRecord
): OpportunityRequirement[] {
  const {
    assessmentLevel,
    latestAssessmentDate,
    supervisionLevel,
  } = transformedRecord.criteria.supervisionLevelHigherThanAssessmentLevel;

  return [
    {
      text: `Current supervision level: ${supervisionLevel}; last risk score: ${assessmentLevel} (as of ${formatWorkflowsDate(
        latestAssessmentDate
      )})`,
    },
  ];
}
