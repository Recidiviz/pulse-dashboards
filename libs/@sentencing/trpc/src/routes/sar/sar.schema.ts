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
  SectionStatus,
  SubstanceType,
} from "~@sentencing/prisma/client";
import {
  CaseStatusEnum,
  NeedsToBeAddressedEnum,
  PleaEnum,
} from "~@sentencing/trpc/routes/common/constants";
import {
  GetSARInput,
  UpsertSARInput,
} from "~@sentencing/trpc/routes/sar/types";
export const getSARInputSchema = z.object({
  id: z.string(),
}) satisfies z.ZodType<GetSARInput>;

export const mitigatingFactorEnum = z.nativeEnum(ProtectiveFactor);
export const educationLevelEnum = z.nativeEnum(LevelOfEducation);
export const substanceEnum = z.nativeEnum(SubstanceType);
export const frequencyOfUseEnum = z.nativeEnum(FrequencyOfUse);
export const methodOfUseEnum = z.nativeEnum(MethodOfUse);
export const sectionStatusEnum = z.nativeEnum(SectionStatus);

export const sarMetadataSchema = z.object({
  sections: z.object({
    caseInformation: z.object({
      status: z.enum([SectionStatus.Incomplete, SectionStatus.Complete]),
      missingRequiredFields: z.array(z.string()).optional(),
    }),
    needsAndMitigation: z.object({
      status: sectionStatusEnum,
      missingFields: z.array(z.string()).optional(),
    }),
    defendantVersion: z.object({
      status: sectionStatusEnum,
    }),
    victimImpactStatement: z.object({
      status: sectionStatusEnum,
    }),
    offenderAssessment: z.object({
      status: z.enum([SectionStatus.Incomplete, SectionStatus.Complete]),
      missingFields: z.array(z.string()).optional(),
    }),
  }),
  lastUpdated: z.string().datetime().optional(),
  version: z.literal("1.0").optional(),
});
export const updateSarSchema = z.object({
  id: z.string(),
  attributes: z.object({
    ssn: z.string().nullable().optional(),
    status: CaseStatusEnum.optional(),
    address: z.string().nullable().optional(),
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
          pleaAgreement: PleaEnum.nullable().optional(),
          pleaDate: z.date().nullable().optional(),
          sentencingDate: z.date().nullable().optional(),
        }),
      )
      .optional(),
    defendantStatement: z.string().nullable().optional(),
    victimImpactStatement: z.string().nullable().optional(),
    criminalHistorySummary: z.string().nullable().optional(),
    levelOfEducation: educationLevelEnum.optional(),
    employerAtOffense: z.string().nullable().optional(),
    currentEmployer: z.string().nullable().optional(),
    employmentSummary: z.string().nullable().optional(),
    motherName: z.string().nullable().optional(),
    fatherName: z.string().nullable().optional(),
    guardianName: z.string().nullable().optional(),
    familyAndSocialSupportSummary: z.string().nullable().optional(),
    homePlan: z.string().nullable().optional(),
    housingSummary: z.string().nullable().optional(),
    drugHistories: z
      .array(
        z.object({
          substance: substanceEnum.optional(),
          ageOfRegularUse: z.number().int().nullable().optional(),
          lastUse: z.date().nullable().optional(),
          heaviestUse: frequencyOfUseEnum.optional(),
          method: methodOfUseEnum.optional(),
        }),
      )
      .optional(),
    drugHistorySummary: z.string().nullable().optional(),
    peerAssociatesSummary: z.string().nullable().optional(),
    criminalAttitudesSummary: z.string().nullable().optional(),
    responsivityAndBarriersSummary: z.string().nullable().optional(),
    communityStrategyRecommendation: z.string().nullable().optional(),
    institutionalStrategyRecommendation: z.string().nullable().optional(),
    metadata: sarMetadataSchema.optional(),
  }) satisfies z.ZodType<UpsertSARInput>,
});
