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

import z from "zod";
import { zu } from "zod_utilz";

import { OPPORTUNITY_UNKNOWN_PROVIDER_NAME } from "~@sentencing/prisma";
import {
  AsamLevelOfCareRecommendationCriterion,
  ChargeClassificationSubtype,
  ChargeClassificationType,
  DiagnosedMentalHealthDiagnosisCriterion,
  DiagnosedSubstanceUseDisorderCriterion,
  Gender,
  NeedToBeAddressed,
  PriorCriminalHistoryCriterion,
  StateCode,
  TreatmentProgramCategory,
} from "~@sentencing/prisma/client";

export const nameSchema = zu.stringToJSON().pipe(
  z.object({
    given_names: z.string(),
    middle_names: z.string(),
    name_suffix: z.string(),
    surname: z.string(),
  }),
);

export function fullNameObjectToString(nameObject: z.infer<typeof nameSchema>) {
  return `${nameObject.given_names} ${nameObject.middle_names} ${nameObject.surname} ${nameObject.name_suffix}`;
}

const stateCode = z.preprocess(
  (v) => (v === "US_IX" ? StateCode.US_ID : v),
  z.nativeEnum(StateCode),
);

const gender = z.nativeEnum(Gender);

const needsAddressed = z.array(z.nativeEnum(NeedToBeAddressed));

const priorCriminalHistoryCriterion = z.nativeEnum(
  PriorCriminalHistoryCriterion,
);
const diagnosedMentalHealthDiagnosisCriterion = z.array(
  z.nativeEnum(DiagnosedMentalHealthDiagnosisCriterion),
);
const asamLevelOfCareRecommendationCriterion = z.nativeEnum(
  AsamLevelOfCareRecommendationCriterion,
);
const diagnosedSubstanceUseDisorderCriterion = z.nativeEnum(
  DiagnosedSubstanceUseDisorderCriterion,
);
const opportunityStatus = z.enum(["Active", "Inactive"]);

const caseIdsSchema = zu.stringToJSON().pipe(z.array(z.string()));

