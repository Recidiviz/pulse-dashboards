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

import { z } from "zod";

import {
  dateStringSchema,
  opportunitySchemaBase,
  stringToIntSchema,
} from "../../schemaHelpers";

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

const cdvSchema = z.object({
  cdvDate: dateStringSchema,
  cdvRule: z.string(),
});
export type UsMoConductViolationInfo = z.infer<typeof cdvSchema>;

const nonOptionalMetadata = z.object({
  majorCdvs: z.array(cdvSchema),
  cdvsSinceLastHearing: z.array(cdvSchema),
  numMinorCdvsBeforeLastHearing: stringToIntSchema,
  restrictiveHousingStartDate: dateStringSchema,
});

const optionalMetadata = z
  .object({
    mentalHealthAssessmentScore: z.string().nullable(),
    classesRecent: z.array(classesSchema),
    aicScore: z.string(),
    unwaivedEnemies: z.array(unwaivedEnemiesSchema),
    mostRecentHearingDate: dateStringSchema,
    mostRecentHearingType: z.string(),
    mostRecentHearingFacility: z.string(),
    mostRecentHearingComments: z.string(),
    currentFacility: z.string(),
    bedNumber: z.string(),
    roomNumber: z.string(),
    complexNumber: z.string(),
    buildingNumber: z.string(),
    housingUseCode: z.string(),
  })
  .partial();

export const usMoInRestrictiveHousing = z.object({
  confinementType: z.string(),
});

export const usMoNoActiveD1Sanctions = z
  .object({
    latestSanctionStartDate: dateStringSchema,
    latestSanctionEndDate: dateStringSchema,
  })
  .nullish();

export const baseUsMoOverdueRestrictiveHousingSchema =
  opportunitySchemaBase.extend({
    metadata: nonOptionalMetadata.merge(optionalMetadata),
    eligibleCriteria: z.object({
      usMoInRestrictiveHousing,
      usMoNoActiveD1Sanctions,
    }),
    ineligibleCriteria: z.object({}),
  });

export type BaseUsMoOverdueRestrictiveHousingReferralRecord = z.infer<
  typeof baseUsMoOverdueRestrictiveHousingSchema
>;

export type BaseUsMoOverdueRestrictiveHousingReferralRecordRaw = z.input<
  typeof baseUsMoOverdueRestrictiveHousingSchema
>;
