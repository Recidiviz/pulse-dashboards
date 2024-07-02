import type { Case } from "@prisma/client";
import { z } from "zod";

export const getCaseInputSchema = z.object({
  id: z.string(),
});

type MutableCaseAttributes = Partial<
  Pick<
    Case,
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
  >
>;

const ChargeEnum = z.enum(["Felony", "Misdemeanor"]);

const SubstanceUseDiagnosisEnum = z.enum([
  "None",
  "Mild",
  "Moderate",
  "Severe",
]);

const AsamCareRecommendationEnum = z.enum([
  "LongTermRemissionMonitoring",
  "OutpatientTherapy",
  "MedicallyManagedOutpatient",
  "IntensiveOutpatient",
  "HighIntensityOutpatient",
  "MedicallyManagedIntensiveOutpatient",
  "ClinicallyManagedLowIntensityResidential",
  "ClinicallyManagedHighIntensityResidential",
  "MedicallyManagedResidential",
  "MedicallyManagedInpatient",
  "None",
]);

const MentalHealthDiagnosisEnum = z.enum([
  "BipolarDisorder",
  "BorderlinePersonalityDisorder",
  "DelusionalDisorder",
  "MajorDepressiveDisorder",
  "PsychoticDisorder",
  "Schizophrenia",
  "SchizoaffectiveDisorder",
  "Other",
  "None",
]);

const VeteranStatusEnum = z.enum(["Veteran", "NonVeteran"]);

const PleaEnum = z.enum(["Guilty", "NotGuilty", "Alford"]);

const NeedsToBeAddressedEnum = z.enum([
  "AngerManagement",
  "CaseManagement",
  "DomesticViolenceIssues",
  "Education",
  "FamilyServices",
  "FoodInsecurity",
  "GeneralReEntrySupport",
  "HousingOpportunities",
  "JobTrainingOrOpportunities",
  "MentalHealth",
  "SubstanceUse",
  "Other",
]);

const CaseStatusEnum = z.enum(["NotYetStarted", "InProgress", "Complete"]);

const CaseRecommendationEnum = z.enum(["Probation", "Rider", "Term", "None"]);

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
    previousTreatmentCourt: z.string().nullable().optional(),
    substanceUseDisorderDiagnosis:
      SubstanceUseDiagnosisEnum.nullable().optional(),
    asamCareRecommendation: AsamCareRecommendationEnum.nullable().optional(),
    mentalHealthDiagnoses: z.array(MentalHealthDiagnosisEnum).optional(),
    otherMentalHealthDiagnosis: z.string().nullable().optional(),
    hasDevelopmentalDisability: z.boolean().nullable().optional(),
    veteranStatus: VeteranStatusEnum.nullable().optional(),
    plea: PleaEnum.nullable().optional(),
    hasOpenChildProtectiveServicesCase: z.boolean().nullable().optional(),
    needsToBeAddressed: z.array(NeedsToBeAddressedEnum).optional(),
    otherNeedToBeAddressed: z.string().nullable().optional(),
    status: CaseStatusEnum.optional(),
    selectedRecommendation: CaseRecommendationEnum.optional(),
  }) satisfies z.ZodType<MutableCaseAttributes>,
});
