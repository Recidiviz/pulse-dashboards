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
  AsamLevelOfCareRecommendationCriterion,
  DiagnosedMentalHealthDiagnosisCriterion,
  DiagnosedSubstanceUseDisorderCriterion,
  Gender,
  NeedToBeAddressed,
  PriorCriminalHistoryCriterion,
  StateCode,
} from "@prisma/client";
import z from "zod";
import { zu } from "zod_utilz";

import { OPPORTUNITY_UNKNOWN_PROVIDER_NAME } from "~sentencing-server/common/constants";

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

export const nameSchema = zu.stringToJSON().pipe(
  z.object({
    given_names: z.string(),
    middle_names: z.string(),
    name_suffix: z.string(),
    surname: z.string(),
  }),
);

const caseIdsSchema = zu.stringToJSON().pipe(z.array(z.string()));

const reportType = z.enum([
  "PSI Assigned Full",
  "PSI File Review Assigned",
  "PSI File Review w/LSI Assigned",
]);

export const caseImportSchema = z.object({
  external_id: z.string(),
  state_code: stateCode,
  staff_id: z.string(),
  client_id: z.string(),
  due_date: z.coerce.date().optional(),
  completion_date: z.coerce.date().optional(),
  sentence_date: z.coerce.date(),
  assigned_date: z.coerce.date(),
  county: z.string(),
  lsir_score: z.coerce.number().optional(),
  lsir_level: z.string().optional(),
  report_type: reportType.optional(),
});

export const clientImportSchema = z
  .object({
    external_id: z.string(),
    pseudonymized_id: z.string(),
    case_ids: caseIdsSchema,
    state_code: stateCode,
    full_name: nameSchema,
    gender: gender,
    county: z.string().optional(),
    birth_date: z.coerce.date(),
    district: z.string().optional(),
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
    email: z.string(),
  })
  .transform((data) => {
    // Spread the full_name object into the root object
    return {
      ...data,
      full_name: fullNameObjectToString(data.full_name),
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
  // Integers are being converted to strings for some reason
  CapacityTotal: z.coerce.number().optional(),
  // Integers are being converted to strings for some reason
  CapacityAvailable: z.coerce.number().optional(),
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
});

export const recidivismSeriesSchema = zu.stringToJSON().pipe(
  z.array(
    z.object({
      cohort_months: z.number(),
      event_rate: z.number(),
      lower_ci: z.number(),
      upper_ci: z.number(),
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
    violent_offense: z.boolean().optional(),
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
  recidivism_probation_series: recidivismSeriesSchema.optional(),
  recidivism_rider_series: recidivismSeriesSchema.optional(),
  recidivism_term_series: recidivismSeriesSchema.optional(),
  // Integers are being converted to strings for some reason
  disposition_num_records: z.coerce.number(),
  disposition_probation_pc: z.number(),
  disposition_rider_pc: z.number(),
  disposition_term_pc: z.number(),
});

export const offenseImportSchema = z.object({
  state_code: stateCode,
  charge: z.string(),
  is_sex_offense: z.boolean().optional(),
  is_violent: z.boolean().optional(),
});
