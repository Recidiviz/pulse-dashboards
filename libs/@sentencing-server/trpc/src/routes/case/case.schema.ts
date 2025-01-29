// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import {
  AsamCareRecommendation,
  CaseStatus,
  Gender,
  MentalHealthDiagnosis,
  NeedToBeAddressed,
  OnboardingTopic,
  Plea,
  ProtectiveFactor,
  ReportType,
  SubstanceUseDiagnosis,
} from "@prisma/sentencing-server/client";
import { z } from "zod";

import { OPPORTUNITY_UNKNOWN_PROVIDER_NAME } from "~@sentencing-server/prisma";
import {
  GetCaseInput,
  OpportunityNameIdentifier,
  UpdateCaseInput,
} from "~@sentencing-server/trpc/routes/case/types";

export const getCaseInputSchema = z.object({
  id: z.string(),
}) satisfies z.ZodType<GetCaseInput>;

const SubstanceUseDiagnosisEnum = z.nativeEnum(SubstanceUseDiagnosis);

const AsamCareRecommendationEnum = z.nativeEnum(AsamCareRecommendation);

const MentalHealthDiagnosisEnum = z.nativeEnum(MentalHealthDiagnosis);

const PleaEnum = z.nativeEnum(Plea);

const NeedsToBeAddressedEnum = z.nativeEnum(NeedToBeAddressed);

const CaseStatusEnum = z.nativeEnum(CaseStatus);

const OnboardingTopicEnum = z.nativeEnum(OnboardingTopic);

const ReportTypeEnum = z.nativeEnum(ReportType);

const GenderEnum = z.nativeEnum(Gender);

const ProtectiveFactorEnum = z.nativeEnum(ProtectiveFactor);

const OpportunitiesSchema = z.array(
  z.object({
    opportunityName: z.string() satisfies z.ZodType<OpportunityNameIdentifier>,
    providerName: z
      .string()
      .nullable()
      // If providerName is null, we should default to OPPORTUNITY_UNKNOWN_PROVIDER_NAME
      .transform((v) => v ?? OPPORTUNITY_UNKNOWN_PROVIDER_NAME),
    genericDescription: z.string().nullable(),
  }),
);

export const updateCaseSchema = z.object({
  id: z.string(),
  attributes: z.object({
    lsirScore: z.number().nullable().optional(),
    offense: z.string().nullable().optional(),
    isCurrentOffenseViolent: z.boolean().nullable().optional(),
    isCurrentOffenseSexual: z.boolean().nullable().optional(),
    previouslyIncarceratedOrUnderSupervision: z.boolean().nullable().optional(),
    hasPreviousFelonyConviction: z.boolean().nullable().optional(),
    hasPreviousViolentOffenseConviction: z.boolean().nullable().optional(),
    hasPreviousSexOffenseConviction: z.boolean().nullable().optional(),
    hasPreviousTreatmentCourt: z.boolean().nullable().optional(),
    previousTreatmentCourt: z.string().nullable().optional(),
    substanceUseDisorderDiagnosis:
      SubstanceUseDiagnosisEnum.nullable().optional(),
    asamCareRecommendation: AsamCareRecommendationEnum.nullable().optional(),
    mentalHealthDiagnoses: z.array(MentalHealthDiagnosisEnum).optional(),
    otherMentalHealthDiagnosis: z.string().nullable().optional(),
    hasDevelopmentalDisability: z.boolean().nullable().optional(),
    isVeteran: z.boolean().nullable().optional(),
    plea: PleaEnum.nullable().optional(),
    hasOpenChildProtectiveServicesCase: z.boolean().nullable().optional(),
    needsToBeAddressed: z.array(NeedsToBeAddressedEnum).optional(),
    otherNeedToBeAddressed: z.string().nullable().optional(),
    status: CaseStatusEnum.optional(),
    selectedRecommendation: z.string().nullable().optional(),
    recommendedOpportunities: OpportunitiesSchema.optional(),
    currentOnboardingTopic: OnboardingTopicEnum.optional(),
    recommendationSummary: z.string().nullable().optional(),
    reportType: ReportTypeEnum.optional(),
    clientGender: GenderEnum.optional(),
    recommendedMinSentenceLength: z.number().int().optional(),
    recommendedMaxSentenceLength: z.number().int().optional(),
    protectiveFactors: z.array(ProtectiveFactorEnum).optional(),
    otherProtectiveFactor: z.string().nullable().optional(),
  }) satisfies z.ZodType<UpdateCaseInput>,
});
