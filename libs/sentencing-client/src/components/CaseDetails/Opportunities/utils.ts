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
import {
  AGE_KEY,
  ASAM_CARE_RECOMMENDATION_KEY,
  CLIENT_GENDER_KEY,
  HAS_DEVELOPMENTAL_DISABILITY_KEY,
  HAS_PREVIOUS_SEX_OFFENSE_KEY,
  HAS_PREVIOUS_VIOLENT_OFFENSE_KEY,
  IS_VETERAN_KEY,
  LSIR_SCORE_KEY,
  MENTAL_HEALTH_DIAGNOSES_KEY,
  NEEDS_TO_BE_ADDRESSED_KEY,
  PLEA_KEY,
  PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
  SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
} from "../constants";
import {
  ANY_OPTION,
  MILD_OPTION,
  MODERATE_OPTION,
  NONE_OPTION,
  SEVERE_OPTION,
} from "../Form/constants";
import { FormValue, RecommendationType } from "../types";
import { eligibilityCriteriaToLabelName, UNKNOWN } from "./constants";
import { EligibilityAttributes, EligibilityCriteria } from "./types";

const DEFAULT_MIN_NUMBER = 0;
const DEFAULT_MAX_NUMBER = 1000;

export const createOpportunityProviderDisplayName = (
  opportunityName: string,
  providerName: string | null,
) => {
  if (opportunityName === providerName) {
    return opportunityName;
  }

  return providerName
    ? `${opportunityName} - ${providerName}`
    : opportunityName;
};

