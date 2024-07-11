import {
  AsamCareRecommendation,
  CaseRecommendation,
  CaseStatus,
  Charge,
  MentalHealthDiagnosis,
  NeedToBeAddressed,
  Plea,
  SubstanceUseDiagnosis,
} from "@prisma/client";
import { z } from "zod";

import {
  GetCaseInput,
  OpportunityIdentifier,
  UpdateCaseInput,
} from "~sentencing-server/trpc/routes/case/types";

export const getCaseInputSchema = z.object({
  id: z.string(),
}) satisfies z.ZodType<GetCaseInput>;

const ChargeEnum = z.nativeEnum(Charge);

const SubstanceUseDiagnosisEnum = z.nativeEnum(SubstanceUseDiagnosis);

const AsamCareRecommendationEnum = z.nativeEnum(AsamCareRecommendation);

const MentalHealthDiagnosisEnum = z.nativeEnum(MentalHealthDiagnosis);

const PleaEnum = z.nativeEnum(Plea);

const NeedsToBeAddressedEnum = z.nativeEnum(NeedToBeAddressed);

const CaseStatusEnum = z.nativeEnum(CaseStatus);

const CaseRecommendationEnum = z.nativeEnum(CaseRecommendation);

const OpportunitiesSchema = z.array(
  z.object({
    opportunityName: z.string(),
    providerPhoneNumber: z.string(),
  }),
) satisfies z.ZodType<OpportunityIdentifier[]>;

export const updateCaseSchema = z.object({
  id: z.string(),
  attributes: z.object({
    lsirScore: z.number().nullable().optional(),
    primaryCharge: ChargeEnum.nullable().optional(),
    secondaryCharges: z.array(ChargeEnum).optional(),
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
    selectedRecommendation: CaseRecommendationEnum.nullable().optional(),
    recommendedOpportunities: OpportunitiesSchema.optional(),
  }) satisfies z.ZodType<UpdateCaseInput>,
});
