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

import { z } from "zod";

import { OpportunityValidationError } from "../../errors";
import { formatWorkflowsDate, toTitleCase } from "../../utils";
import { Client } from "../Client";
import { ValidateFunction } from "../subscriptions";
import { caseNotesSchema, dateStringSchema } from "./schemaHelpers";
import { OpportunityRequirement } from "./types";

export const supervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter =
  (fmt: (raw: string) => string = (s) => s) =>
    z
      .object({
        stateCode: z.string(),
        externalId: z.string(),
        eligibleCriteria: z.object({
          supervisionLevelHigherThanAssessmentLevel: z.object({
            latestAssessmentDate: dateStringSchema.nullable(),
            assessmentLevel: z.string().transform(toTitleCase),
            supervisionLevel: z.string().transform(fmt),
          }),
        }),
        ineligibleCriteria: z.object({}),
      })
      .merge(caseNotesSchema);

export type SupervisionLevelDowngradeReferralRecordRaw = z.input<
  ReturnType<
    typeof supervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter
  >
>;

export type SupervisionLevelDowngradeReferralRecord = z.infer<
  ReturnType<
    typeof supervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter
  >
>;

export function getBaseSLDValidator(
  client: Client,
): ValidateFunction<SupervisionLevelDowngradeReferralRecord> {
  const validator: ValidateFunction<SupervisionLevelDowngradeReferralRecord> = (
    transformedRecord,
  ) => {
    const { supervisionLevel } =
      transformedRecord.eligibleCriteria
        .supervisionLevelHigherThanAssessmentLevel;

    if (supervisionLevel !== client.supervisionLevel)
      throw new OpportunityValidationError(
        "Supervision level does not match client record",
      );
  };

  return validator;
}

export function formatBaseSLDRequirements(
  transformedRecord: SupervisionLevelDowngradeReferralRecord,
): OpportunityRequirement[] {
  const { assessmentLevel, latestAssessmentDate, supervisionLevel } =
    transformedRecord.eligibleCriteria
      .supervisionLevelHigherThanAssessmentLevel;

  let text = `Current supervision level: ${supervisionLevel}; Last risk score: ${assessmentLevel}`;
  text += latestAssessmentDate
    ? ` (as of ${formatWorkflowsDate(latestAssessmentDate)})`
    : " (assessment date unknown)";

  return [
    {
      text,
    },
  ];
}
