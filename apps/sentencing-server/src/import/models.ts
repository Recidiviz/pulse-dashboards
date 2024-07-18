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

import { fullNameObjectToString } from "~sentencing-server/import/utils";

const stateCode = z.nativeEnum(StateCode);

const gender = z.nativeEnum(Gender);

const needToBeAddressed = z.array(z.nativeEnum(NeedToBeAddressed));

const priorCriminalHistoryCriterion = z.array(
  z.nativeEnum(PriorCriminalHistoryCriterion),
);
const diagnosedMentalHealthDiagnosisCriterion = z.array(
  z.nativeEnum(DiagnosedMentalHealthDiagnosisCriterion),
);
const asamLevelOfCareRecommendationCriterion = z.array(
  z.nativeEnum(AsamLevelOfCareRecommendationCriterion),
);
const diagnosedSubstanceUseDisorderCriterion = z.array(
  z.nativeEnum(DiagnosedSubstanceUseDisorderCriterion),
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

export const caseImportSchema = z.array(
  z.object({
    external_id: z.string(),
    state_code: stateCode,
    staff_id: z.string(),
    client_id: z.string(),
    due_date: z.coerce.date(),
    completion_date: z.coerce.date(),
    sentence_date: z.coerce.date(),
    assigned_date: z.coerce.date(),
    county: z.string(),
    lsir_score: z.coerce.number().optional(),
    lsir_level: z.string().optional(),
    report_type: z.string(),
  }),
);

export const clientImportSchema = z.array(
  z
    .object({
      external_id: z.string(),
      pseudonymized_id: z.string(),
      case_ids: caseIdsSchema,
      state_code: stateCode,
      full_name: nameSchema,
      gender: gender,
      county: z.string().optional(),
      birth_date: z.coerce.date(),
    })
    .transform((data) => {
      // Spread the full_name object into the root object
      return {
        ...data,
        full_name: fullNameObjectToString(data.full_name),
      };
    }),
);

export const staffImportSchema = z.array(
  z
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
    }),
);

export const opportunityImportSchema = z.array(
  z.object({
    OpportunityName: z.string(),
    Description: z.string(),
    ProviderName: z.string(),
    CleanedProviderPhoneNumber: z.string(),
    ProviderWebsite: z.string(),
    ProviderAddress: z.string(),
    CapacityTotal: z.number(),
    CapacityAvailable: z.number(),
    NeedsAddressed: needToBeAddressed.optional(),
    eighteenOrOlderCriterion: z.boolean(),
    developmentalDisabilityDiagnosisCriterion: z.boolean(),
    minorCriterion: z.boolean(),
    noCurrentOrPriorSexOffenseCriterion: z.boolean(),
    noCurrentOrPriorViolentOffenseCriterion: z.boolean(),
    noPendingFelonyChargesInAnotherCountyOrStateCriterion: z.boolean(),
    entryOfGuiltyPleaCriterion: z.boolean(),
    veteranStatusCriterion: z.boolean(),
    priorCriminalHistoryCriterion: priorCriminalHistoryCriterion.optional(),
    diagnosedMentalHealthDiagnosisCriterion:
      diagnosedMentalHealthDiagnosisCriterion.optional(),
    asamLevelOfCareRecommendationCriterion:
      asamLevelOfCareRecommendationCriterion.optional(),
    diagnosedSubstanceUseDisorderCriterion:
      diagnosedSubstanceUseDisorderCriterion.optional(),
    minLsirScoreCriterion: z.number().optional(),
    maxLsirScoreCriterion: z.number().optional(),
  }),
);

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

export const insightImportSchema = z.array(
  z.object({
    state_code: stateCode,
    gender: gender,
    assessment_score_bucket_start: z.number(),
    assessment_score_bucket_end: z.number(),
    most_severe_description: z.string(),
    recidivism_rollup: z.string(),
    recidivism_num_records: z.number(),
    recidivism_probation_series: recidivismSeriesSchema,
    recidivism_rider_series: recidivismSeriesSchema,
    recidivism_term_series: recidivismSeriesSchema,
    disposition_num_records: z.number(),
    disposition_probation_pc: z.number(),
    disposition_rider_pc: z.number(),
    disposition_term_pc: z.number(),
  }),
);