const eligibilityCriteriaKeys = Object.keys(
  eligibilityCriteriaToLabelName,
) as (keyof EligibilityCriteria)[];

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
  convertDistrictToDistrictCodeFn?: (district?: string | null) => string | null,
) => {
  const {
    minAge,
    maxAge,
    genders,
    counties,
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
    district: opportunityDistrict,
    // TODO(Recidiviz/recidiviz-data#32242) Add CPS Criteria Check
    // hasOpenChildProtectiveServicesCaseCriterion
  } = opportunity;
  const {
    districtOfResidence,
    districtOfSentencing,
    countyOfSentencing,
    countyOfResidence,
  } = attributes;

  // Age Criteria Check
  const hasAgeCriteria = Boolean(minAge || maxAge);
  const isNotAgeEligible =
    attributes.age &&
    (attributes.age < (minAge ?? DEFAULT_MIN_NUMBER) ||
      attributes.age > (maxAge ?? DEFAULT_MAX_NUMBER));

  if (AGE_KEY in attributes && hasAgeCriteria && isNotAgeEligible) return false;

  // Gender(s) Criteria Check
  const hasGenderCriteria = Boolean(genders.length);
  const isNotGenderEligible =
    attributes.clientGender && !genders.includes(attributes.clientGender);

  if (
    CLIENT_GENDER_KEY in attributes &&
    hasGenderCriteria &&
    isNotGenderEligible
  )
    return false;

  // Counties Criteria Check
  const hasMatchingCountiesOfSentencingResidence =
    countyOfSentencing?.toLocaleLowerCase() ===
    countyOfResidence?.toLocaleLowerCase();
  const countyName =
    hasMatchingCountiesOfSentencingResidence ||
    !countyOfResidence ||
    countyOfResidence === UNKNOWN
      ? countyOfSentencing
      : countyOfResidence;
  const isCountyEligible =
    countyName &&
    counties
      .map((county: string) => county.toLocaleLowerCase())
      .includes(countyName.toLocaleLowerCase());
  const hasCountiesCriteria = counties.length;

  if (hasCountiesCriteria && !isCountyEligible) return false;

  // Districts Check
  const hasMatchingDistricts =
    districtOfSentencing?.toLocaleLowerCase() ===
    districtOfResidence?.toLocaleLowerCase();
  const districtName =
    hasMatchingDistricts || !districtOfResidence
      ? districtOfSentencing
      : districtOfResidence;
  const district = convertDistrictToDistrictCodeFn
    ? convertDistrictToDistrictCodeFn(districtName)
    : districtName;
  const isDistrictEligible = district && opportunityDistrict === district;

  if (!isDistrictEligible) return false;

  // Developmental Disability Criteria Check
  const hasDevelopmentalDisabilityCriteria = Boolean(
    developmentalDisabilityDiagnosisCriterion,
  );
  const isDevelopmentalDisabilityEligible =
    developmentalDisabilityDiagnosisCriterion ===
    attributes.hasDevelopmentalDisability;

  if (
    HAS_DEVELOPMENTAL_DISABILITY_KEY in attributes &&
    hasDevelopmentalDisabilityCriteria &&
    !isDevelopmentalDisabilityEligible
  )
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
    noCurrentOrPriorSexOffenseCriterion !==
      attributes.hasPreviousSexOffenseConviction &&
    noCurrentOrPriorSexOffenseCriterion !== attributes.isCurrentOffenseSexual;

  if (
    HAS_PREVIOUS_SEX_OFFENSE_KEY in attributes &&
    hasSexOffenseCriteria &&
    !isSexOffenseEligible
  )
    return false;

  // Violent Offense Criteria Check
  const hasViolentOffenseCriteria = Boolean(
    noCurrentOrPriorViolentOffenseCriterion,
  );
  const isViolentOffenseEligible =
    noCurrentOrPriorViolentOffenseCriterion !==
      attributes.hasPreviousViolentOffenseConviction &&
    noCurrentOrPriorViolentOffenseCriterion !==
      attributes.isCurrentOffenseViolent;

  if (
    HAS_PREVIOUS_VIOLENT_OFFENSE_KEY in attributes &&
    hasViolentOffenseCriteria &&
    !isViolentOffenseEligible
  )
    return false;

  // Criminal History Criteria Check
  const hasCriminalHistoryCriteria = Boolean(priorCriminalHistoryCriterion);
  const isCriminalHistoryEligible =
    (priorCriminalHistoryCriterion === NONE_OPTION &&
      !attributes.previouslyIncarceratedOrUnderSupervision) ||
    (priorCriminalHistoryCriterion === "Significant" &&
      attributes.previouslyIncarceratedOrUnderSupervision);

  if (
    PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY in attributes &&
    hasCriminalHistoryCriteria &&
    !isCriminalHistoryEligible
  )
    return false;

  // Plea Criteria Check
  const hasGuiltyPleaCriteria = Boolean(entryOfGuiltyPleaCriterion);
  const isPleaEligible =
    entryOfGuiltyPleaCriterion ===
    (attributes.plea === "AlfordPlea" || attributes.plea === "Guilty");

  if (PLEA_KEY in attributes && hasGuiltyPleaCriteria && !isPleaEligible)
    return false;

  // Veteran Status Criteria Check
  const hasVeteranCriteria = Boolean(veteranStatusCriterion);
  const isVeteranEligible = veteranStatusCriterion === attributes.isVeteran;

  if (IS_VETERAN_KEY in attributes && hasVeteranCriteria && !isVeteranEligible)
    return false;

  // Mental Health Diagnosis Criteria Check
  const hasMentalHealthDiagnosesCriteria =
    diagnosedMentalHealthDiagnosisCriterion &&
    diagnosedMentalHealthDiagnosisCriterion.length > 0;
  const isAnyCriteriaAndHasMinOneDiagnoses =
    diagnosedMentalHealthDiagnosisCriterion.includes(ANY_OPTION) &&
    attributes.mentalHealthDiagnoses &&
    attributes.mentalHealthDiagnoses.length > 0 &&
    attributes.mentalHealthDiagnoses?.[0] !== NONE_OPTION;
  const hasOneMatchingDiagnosis =
    attributes.mentalHealthDiagnoses?.[0] !== NONE_OPTION &&
    diagnosedMentalHealthDiagnosisCriterion.some(
      (diagnosis) =>
        diagnosis !== ANY_OPTION &&
        attributes.mentalHealthDiagnoses?.includes(diagnosis),
    );
  const isMentalHealthDiagnosisEligible =
    diagnosedMentalHealthDiagnosisCriterion &&
    (isAnyCriteriaAndHasMinOneDiagnoses || hasOneMatchingDiagnosis);

  if (
    MENTAL_HEALTH_DIAGNOSES_KEY in attributes &&
    hasMentalHealthDiagnosesCriteria &&
    !isMentalHealthDiagnosisEligible
  )
    return false;

  // Substance Use Disorder Criteria Check
  const orderedSubstanceLevels = [
    ANY_OPTION,
    MILD_OPTION,
    MODERATE_OPTION,
    SEVERE_OPTION,
  ];
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

  if (
    SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY in attributes &&
    hasSubstanceUseDisorderCriteria &&
    !isSubstanceUseDisorderEligible
  )
    return false;

  // ASAM Level of Care Criteria Check
  const hasAsamCareRecommendationCriteria = Boolean(
    asamLevelOfCareRecommendationCriterion,
  );
  const isAsamCareRecommendationEligible =
    asamLevelOfCareRecommendationCriterion ===
    attributes.asamCareRecommendation;

  if (
    ASAM_CARE_RECOMMENDATION_KEY in attributes &&
    hasAsamCareRecommendationCriteria &&
    !isAsamCareRecommendationEligible
  )
    return false;

  // Needs Addressed Criteria Check
  const hasNeedsAddressedCriteria = needsAddressed && needsAddressed.length > 0;
  const isNeedsAddressedEligible =
    needsAddressed &&
    needsAddressed.some((need) =>
      attributes.needsToBeAddressed?.includes(need),
    );

  if (
    NEEDS_TO_BE_ADDRESSED_KEY in attributes &&
    attributes.needsToBeAddressed &&
    attributes.needsToBeAddressed.length > 0 &&
    hasNeedsAddressedCriteria &&
    !isNeedsAddressedEligible
  )
    return false;

  // LSIR Score Criteria Check
  const hasLsirScoreCriteria = Boolean(
    minLsirScoreCriterion || maxLsirScoreCriterion,
  );
  const isLsirScoreEligible =
    attributes.lsirScore &&
    (minLsirScoreCriterion ?? DEFAULT_MIN_NUMBER) <= attributes.lsirScore &&
    attributes.lsirScore <= (maxLsirScoreCriterion ?? DEFAULT_MAX_NUMBER);

  if (
    LSIR_SCORE_KEY in attributes &&
    hasLsirScoreCriteria &&
    !isLsirScoreEligible
  )
    return false;

  return true;
};