// Title case helper (converts "HELLO WORLD" to "Hello World")
// Matches pattern used in libs/sentencing-client/src/utils/utils.ts
const titleCase = (str: string | null | undefined): string | null => {
  if (!str) return null;
  return str.toLocaleLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

// Format phone number as XXX-XXX-XXXX
const formatPhoneNumber = (phone: string | null | undefined): string | null => {
  if (!phone) return null;
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  // Format as XXX-XXX-XXXX (assuming 10 digit US phone)
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  // Return as-is if not 10 digits
  return phone;
};

// Office address comes as a JSON string that needs to be parsed and formatted
// Output format: "1397 State Hwy O, Po Box 1897, Fulton, MO 65251"
const officeAddressSchema = zu
  .stringToJSON()
  .pipe(
    z.object({
      address_line_1: z.string().nullish(),
      address_line_2: z.string().nullish(),
      address_city: z.string().nullish(),
      address_state: z.string().nullish(),
      address_zip: z.string().nullish(),
    }),
  )
  .transform((addr) => {
    // Format: address_line_1, address_line_2, city, state zip
    // Title case everything except state (keep uppercase)
    const parts = [
      titleCase(addr.address_line_1),
      titleCase(addr.address_line_2),
      titleCase(addr.address_city),
      [addr.address_state, addr.address_zip].filter(Boolean).join(" ") || null,
    ].filter(Boolean);
    return parts.join(", ") || null;
  })
  .nullish();

const reportType = z.enum([
  "PSI Assigned Full",
  "PSI File Review Assigned",
  "PSI File Review w/LSI Assigned",
]);

const assessmentType = z.enum([
  "ORAS_COMMUNITY_SUPERVISION",
  "ORAS_COMMUNITY_SUPERVISION_SCREENING",
  "ORAS_PRISON_INTAKE",
  "ORAS_PRISON_SCREENING",
  "ORAS_REENTRY",
  "ORAS_SUPPLEMENTAL_REENTRY",
]);

export const caseImportSchema = z.object({
  external_id: z.string(),
  state_code: stateCode,
  staff_id: z.string(),
  client_id: z.string(),
  due_date: z.coerce.date().optional(),
  county: z.string().optional(),
  district: z.string().optional(),
  lsir_score: z.coerce.number().optional(),
  lsir_level: z.string().optional(),
  report_type: reportType.optional(),
  investigation_status: z.string().optional(),
});

export const SARImportSchema = z.object({
  external_id: z.string(),
  state_code: stateCode,
  staff_id: z.string(),
  client_id: z.string(),
  due_date: z.coerce.date().nullish(),
  court_date: z.coerce.date().nullish(),
  completion_date: z.coerce.date().nullish(),
  report_type: assessmentType.optional(), // MO sends ORAS types, not PSI types
  assessment_score: z.string().optional(),
  assessment_date: z.coerce.date().nullish(),
  assigned_date: z.coerce.date().nullish(),
  assessment_administered_by: z
    .string()
    .transform((s) => s.replace(/^"|"$/g, ""))
    .nullish(),
  assessment_metadata: z
    .array(
      z.object({
        domain_name: z.string(),
        domain_score: z.string(),
        domain_risk_level: z.string().optional(),
      }),
    )
    .optional(),
  oras_last_updated: z.coerce.date().nullish(),
});

export const chargeImportSchema = z.object({
  state_code: stateCode,
  case_external_id: z.string(),
  court_case_number: z.string(),
  offense_external_id: z.string(), // Unique identifier for this charge
  description: z.string(), // This becomes the offense name on Charge
  judges: z
    .preprocess(
      (val) => (typeof val === "string" ? [val] : val),
      z.array(z.string()),
    )
    .optional(),
  classification_type: z.nativeEnum(ChargeClassificationType).optional(),
  classification_subtype: z.nativeEnum(ChargeClassificationSubtype).optional(),
  division: z.string().optional(),
  county: z.string().optional(),
  charge_code: z.string().optional(), // MO Code
});

export const clientImportSchema = z
  .object({
    external_id: z.string(),
    pseudonymized_id: z.string(),
    race: z.array(z.string()).optional().default([]),
    case_ids: caseIdsSchema,
    state_code: stateCode,
    full_name: nameSchema,
    gender: gender,
    county: z.string().optional(),
    district: z.string().optional(),
    birth_date: z.coerce.date(),
  })
  .transform((data) => {
    // Spread the full_name object into the root object
    return {
      ...data,
      full_name: fullNameObjectToString(data.full_name),
    };
  });

export const staffImportSchema = z
  .object({
    external_id: z.string(),
    pseudonymized_id: z.string(),
    case_ids: caseIdsSchema,
    state_code: stateCode,
    full_name: nameSchema,
    email: z.string().nullish(), // Email is null for MO staff
    supervisor_id: z.string().nullish(),
    supervises_all: z.string().nullish(),
    office_address: officeAddressSchema,
    office_phone_number: z.string().nullish(),
    district: z.string().nullish(),
  })
  .transform((data) => {
    return {
      ...data,
      full_name: titleCase(fullNameObjectToString(data.full_name)) ?? "",
      // Transform snake_case to camelCase for consistency with DB fields
      officeAddress: data.office_address,
      officePhoneNumber: formatPhoneNumber(data.office_phone_number),
    };
  });

const opportunityGender = z
  .enum(["Women", "Men"])
  .transform((v) => (v === "Women" ? Gender.FEMALE : Gender.MALE));

export const opportunityImportSchema = z.object({
  OpportunityName: z.string(),
  Description: z.string().optional(),
  ProviderName: z
    .string()
    .optional()
    // If providerName is null, we should default to OPPORTUNITY_UNKNOWN_PROVIDER_NAME
    .transform((v) => v ?? OPPORTUNITY_UNKNOWN_PROVIDER_NAME),
  CleanedProviderPhoneNumber: z.string().optional(),
  ProviderWebsite: z.string().optional(),
  ProviderAddress: z.string().optional(),
  NeedsAddressed: needsAddressed,
  developmentalDisabilityDiagnosisCriterion: z.boolean(),
  noCurrentOrPriorSexOffenseCriterion: z.boolean(),
  noCurrentOrPriorViolentOffenseCriterion: z.boolean(),
  noPendingFelonyChargesInAnotherCountyOrStateCriterion: z.boolean(),
  entryOfGuiltyPleaCriterion: z.boolean(),
  veteranStatusCriterion: z.boolean(),
  priorCriminalHistoryCriterion: priorCriminalHistoryCriterion.optional(),
  diagnosedMentalHealthDiagnosisCriterion:
    diagnosedMentalHealthDiagnosisCriterion,
  asamLevelOfCareRecommendationCriterion:
    asamLevelOfCareRecommendationCriterion.optional(),
  diagnosedSubstanceUseDisorderCriterion:
    diagnosedSubstanceUseDisorderCriterion.optional(),
  minLsirScoreCriterion: z.coerce.number().optional(),
  maxLsirScoreCriterion: z.coerce.number().optional(),
  minAge: z.coerce.number().optional(),
  maxAge: z.coerce.number().optional(),
  district: z.string().optional(),
  lastUpdatedDate: z.coerce.date(),
  additionalNotes: z.string().optional(),
  genders: z.array(opportunityGender).optional(),
  genericDescription: z.string().optional(),
  counties: z.array(z.string()),
  status: opportunityStatus.optional(),
});

export const recidivismSeriesSchema = zu.stringToJSON().pipe(
  z.array(
    z.object({
      sentence_type: z.string().optional(),
      sentence_length_bucket_start: z.number().optional(),
      sentence_length_bucket_end: z.number().optional(),
      data_points: z.array(
        z.object({
          cohort_months: z.number(),
          event_rate: z.number(),
          lower_ci: z.number(),
          upper_ci: z.number(),
        }),
      ),
    }),
  ),
);

export const dispositionsSchema = zu.stringToJSON().pipe(
  z.array(
    z.object({
      sentence_type: z.string().optional(),
      sentence_length_bucket_start: z.number().optional(),
      sentence_length_bucket_end: z.number().optional(),
      percentage: z.number(),
    }),
  ),
);

export const recidivismRollupSchema = zu.stringToJSON().pipe(
  z.object({
    state_code: stateCode,
    gender: gender.optional(),
    assessment_score_bucket_start: z.number().optional(),
    assessment_score_bucket_end: z.number().optional(),
    most_severe_description: z.string().optional(),
    most_severe_ncic_category_uniform: z.string().optional(),
    combined_offense_category: z.string().optional(),
    any_is_violent_uniform: z.boolean().optional(),
  }),
);

export const insightImportSchema = z.object({
  state_code: stateCode,
  gender: gender,
  // Integers are being converted to strings for some reason
  assessment_score_bucket_start: z.coerce.number(),
  // Integers are being converted to strings for some reason
  assessment_score_bucket_end: z.coerce.number(),
  most_severe_description: z.string(),
  recidivism_rollup: recidivismRollupSchema,
  // Integers are being converted to strings for some reason
  recidivism_num_records: z.coerce.number(),
  recidivism_series: recidivismSeriesSchema,
  // Integers are being converted to strings for some reason
  disposition_num_records: z.coerce.number().optional(),
  dispositions: dispositionsSchema,
});

export const timeServedImportSchema = z.object({
  state_code: stateCode,
  most_severe_description: z.string(),
  sex: gender,
  assessment_level: z.string().nullish(),
  // Sentence length stats: all incarceration cases since 2017
  n_all: z.coerce.number(),
  avg_sentence_length_yrs: z.coerce.number(),
  avg_credit_days: z.coerce.number(),
  // Pct served stats: elapsed sentences only — null when n_elapsed = 0
  n_elapsed: z.coerce.number(),
  avg_pct_served: z.coerce.number().nullish(),
  ci95: z.coerce.number().nullish(),
});

const mandatoryMinimumsSchema = z.array(
  z.object({
    SentenceType: z.string(),
    MinimumSentenceLength: z.coerce.number().nullable(),
    MaximumSentenceLength: z.coerce.number().nullable(),
    StatuteNumber: z.string().nullish(),
    StatuteLink: z.string().nullish(),
  }),
);

export const offenseImportSchema = z.object({
  state_code: stateCode,
  charge: z.string(),
  recidiviz_offense_category: z.string().optional(),
  is_sex_offense: z.boolean().optional(),
  is_violent: z.boolean().optional(),
  // Integers are being converted to strings for some reason
  frequency: z.coerce.number(),
  mandatory_minimums: mandatoryMinimumsSchema.optional(),
});

export const countyAndDistrictImportSchema = z.object({
  state_code: stateCode,
  county: z.string(),
  district: z.string(),
});

// Map incoming category strings to TreatmentProgramCategory enum values
const categoryStringToEnum: Record<string, TreatmentProgramCategory> = {
  ANGER: TreatmentProgramCategory.Anger,
  "CAREER / TECHNICAL": TreatmentProgramCategory.CareerTechnical,
  COGNITIVE: TreatmentProgramCategory.Cognitive,
  COLLEGE: TreatmentProgramCategory.College,
  "COMMUNITY PARTNERSHIP": TreatmentProgramCategory.CommunityPartnership,
  "COMMUNITY TREATMENT": TreatmentProgramCategory.CommunityTreatment,
  EDUCATION: TreatmentProgramCategory.Education,
  "FAITH BASED": TreatmentProgramCategory.FaithBased,
  "INSTITUTIONAL TREATMENT": TreatmentProgramCategory.InstitutionalTreatment,
  "LIFE SKILLS": TreatmentProgramCategory.LifeSkills,
  PARENTING: TreatmentProgramCategory.Parenting,
  "RE-ENTRY": TreatmentProgramCategory.ReEntry,
  "SEX OFFENDER": TreatmentProgramCategory.SexOffender,
  "SHOCK INCARCERATION": TreatmentProgramCategory.ShockIncarceration,
};

const treatmentCategorySchema = z
  .string()
  .transform((val) => categoryStringToEnum[val])
  .optional();

const completedProgramSchema = z.array(
  z.object({
    category: treatmentCategorySchema,
    completion_date: z.coerce.date(),
    program_name: z.string(),
    start_date: z.coerce.date(),
  }),
);

const employmentHistorySchema = z.array(
  z.object({
    employer_name: z.string().nullable(),
    end_date: z.coerce.date(),
    start_date: z.coerce.date(),
  }),
);

export const clientHistoryImportSchema = z.object({
  state_code: stateCode,
  client_external_id: z.string(),
  completed_programs: completedProgramSchema.nullish(),
  employment_history: employmentHistorySchema.nullish(),
});
