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
  AssessmentType,
  DomainRiskLevel,
  FrequencyOfUse,
  Gender,
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
export const getSARInsightSchema = z.object({
  offenseName: z.string(),
  gender: z.nativeEnum(Gender),
  assessmentScoreBucket: z.number().int(),
});

export const ORAS_FIELDS: ReadonlyArray<
  keyof z.infer<typeof updateSARSchema>["attributes"]
> = [
  "assessmentScore",
  "assessmentType",
  "assessmentDate",
  "assessmentAdministeredBy",
  "criminalHistoryLevel",
  "educationLevelScore",
  "neighborhoodLevel",
  "substanceAbuseLevel",
  "familySocialSupportLevel",
  "peerAssociatesLevel",
  "criminalBehaviorLevel",
  "responsivityLevel",
  "criminalHistoryRiskLevel",
  "educationRiskLevel",
  "neighborhoodRiskLevel",
  "substanceAbuseRiskLevel",
  "familySocialSupportRiskLevel",
  "peerAssociatesRiskLevel",
  "criminalBehaviorRiskLevel",
];

export const getSARByIDInputSchema = z.object({
  id: z.string(),
}) satisfies z.ZodType<GetSARInput>;

export const getSARsForStaffInputSchema = z.object({
  staffPseudonymizedId: z.string(),
});

export const getSARsByClientInputSchema = z.object({
  clientExternalId: z.string(),
});

export const mitigatingFactorEnum = z.nativeEnum(ProtectiveFactor);
export const educationLevelEnum = z.nativeEnum(LevelOfEducation);
export const substanceEnum = z.nativeEnum(SubstanceType);
export const frequencyOfUseEnum = z.nativeEnum(FrequencyOfUse);
export const methodOfUseEnum = z.nativeEnum(MethodOfUse);
export const assessmentTypeEnum = z.nativeEnum(AssessmentType);
export const domainRiskLevelEnum = z.nativeEnum(DomainRiskLevel);
const domainScore = z.number().int().nullish();
const domainRiskLevel = domainRiskLevelEnum.nullish();

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
    priorTreatmentHistory: z
      .object({
        edited: z.boolean().optional(),
      })
      .optional(),
  }),
  version: z.literal("1.0").optional(),
});
export const updateSARSchema = z.object({
  id: z.string(),
  attributes: z.object({
    status: CaseStatusEnum.optional(),
    address: z.string().nullable().optional(),
    requestingJudgeName: z.string().nullish(),
    division: z.string().nullish(),
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
    priorTreatmentHistorySummary: z.string().nullable().optional(),
    communityStrategyRecommendation: z.string().nullable().optional(),
    institutionalStrategyRecommendation: z.string().nullable().optional(),
    mostSevereOffenseName: z.string().nullish(),
    metadata: SARMetadataSchema.optional(),
    officerSignature: z.string().nullish(),
    officerTitle: z.string().nullish(),
    officerLastSignedAt: z.date().nullish(),
    supervisorSignature: z.string().nullish(),
    supervisorTitle: z.string().nullish(),
    supervisorLastSignedAt: z.date().nullish(),
    // Assessment metadata
    assessmentScore: z.number().int().nullish(),
    assessmentType: assessmentTypeEnum.nullish(),
    assessmentDate: z.date().nullish(),
    assessmentAdministeredBy: z.string().nullish(),
    noORASDomainReason: z.string().nullish(),
    ORASDomainsAvailable: z.boolean().optional(),
    // Domain scores
    criminalHistoryLevel: domainScore,
    educationLevelScore: domainScore,
    neighborhoodLevel: domainScore,
    substanceAbuseLevel: domainScore,
    familySocialSupportLevel: domainScore,
    peerAssociatesLevel: domainScore,
    criminalBehaviorLevel: domainScore,
    responsivityLevel: domainScore,
    // Domain risk levels
    criminalHistoryRiskLevel: domainRiskLevel,
    educationRiskLevel: domainRiskLevel,
    neighborhoodRiskLevel: domainRiskLevel,
    substanceAbuseRiskLevel: domainRiskLevel,
    familySocialSupportRiskLevel: domainRiskLevel,
    peerAssociatesRiskLevel: domainRiskLevel,
    criminalBehaviorRiskLevel: domainRiskLevel,
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
  otherSubstanceName: z.string().nullable().optional(),
  ageOfRegularUse: z.number().int().nullable().optional(),
  lastUse: z.date().nullable().optional(),
  heaviestUse: frequencyOfUseEnum.nullable().optional(),
  method: methodOfUseEnum.nullable().optional(),
});

export const updateDrugHistorySchema = z.object({
  id: z.string(),
  substance: substanceEnum.nullable().optional(),
  otherSubstanceName: z.string().nullable().optional(),
  ageOfRegularUse: z.number().int().nullable().optional(),
  lastUse: z.date().nullable().optional(),
  heaviestUse: frequencyOfUseEnum.nullable().optional(),
  method: methodOfUseEnum.nullable().optional(),
});

export const deleteDrugHistorySchema = z.object({
  id: z.string(),
});

// Prior Treatment History CRUD schemas
export const createPriorTreatmentHistorySchema = z.object({
  sarId: z.string(),
  programName: z.string().nullable().optional(),
  yearCompleted: z.number().int().nullable().optional(),
  verifiedByReportAuthor: z.boolean().nullable().optional(),
});

export const updatePriorTreatmentHistorySchema = z.object({
  id: z.string(),
  programName: z.string().nullable().optional(),
  yearCompleted: z.number().int().nullable().optional(),
  verifiedByReportAuthor: z.boolean().nullable().optional(),
});

export const deletePriorTreatmentHistorySchema = z.object({
  id: z.string(),
});