export const formatPhoneNumber = (basePhoneNumberString: string) => {
  return `(${basePhoneNumberString.slice(0, 3)}) ${basePhoneNumberString.slice(3, 6)}-${basePhoneNumberString.slice(6)}`;
};

export const formatPhoneNumberWithExtension = (phoneNumberString: string) => {
  const sanitizedNumber = phoneNumberString.replace(/\D/g, ""); // Remove non-digit characters
  const basePhoneLength = 10;

  if (sanitizedNumber.length < basePhoneLength) return null; // Not a valid number

  const formattedNumbers = [];
  let remainingDigits = sanitizedNumber;

  while (remainingDigits.length > 0) {
    const hasCountryCode = remainingDigits.startsWith("1");
    let basePhoneNumber;

    if (hasCountryCode && remainingDigits.length >= basePhoneLength + 1) {
      basePhoneNumber = remainingDigits.slice(1, basePhoneLength + 1);
      remainingDigits = remainingDigits.slice(basePhoneLength + 1);
    } else if (remainingDigits.length >= basePhoneLength) {
      basePhoneNumber = remainingDigits.slice(0, basePhoneLength);
      remainingDigits = remainingDigits.slice(basePhoneLength);
    } else {
      // Treat as an extension if not enough digits left for a full phone number
      formattedNumbers.push(`${formattedNumbers.pop()} x${remainingDigits}`);
      break;
    }

    const formattedPhoneNumber = formatPhoneNumber(basePhoneNumber);
    formattedNumbers.push(formattedPhoneNumber);
  }

  return formattedNumbers.join(", ");
};

export const getOpportunityButtonTooltipText = (
  isAddedOpportunity: boolean,
  selectedRecommendation?: string | null,
) => {
  return isAddedOpportunity && selectedRecommendation
    ? "Switch your recommendation back to Probation if you want to add or remove opportunities"
    : `You cannot add or edit opportunities when ${selectedRecommendation === RecommendationType.None || !selectedRecommendation ? "no" : selectedRecommendation} recommendation is selected`;
};
