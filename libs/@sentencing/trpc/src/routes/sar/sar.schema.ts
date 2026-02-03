// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
  FrequencyOfUse,
  LevelOfEducation,
  MethodOfUse,
  ProtectiveFactor,
  SubstanceType,
} from "~@sentencing/prisma/client";
import {
  CaseStatusEnum,
  NeedsToBeAddressedEnum,
} from "~@sentencing/trpc/routes/common/constants";
import {
  GetSARInput,
  UpsertSARInput,
} from "~@sentencing/trpc/routes/sar/types";
export const getSARByIDInputSchema = z.object({
  id: z.string(),
}) satisfies z.ZodType<GetSARInput>;

export const getSARsForStaffInputSchema = z.object({
  staffPseudonymizedId: z.string(),
});

export const mitigatingFactorEnum = z.nativeEnum(ProtectiveFactor);
export const educationLevelEnum = z.nativeEnum(LevelOfEducation);
export const substanceEnum = z.nativeEnum(SubstanceType);
export const frequencyOfUseEnum = z.nativeEnum(FrequencyOfUse);
export const methodOfUseEnum = z.nativeEnum(MethodOfUse);

export const SARMetadataSchema = z.object({
  sections: z.object({
    keyConsiderations: z.object({
      areasOfNeed: z.object({ skipped: z.boolean() }),
      mitigatingFactors: z.object({ skipped: z.boolean() }),
    }),
    defendantStatement: z.object({
      skipped: z.boolean(),
      edited: z.boolean().optional(),
    }),
    victimImpactStatement: z.object({
      skipped: z.boolean(),
      edited: z.boolean().optional(),
    }),
    recommendation: z.object({
      skipped: z.boolean(),
      edited: z.boolean().optional(),
    }),
  }),
  version: z.literal("1.0").optional(),
});
export const updateSARSchema = z.object({
  id: z.string(),
  attributes: z.object({
    ssn: z.string().nullable().optional(),
    status: CaseStatusEnum.optional(),
    address: z.string().nullable().optional(),
    defendantDeclinedToParticipate: z.boolean().optional(),
    needsToBeAddressed: z.array(NeedsToBeAddressedEnum).optional(),
    otherNeedToBeAddressed: z.string().nullable().optional(),
    mitigatingFactors: z.array(mitigatingFactorEnum).optional(),
    otherMitigatingFactor: z.string().nullable().optional(),
    charges: z
      .array(
        z.object({
          id: z.string(),
          prosecutingAttorney: z.string().nullable().optional(),
          defenseAttorney: z.string().nullable().optional(),
          pleaAgreement: z.string().nullable().optional(),
          pleaDate: z.date().nullable().optional(),
          sentencingDate: z.date().nullable().optional(),
        }),
      )
      .optional(),
    defendantStatement: z.string().nullable().optional(),
    victimImpactStatement: z.string().nullable().optional(),
    criminalHistorySummary: z.string().nullable().optional(),
    levelOfEducation: educationLevelEnum.optional(),
    employedAtOffense: z.boolean().nullable().optional(),
    employmentSummary: z.string().nullable().optional(),
    motherName: z.string().nullable().optional(),
    fatherName: z.string().nullable().optional(),
    guardianName: z.string().nullable().optional(),
    familyAndSocialSupportSummary: z.string().nullable().optional(),
    homePlan: z.string().nullable().optional(),
    housingSummary: z.string().nullable().optional(),
    drugHistorySummary: z.string().nullable().optional(),
    peerAssociatesSummary: z.string().nullable().optional(),
    criminalAttitudesSummary: z.string().nullable().optional(),
    responsivityAndBarriersSummary: z.string().nullable().optional(),
    communityStrategyRecommendation: z.string().nullable().optional(),
    institutionalStrategyRecommendation: z.string().nullable().optional(),
    metadata: SARMetadataSchema.optional(),
  }) satisfies z.ZodType<UpsertSARInput>,
});

// Employment History CRUD schemas
export const createEmploymentHistorySchema = z.object({
  sarId: z.string(),
  employerName: z.string().nullable().optional(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  verifiedByReportAuthor: z.boolean().nullable().optional(),
});

export const updateEmploymentHistorySchema = z.object({
  id: z.string(),
  employerName: z.string().nullable().optional(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  verifiedByReportAuthor: z.boolean().nullable().optional(),
});

export const deleteEmploymentHistorySchema = z.object({
  id: z.string(),
});

// Substance Use History CRUD schemas
export const createDrugHistorySchema = z.object({
  sarId: z.string(),
  substance: substanceEnum.nullable().optional(),
  ageOfRegularUse: z.number().int().nullable().optional(),
  lastUse: z.date().nullable().optional(),
  heaviestUse: frequencyOfUseEnum.nullable().optional(),
  method: methodOfUseEnum.nullable().optional(),
});

export const updateDrugHistorySchema = z.object({
  id: z.string(),
  substance: substanceEnum.nullable().optional(),
  ageOfRegularUse: z.number().int().nullable().optional(),
  lastUse: z.date().nullable().optional(),
  heaviestUse: frequencyOfUseEnum.nullable().optional(),
  method: methodOfUseEnum.nullable().optional(),
});

export const deleteDrugHistorySchema = z.object({
  id: z.string(),
});
