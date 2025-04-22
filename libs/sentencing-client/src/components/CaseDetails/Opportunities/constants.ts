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

import { EligibilityCriteria } from "./types";

export const NEEDS_ADDRESSED_CRITERIA_KEY = "needsAddressed";

export const ASAM_CARE_RECOMMENDATION_CRITERIA_KEY =
  "asamLevelOfCareRecommendationCriterion";

export const MENTAL_HEALTH_DIAGNOSES_CRITERIA_KEY =
  "diagnosedMentalHealthDiagnosisCriterion";

export const DIAGNOSED_SUBSTANCE_USE_SEVERITY_CRITERIA_KEY =
  "diagnosedSubstanceUseDisorderCriterion";

export const MIN_LSIR_SCORE_CRITERIA_KEY = "minLsirScoreCriterion";

export const MAX_LSIR_SCORE_CRITERIA_KEY = "maxLsirScoreCriterion";

export const MIN_AGE_KEY = "minAge";

export const DEVELOPMENTAL_DISABILITY_DIAGNOSIS_CRITERION_KEY =
  "developmentalDisabilityDiagnosisCriterion";

export const MAX_AGE_KEY = "maxAge";

export const NO_CURRENT_OR_PRIOR_SEX_OFFENSE_CRITERION_KEY =
  "noCurrentOrPriorSexOffenseCriterion";

export const NO_CURRENT_OR_PRIOR_VIOLENT_OFFENSE_CRITERION_KEY =
  "noCurrentOrPriorViolentOffenseCriterion";

export const NO_PENDING_FELONY_CHARGES_IN_ANOTHER_COUNTY_OR_STATE_CRITERION_KEY =
  "noPendingFelonyChargesInAnotherCountyOrStateCriterion";

export const ENTRY_OF_GUILTY_PLEA_CRITERION_KEY = "entryOfGuiltyPleaCriterion";

export const VETERAN_STATUS_CRITERION_KEY = "veteranStatusCriterion";

export const PRIOR_CRIMINAL_HISTORY_CRITERION_KEY =
  "priorCriminalHistoryCriterion";

export const UNKNOWN = "UNKNOWN";

export const eligibilityCriteriaToLabelName: Record<
  keyof EligibilityCriteria,
  string
> = {
  [MIN_AGE_KEY]: "Minimum Age",
  [MAX_AGE_KEY]: "Maximum Age",
  [MIN_LSIR_SCORE_CRITERIA_KEY]: "Minimum LSI-R score",
  [MAX_LSIR_SCORE_CRITERIA_KEY]: "Maximum LSI-R score",
  [VETERAN_STATUS_CRITERION_KEY]: "Veteran",
  [DEVELOPMENTAL_DISABILITY_DIAGNOSIS_CRITERION_KEY]:
    "Has developmental disability diagnosis",
  [MENTAL_HEALTH_DIAGNOSES_CRITERIA_KEY]: "Mental health diagnoses",
  [DIAGNOSED_SUBSTANCE_USE_SEVERITY_CRITERIA_KEY]:
    "Substance use disorder severity",
  [ASAM_CARE_RECOMMENDATION_CRITERIA_KEY]: "ASAM level of care recommendation",
  [PRIOR_CRIMINAL_HISTORY_CRITERION_KEY]: "Prior criminal history",
  [ENTRY_OF_GUILTY_PLEA_CRITERION_KEY]: "Guilty plea",
  [NO_CURRENT_OR_PRIOR_SEX_OFFENSE_CRITERION_KEY]:
    "No current/prior sex offense",
  [NO_CURRENT_OR_PRIOR_VIOLENT_OFFENSE_CRITERION_KEY]:
    "No current/prior violent offense",
  [NO_PENDING_FELONY_CHARGES_IN_ANOTHER_COUNTY_OR_STATE_CRITERION_KEY]:
    "No pending felony charges in another county or state",
};

export const OPPORTUNITY_TOOLTIP_WIDTH = 244;
