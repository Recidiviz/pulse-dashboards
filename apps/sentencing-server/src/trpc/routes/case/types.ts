import type { Prisma } from "@prisma/client";

export type GetCaseInput = Pick<Prisma.CaseWhereUniqueInput, "id">;

export type OpportunityIdentifier =
  Prisma.OpportunityOpportunityNameProviderPhoneNumberCompoundUniqueInput;

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
> & {
  recommendedOpportunities?: OpportunityIdentifier[];
  offense?: string | null;
};
