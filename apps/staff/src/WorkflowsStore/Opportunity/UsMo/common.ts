// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { mapValues } from "lodash";
import { z } from "zod";

import { dateStringSchema } from "~datatypes";

import { stringToIntSchema } from "../schemaHelpers";

const classesSchema = z.object({
  startDate: dateStringSchema,
  endDate: dateStringSchema.nullable(),
  classTitle: z.string().nullable(),
  classExitReason: z.string().nullable(),
});
export type UsMoClassInfo = z.infer<typeof classesSchema>;

const unwaivedEnemiesSchema = z.object({
  enemyExternalId: z.string().nullable(),
  enemyBedNumber: z.string().nullable(),
  enemyRoomNumber: z.string().nullable(),
  enemyComplexNumber: z.string().nullable(),
  enemyBuildingNumber: z.string().nullable(),
  enemyHousingUseCode: z.string().nullable(),
});

export type UsMoUnwaivedEnemyInfo = z.infer<typeof unwaivedEnemiesSchema>;

const cdvSchema = z.object({
  cdvDate: dateStringSchema,
  cdvRule: z.string(),
});

export type UsMoConductViolationInfo = z.infer<typeof cdvSchema>;

const sanctionsSchema = z.object({
  sanctionCode: z.string().nullable(),
  sanctionExpirationDate: dateStringSchema.nullable(),
  sanctionId: z.number().nullable(),
  sanctionStartDate: dateStringSchema.nullable(),
});
export type UsMoSanctionInfo = z.infer<typeof sanctionsSchema>;

const cdvMetadata = z.object({
  majorCdvs: z.array(cdvSchema),
  cdvsSinceLastHearing: z.array(cdvSchema),
  numMinorCdvsBeforeLastHearing: stringToIntSchema,
});

export type UsMoConductViolationMetadata = z.infer<typeof cdvMetadata>;

const mostRecentHearingCommentsSchema = z.object({
  mostRecentHearingComments: z
    .string()
    .transform((rawMostRecentHearingCommentsComments) => {
      // Processes and returns the `mostRecentHearingComments`, if present, trimmed of any trailing whitespace as an object of several subsections.

      /**
       *
       * @param text - the raw text from the most recent hearing comments field.
       * @returns the text, if present, trimmed of any trailing whitespace. If the text is falsy, it returns `undefined`.
       */
      const process = (text: string | undefined) => text?.trim() || undefined;
      const unparsedText = process(rawMostRecentHearingCommentsComments);
      if (!unparsedText) return unparsedText;

      /**
       * Captures and names the several groups that appear in `rawMostRecentHearingCommentsComments`.
       */
      const regex =
        /(?:Reason for Hearing:(?<reasonForHearing>[\s\S]*?))?(?:Resident Statement:(?<residentStatement>[\s\S]*?))?(?:Offender Statement:(?<offenderStatement>[\s\S]*?))?(?:Summary of Findings:(?<summaryOfFindings>[\s\S]*?))?(?:Recommendation(s?):(?<recommendation>[\s\S]*))/;
      const match = unparsedText.match(regex);

      if (!match || !match.groups) return unparsedText;

      const {
        reasonForHearing,
        residentStatement,
        offenderStatement,
        summaryOfFindings,
        recommendation,
      } = mapValues(match.groups, (v) => process(v));

      return {
        reasonForHearing,
        // We rename the "Resident Statement" section to "Offender Statement" because they are used interchangeably by facilities.
        residentStatement: residentStatement || offenderStatement,
        // As a fallback, in the event that both appear in the text, we keep both. We do NOT expect this to happen.
        ...(offenderStatement && residentStatement
          ? { offenderStatement }
          : {}),
        summaryOfFindings,
        recommendation,
      };
    }),
});

const nonOptionalMetadata = z
  .object({
    restrictiveHousingStartDate: dateStringSchema,
  })
  .merge(cdvMetadata);

const optionalMetadata = z
  .object({
    allSanctions: z.array(sanctionsSchema),
    mentalHealthAssessmentScore: z.string().nullable(),
    classesRecent: z.array(classesSchema),
    aicScore: z.string(),
    unwaivedEnemies: z.array(unwaivedEnemiesSchema),
    mostRecentHearingDate: dateStringSchema,
    mostRecentHearingType: z.string(),
    mostRecentHearingFacility: z.string(),
    currentFacility: z.string(),
    bedNumber: z.string(),
    roomNumber: z.string(),
    complexNumber: z.string(),
    buildingNumber: z.string(),
    housingUseCode: z.string(),
  })
  .merge(mostRecentHearingCommentsSchema)
  .partial();

export type UsMoMostRecentHearingCommentsMetadata = z.infer<
  typeof optionalMetadata.shape.mostRecentHearingComments
>;

export const usMoMetadataSchema = nonOptionalMetadata.merge(optionalMetadata);
