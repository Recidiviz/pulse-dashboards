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

import { Opportunities } from "../../../api";
import { FormValue } from "../types";
import { eligibilityCriteriaToLabelName } from "./constants";
import { EligibilityAttributes } from "./types";

const DEFAULT_MIN_NUMBER = 0;
const DEFAULT_MAX_NUMBER = 1000;

export const createOpportunityProviderDisplayName = (
  opportunityName: string,
  providerName: string | null,
) => {
  return providerName
    ? `${opportunityName} - ${providerName}`
    : opportunityName;
};

const eligibilityCriteriaKeys = Object.keys(
  eligibilityCriteriaToLabelName,
) as (keyof Opportunities[number])[];

export const getEligibilityCriteria = (opportunity: Opportunities[number]) => {
  return eligibilityCriteriaKeys.reduce(
    (acc, key) => {
      const value = opportunity[key];
      const hasValue = Array.isArray(value) ? value.length > 0 : value;
      if (hasValue) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<keyof Opportunities[number], FormValue>,
  );
};

export const filterEligibleOpportunities = (
  opportunity: Opportunities[number],
  attributes: EligibilityAttributes,
) => {
  const {
    minAge,
    maxAge,
    developmentalDisabilityDiagnosisCriterion,
    noCurrentOrPriorSexOffenseCriterion,
    noCurrentOrPriorViolentOffenseCriterion,
    priorCriminalHistoryCriterion,
    entryOfGuiltyPleaCriterion,
    veteranStatusCriterion,
    diagnosedMentalHealthDiagnosisCriterion,
    diagnosedSubstanceUseDisorderCriterion,
    asamLevelOfCareRecommendationCriterion,
    needsAddressed,
    minLsirScoreCriterion,
    maxLsirScoreCriterion,
    // TODO(Recidiviz/recidiviz-data#32242) Add CPS Criteria Check
    // hasOpenChildProtectiveServicesCaseCriterion
  } = opportunity;

  // Age Criteria Check
  const hasAgeCriteria = Boolean(minAge || maxAge);
  const isNotAgeEligible =
    attributes.age < (minAge ?? DEFAULT_MIN_NUMBER) ||
    attributes.age > (maxAge ?? DEFAULT_MAX_NUMBER);

  if (hasAgeCriteria && isNotAgeEligible) return false;

  // Developmental Disability Criteria Check
  const hasDevelopmentalDisabilityCriteria = Boolean(
    developmentalDisabilityDiagnosisCriterion,
  );
  const isDevelopmentalDisabilityEligible =
    developmentalDisabilityDiagnosisCriterion ===
    attributes.hasDevelopmentalDisability;

  if (hasDevelopmentalDisabilityCriteria && !isDevelopmentalDisabilityEligible)
    return false;

  // TODO(Recidiviz/recidiviz-data#32242) Add CPS Criteria Check
  // const hasOpenChildProtectiveServicesCriteria = Boolean(
  //   noCurrentOrPriorSexOffenseCriterion,
  // );
  // const isOpenChildProtectiveServicesEligible =
  //   hasOpenChildProtectiveServicesCaseCriterion ===
  //   !attributes.hasOpenChildProtectiveServicesCase;

  // if (
  //   hasOpenChildProtectiveServicesCriteria &&
  //   !isOpenChildProtectiveServicesEligible
  // )
  //   return false;

  // Sex Offense Criteria Check
  const hasSexOffenseCriteria = Boolean(noCurrentOrPriorSexOffenseCriterion);
  const isSexOffenseEligible =
    noCurrentOrPriorSexOffenseCriterion ===
    !attributes.hasPreviousSexOffenseConviction;

  if (hasSexOffenseCriteria && !isSexOffenseEligible) return false;

  // Violent Offense Criteria Check
  const hasViolentOffenseCriteria = Boolean(
    noCurrentOrPriorViolentOffenseCriterion,
  );
  const isViolentOffenseEligible =
    noCurrentOrPriorViolentOffenseCriterion ===
    !attributes.hasPreviousViolentOffenseConviction;

  if (hasViolentOffenseCriteria && !isViolentOffenseEligible) return false;

  // Criminal History Criteria Check
  const hasCriminalHistoryCriteria = Boolean(priorCriminalHistoryCriterion);
  const isCriminalHistoryEligible =
    (priorCriminalHistoryCriterion === "None" &&
      !attributes.previouslyIncarceratedOrUnderSupervision) ||
    (priorCriminalHistoryCriterion === "Significant" &&
      attributes.previouslyIncarceratedOrUnderSupervision);

  if (hasCriminalHistoryCriteria && !isCriminalHistoryEligible) return false;

  // Plea Criteria Check
  const hasGuiltyPleaCriteria = Boolean(entryOfGuiltyPleaCriterion);
  const isPleaEligible =
    entryOfGuiltyPleaCriterion ===
    (attributes.plea === "AlfordPlea" || attributes.plea === "Guilty");

  if (hasGuiltyPleaCriteria && !isPleaEligible) return false;

  // Veteran Status Criteria Check
  const hasVeteranCriteria = Boolean(veteranStatusCriterion);
  const isVeteranEligible = veteranStatusCriterion === attributes.isVeteran;

  if (hasVeteranCriteria && !isVeteranEligible) return false;

  // Mental Health Diagnosis Criteria Check
  const hasMentalHealthDiagnosesCriteria =
    diagnosedMentalHealthDiagnosisCriterion &&
    diagnosedMentalHealthDiagnosisCriterion.length > 0;
  const isAnyCriteriaAndHasMinOneDiagnoses =
    diagnosedMentalHealthDiagnosisCriterion.includes("Any") &&
    attributes.mentalHealthDiagnoses.length > 0 &&
    attributes.mentalHealthDiagnoses?.[0] !== "None";
  const hasOneMatchingDiagnosis =
    attributes.mentalHealthDiagnoses?.[0] !== "None" &&
    diagnosedMentalHealthDiagnosisCriterion.some(
      (diagnosis) =>
        diagnosis !== "Any" &&
        attributes.mentalHealthDiagnoses?.includes(diagnosis),
    );
  const isMentalHealthDiagnosisEligible =
    diagnosedMentalHealthDiagnosisCriterion &&
    (isAnyCriteriaAndHasMinOneDiagnoses || hasOneMatchingDiagnosis);

  if (hasMentalHealthDiagnosesCriteria && !isMentalHealthDiagnosisEligible)
    return false;

  // Substance Use Disorder Criteria Check
  const orderedSubstanceLevels = ["Any", "Mild", "Moderate", "Severe"];
  const hasSubstanceUseDisorderCriteria = Boolean(
    diagnosedSubstanceUseDisorderCriterion,
  );
  const isSubstanceUseDisorderEligible =
    diagnosedSubstanceUseDisorderCriterion &&
    attributes.substanceUseDisorderDiagnosis &&
    orderedSubstanceLevels.findIndex(
      (level) => level === diagnosedSubstanceUseDisorderCriterion,
    ) <=
      orderedSubstanceLevels.findIndex(
        (level) => level === attributes.substanceUseDisorderDiagnosis,
      );

  if (hasSubstanceUseDisorderCriteria && !isSubstanceUseDisorderEligible)
    return false;

  // ASAM Level of Care Criteria Check
  const hasAsamCareRecommendationCriteria = Boolean(
    asamLevelOfCareRecommendationCriterion,
  );
  const isAsamCareRecommendationEligible =
    asamLevelOfCareRecommendationCriterion ===
    attributes.asamCareRecommendation;

  if (hasAsamCareRecommendationCriteria && !isAsamCareRecommendationEligible)
    return false;

  // Needs Addressed Criteria Check
  const hasNeedsAddressedCriteria = needsAddressed && needsAddressed.length > 0;
  const isNeedsAddressedEligible =
    needsAddressed &&
    needsAddressed.some((need) =>
      attributes.needsToBeAddressed?.includes(need),
    );

  if (hasNeedsAddressedCriteria && !isNeedsAddressedEligible) return false;

  // LSIR Score Criteria Check
  const hasLsirScoreCriteria = Boolean(
    minLsirScoreCriterion || maxLsirScoreCriterion,
  );
  const isLsirScoreEligible =
    attributes.lsirScore &&
    (minLsirScoreCriterion ?? DEFAULT_MIN_NUMBER) <= attributes.lsirScore &&
    attributes.lsirScore <= (maxLsirScoreCriterion ?? DEFAULT_MAX_NUMBER);

  if (hasLsirScoreCriteria && !isLsirScoreEligible) return false;

  return true;
};
