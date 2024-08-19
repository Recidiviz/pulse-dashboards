import type { Prisma } from "@prisma/client";

export type GetCaseInput = Pick<Prisma.CaseWhereUniqueInput, "id">;

export type OpportunityNameIdentifier =
  Prisma.OpportunityOpportunityNameProviderNameCompoundUniqueInput["opportunityName"];

export type UpdateCaseInput = Pick<
  Prisma.CaseUpdateInput,
  | "lsirScore"
  | "previouslyIncarceratedOrUnderSupervision"
  | "hasPreviousFelonyConviction"
  | "hasPreviousViolentOffenseConviction"
  | "hasPreviousSexOffenseConviction"
  | "previousTreatmentCourt"
  | "substanceUseDisorderDiagnosis"
  | "asamCareRecommendation"
  | "mentalHealthDiagnoses"
  | "otherMentalHealthDiagnosis"
  | "hasDevelopmentalDisability"
  | "isVeteran"
  | "plea"
  | "hasOpenChildProtectiveServicesCase"
  | "needsToBeAddressed"
  | "otherNeedToBeAddressed"
  | "status"
  | "selectedRecommendation"
  | "currentOnboardingTopic"
  | "recommendationSummary"
> & {
  recommendedOpportunities?: {
    opportunityName: OpportunityNameIdentifier;
  }[];
  offense?: string | null;
};
