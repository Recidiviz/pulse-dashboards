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

import { Dictionary } from "lodash";

import { toTitleCase } from "../../utils";
import { Client } from "../Client";
import { TransformFunction, ValidateFunction } from "../subscriptions";
import { fieldToDate, OpportunityValidationError } from "../utils";
import { WithCaseNotes } from "./types";

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
} & WithCaseNotes;

export function getTransformer(
  supervisionLevelFormatter: (raw: string) => string | undefined
): TransformFunction<SupervisionLevelDowngradeReferralRecord> {
  const transformReferral: TransformFunction<SupervisionLevelDowngradeReferralRecord> = (
    record
  ) => {
    if (!record) {
      throw new Error("No record found");
    }

    const {
      stateCode,
      externalId,
      criteria: {
        usTnSupervisionLevelHigherThanAssessmentLevel: {
          latestAssessmentDate,
          assessmentLevel,
          supervisionLevel,
        },
      },
      metadata: { violations },
    } = record;

    const usTnSupervisionLevelHigherThanAssessmentLevel = {
      latestAssessmentDate: fieldToDate(latestAssessmentDate),
      assessmentLevel: toTitleCase(assessmentLevel),
      supervisionLevel:
        supervisionLevelFormatter(supervisionLevel) ?? supervisionLevel,
    };

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

    return {
      stateCode,
      externalId,
      criteria: {
        usTnSupervisionLevelHigherThanAssessmentLevel,
      },
      caseNotes,
    };
  };

  return transformReferral;
}

export function getValidator(
  client: Client
): ValidateFunction<SupervisionLevelDowngradeReferralRecord> {
  return (record) => {
    if (!record) {
      throw new Error("No record to validate");
    }

    const {
      supervisionLevel,
    } = record.criteria.usTnSupervisionLevelHigherThanAssessmentLevel;

    if (supervisionLevel !== client.supervisionLevel)
      throw new OpportunityValidationError(
        "Supervision level does not match client record"
      );
    return record as SupervisionLevelDowngradeReferralRecord;
  };
}
