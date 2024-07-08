import type { Prisma } from "@prisma/client";

export type GetCaseInput = Pick<Prisma.CaseWhereUniqueInput, "id">;

export type OpportunityIdentifier =
  Prisma.OpportunityOpportunityNameProviderPhoneNumberCompoundUniqueInput;

export type UpdateCaseInput = Pick<
  Prisma.CaseUpdateInput,
  | "lsirScore"
  | "primaryCharge"
  | "secondaryCharges"
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
  | "veteranStatus"
  | "plea"
  | "hasOpenChildProtectiveServicesCase"
  | "needsToBeAddressed"
  | "otherNeedToBeAddressed"
  | "status"
  | "selectedRecommendation"
> & {
  recommendedOpportunities?: OpportunityIdentifier[];
};
