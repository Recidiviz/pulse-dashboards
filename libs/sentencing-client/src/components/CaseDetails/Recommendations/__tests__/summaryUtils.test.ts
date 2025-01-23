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

import { Case } from "../../../../api";
import { pluralizeDuplicates } from "../../../../utils/utils";
import { OTHER_OPTION } from "../../Form/constants";
import { RecommendationType } from "../../types";
import {
  formatNeedsList,
  generateRecommendationSummary,
} from "../summaryUtils";
import { GenerateRecommendationProps } from "../types";

const allNeeds: Case["needsToBeAddressed"] = [
  "AngerManagement",
  "CaseManagement",
  "DomesticViolenceIssues",
  "ClothingAndToiletries",
  "Education",
  "FamilyServices",
  "FoodInsecurity",
  "FinancialAssistance",
  "Healthcare",
  "GeneralReEntrySupport",
  "HousingOpportunities",
  "JobTrainingOrOpportunities",
  "MentalHealth",
  "SubstanceUse",
  "Transportation",
  "Other",
];

const allProtectiveFactors: Case["protectiveFactors"] = [
  "NoPriorCriminalConvictions",
  "NoHistoryOfViolentBehavior",
  "NoSubstanceAbuseIssues",
  "HistoryOfSuccessUnderSupervision",
  "LengthyPeriodsOfSobrietyAfterCompletingTreatment",
  "NoDiagnosisOfAMentalIllness",
  "StableHousing",
  "SteadyEmployment",
  "FinancialStability",
  "HighSchoolDiplomaOrHigherEducation",
  "StrongSocialSupportNetwork",
  "CloseFamilyTies",
  "ActivelyParticipatingInTreatmentPrograms",
  "EnrolledInEducationalOrVocationalTraining",
  "ActiveInvolvementInCommunityActivities",
  "Other",
];

const sampleOpportunityDescriptions = pluralizeDuplicates([
  "mental health provider",
  "inpatient substance use treatment facility",
  "inpatient substance use treatment facility",
  "mental health court",
  "veterans court",
  "mental health court",
]);

const probationOrNoneExclusionList: Case["needsToBeAddressed"] = [
  "ClothingAndToiletries",
  "GeneralReEntrySupport",
  OTHER_OPTION,
];

const riderOrTermExclusionList: Case["needsToBeAddressed"] = [
  "CaseManagement",
  "FamilyServices",
  "FinancialAssistance",
  "FoodInsecurity",
  "HousingOpportunities",
  "JobTrainingOrOpportunities",
  "Transportation",
  ...probationOrNoneExclusionList,
];

const generateTestFormattedRecommendationSummary = (
  props: GenerateRecommendationProps,
) =>
  generateRecommendationSummary(props)
    ?.replace(/\s{2,}/g, " ")
    .trim();

/**
 * Based on the following requirements provided ([link to doc](https://docs.google.com/document/d/1-cSzLhJoH_pnSn599ikDTj9blx7UYHWauYLUItSsPy0/)):
 *   - Clothing & toiletries → Don’t include period
 *   - General reentry support → Don’t include period
 *   - Case management → Don’t include for Rider/term recs
 *   - Domestic violence issues → “Domestic violence training”
 *   - Family services → “Family support”; Don’t include for Rider/term recs
 *   - Financial services → “Financial support”; Don’t include for Rider/term recs
 *   - Food insecurity → Don’t include for Rider/term recs
 *   - Housing opportunities → “Housing”; Don’t include for Rider/term recs
 *   - Job training or opportunities → “Vocational training”; Don’t include for Rider/term recs
 *   - Transportation → Don’t include for Rider/term recs
 */
describe("formatNeedsList", () => {
  test("format needs list based on Rider recommendation type", () => {
    const result = formatNeedsList(allNeeds, riderOrTermExclusionList);
    expect(result).toEqual([
      "Anger Management",
      "Domestic Violence Training",
      "Education",
      "Healthcare",
      "Mental Health",
      "Substance Use",
    ]);
    expect(result).not.toContain("Case Management");
    expect(result).not.toContain("Clothing and toiletries");
    expect(result).not.toContain("Family Support");
    expect(result).not.toContain("Financial Support");
    expect(result).not.toContain("Food Insecurity");
    expect(result).not.toContain("General Re-entry Support");
    expect(result).not.toContain("Housing");
    expect(result).not.toContain("Job Training or Opportunities");
    expect(result).not.toContain("Transportation");
    expect(result).not.toContain("Other");
  });

  test("format needs list based on Term recommendation type", () => {
    const result = formatNeedsList(allNeeds, riderOrTermExclusionList);
    expect(result).toEqual([
      "Anger Management",
      "Domestic Violence Training",
      "Education",
      "Healthcare",
      "Mental Health",
      "Substance Use",
    ]);
    expect(result).not.toContain("Case Management");
    expect(result).not.toContain("Clothing and toiletries");
    expect(result).not.toContain("Family Support");
    expect(result).not.toContain("Financial Support");
    expect(result).not.toContain("Food Insecurity");
    expect(result).not.toContain("General Re-entry Support");
    expect(result).not.toContain("Housing");
    expect(result).not.toContain("Job Training or Opportunities");
    expect(result).not.toContain("Transportation");
    expect(result).not.toContain("Other");
  });

  test("format needs list based using the default adjustments for Probation recommendation type", () => {
    const result = formatNeedsList(allNeeds, probationOrNoneExclusionList);
    expect(result).toEqual([
      "Anger Management",
      "Case Management",
      "Domestic Violence Training",
      "Education",
      "Family Support",
      "Food Insecurity",
      "Financial Support",
      "Healthcare",
      "Housing",
      "Vocational Training",
      "Mental Health",
      "Substance Use",
      "Transportation",
    ]);

    expect(result).not.toContain("Clothing and toiletries");
    expect(result).not.toContain("General Re-entry Support");
    expect(result).not.toContain("Job Training or Opportunities");
    expect(result).not.toContain("Other");
  });

  test("format needs list based using the default adjustments for None recommendation type", () => {
    const result = formatNeedsList(allNeeds, probationOrNoneExclusionList);
    expect(result).toEqual([
      "Anger Management",
      "Case Management",
      "Domestic Violence Training",
      "Education",
      "Family Support",
      "Food Insecurity",
      "Financial Support",
      "Healthcare",
      "Housing",
      "Vocational Training",
      "Mental Health",
      "Substance Use",
      "Transportation",
    ]);

    expect(result).not.toContain("Clothing and toiletries");
    expect(result).not.toContain("General Re-entry Support");
    expect(result).not.toContain("Job Training or Opportunities");
    expect(result).not.toContain("Other");
  });
});

/**
 * Idaho Summary
 * Based on the following template ([link to template](https://docs.google.com/document/d/1-cSzLhJoH_pnSn599ikDTj9blx7UYHWauYLUItSsPy0))
 */
describe("generateRecommendationSummary for US_ID", () => {
  // No recommendation
  test("generates summary for None recommendation type", () => {
    const recommendationType = RecommendationType.None;
    const summary = generateTestFormattedRecommendationSummary({
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [],
      opportunityDescriptions: [],
      gender: "FEMALE",
    });

    expect(summary).toBe(
      "Due to the circumstances of this case, I respectfully decline to make a sentencing recommendation at this time.",
    );
  });

  // Term recommendation
  test("generates summary for Term recommendation type with protective factors and NO needs", () => {
    const recommendationType = RecommendationType.Term;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [],
      protectiveFactors: allProtectiveFactors,
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);

    const femaleOrTransFemaleCopy = `Given the circumstances of this case, it is recommended that Ms. Williams be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction. While incarceration is recommended due to the nature of the offense, Ms. Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to her successful reintegration into the community upon her release. During her incarceration, it is further recommended that a comprehensive plan be developed to address her needs. It is hoped that, with this structure and support, Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `Given the circumstances of this case, it is recommended that Mr. Williams be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction. While incarceration is recommended due to the nature of the offense, Mr. Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to his successful reintegration into the community upon his release. During his incarceration, it is further recommended that a comprehensive plan be developed to address his needs. It is hoped that, with this structure and support, Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `Given the circumstances of this case, it is recommended that Jane Doe Williams be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction. While incarceration is recommended due to the nature of the offense, Jane Doe Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to their successful reintegration into the community upon their release. During their incarceration, it is further recommended that a comprehensive plan be developed to address their needs. It is hoped that, with this structure and support, Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  test("generates summary for Term recommendation type with protective factors and needs", () => {
    const recommendationType = RecommendationType.Term;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: allNeeds,
      protectiveFactors: allProtectiveFactors,
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);

    const femaleOrTransFemaleCopy = `Given the circumstances of this case, it is recommended that Ms. Williams be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction. While incarceration is recommended due to the nature of the offense, Ms. Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to her successful reintegration into the community upon her release. During her incarceration, it is further recommended that a comprehensive plan be developed to address her anger management, domestic violence training, education, healthcare, mental health and substance use needs. It is hoped that, with this structure and support, Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `Given the circumstances of this case, it is recommended that Mr. Williams be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction. While incarceration is recommended due to the nature of the offense, Mr. Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to his successful reintegration into the community upon his release. During his incarceration, it is further recommended that a comprehensive plan be developed to address his anger management, domestic violence training, education, healthcare, mental health and substance use needs. It is hoped that, with this structure and support, Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `Given the circumstances of this case, it is recommended that Jane Doe Williams be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction. While incarceration is recommended due to the nature of the offense, Jane Doe Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to their successful reintegration into the community upon their release. During their incarceration, it is further recommended that a comprehensive plan be developed to address their anger management, domestic violence training, education, healthcare, mental health and substance use needs. It is hoped that, with this structure and support, Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  test("generates summary for Term recommendation type with needs and no protective factors", () => {
    const recommendationType = RecommendationType.Term;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: allNeeds,
      protectiveFactors: [],
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);

    const femaleOrTransFemaleCopy = `Given the circumstances of this case, it is recommended that Ms. Williams be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction. During her incarceration, it is further recommended that a comprehensive plan be developed to address her anger management, domestic violence training, education, healthcare, mental health and substance use needs. It is hoped that, with this structure and support, Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `Given the circumstances of this case, it is recommended that Mr. Williams be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction. During his incarceration, it is further recommended that a comprehensive plan be developed to address his anger management, domestic violence training, education, healthcare, mental health and substance use needs. It is hoped that, with this structure and support, Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `Given the circumstances of this case, it is recommended that Jane Doe Williams be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction. During their incarceration, it is further recommended that a comprehensive plan be developed to address their anger management, domestic violence training, education, healthcare, mental health and substance use needs. It is hoped that, with this structure and support, Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  test("generates summary for Term recommendation type with no protective factors and no needs", () => {
    const recommendationType = RecommendationType.Term;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [],
      protectiveFactors: [],
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);

    const femaleOrTransFemaleCopy = `Given the circumstances of this case, it is recommended that Ms. Williams be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction. During her incarceration, it is further recommended that a comprehensive plan be developed to address her needs. It is hoped that, with this structure and support, Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `Given the circumstances of this case, it is recommended that Mr. Williams be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction. During his incarceration, it is further recommended that a comprehensive plan be developed to address his needs. It is hoped that, with this structure and support, Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `Given the circumstances of this case, it is recommended that Jane Doe Williams be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction. During their incarceration, it is further recommended that a comprehensive plan be developed to address their needs. It is hoped that, with this structure and support, Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  test("generates summary for Term recommendation type with single protective factor and no needs", () => {
    const recommendationType = RecommendationType.Term;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [],
      protectiveFactors: [allProtectiveFactors[0]],
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);

    const femaleOrTransFemaleCopy = `Given the circumstances of this case, it is recommended that Ms. Williams be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction. While incarceration is recommended due to the nature of the offense, Ms. Williams has no prior criminal convictions, suggesting a solid foundation that may contribute to her successful reintegration into the community upon her release. During her incarceration, it is further recommended that a comprehensive plan be developed to address her needs. It is hoped that, with this structure and support, Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `Given the circumstances of this case, it is recommended that Mr. Williams be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction. While incarceration is recommended due to the nature of the offense, Mr. Williams has no prior criminal convictions, suggesting a solid foundation that may contribute to his successful reintegration into the community upon his release. During his incarceration, it is further recommended that a comprehensive plan be developed to address his needs. It is hoped that, with this structure and support, Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `Given the circumstances of this case, it is recommended that Jane Doe Williams be sentenced to a period of incarceration under the custody of the Idaho State Board of Correction. While incarceration is recommended due to the nature of the offense, Jane Doe Williams has no prior criminal convictions, suggesting a solid foundation that may contribute to their successful reintegration into the community upon their release. During their incarceration, it is further recommended that a comprehensive plan be developed to address their needs. It is hoped that, with this structure and support, Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Rider recommendation
  test("generates summary for Rider recommendation type with protective factors and no needs", () => {
    const recommendationType = RecommendationType.Rider;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [],
      protectiveFactors: allProtectiveFactors,
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);

    const femaleOrTransFemaleCopy = `Given the circumstances of this case, it is recommended that Ms. Williams be sentenced to a period of retained jurisdiction. While incarceration is recommended due to the nature of the offense, Ms. Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to her successful reintegration into the community upon her release. During this time, it is further recommended that a comprehensive plan be developed to address her needs. It is hoped that, with this structure and support, Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `Given the circumstances of this case, it is recommended that Mr. Williams be sentenced to a period of retained jurisdiction. While incarceration is recommended due to the nature of the offense, Mr. Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to his successful reintegration into the community upon his release. During this time, it is further recommended that a comprehensive plan be developed to address his needs. It is hoped that, with this structure and support, Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `Given the circumstances of this case, it is recommended that Jane Doe Williams be sentenced to a period of retained jurisdiction. While incarceration is recommended due to the nature of the offense, Jane Doe Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to their successful reintegration into the community upon their release. During this time, it is further recommended that a comprehensive plan be developed to address their needs. It is hoped that, with this structure and support, Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  test("generates summary for Rider recommendation type with protective factors and needs", () => {
    const recommendationType = RecommendationType.Rider;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: allNeeds,
      protectiveFactors: allProtectiveFactors,
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);

    const femaleOrTransFemaleCopy = `Given the circumstances of this case, it is recommended that Ms. Williams be sentenced to a period of retained jurisdiction. While incarceration is recommended due to the nature of the offense, Ms. Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to her successful reintegration into the community upon her release. During this time, it is further recommended that a comprehensive plan be developed to address her anger management, domestic violence training, education, healthcare, mental health and substance use needs. It is hoped that, with this structure and support, Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `Given the circumstances of this case, it is recommended that Mr. Williams be sentenced to a period of retained jurisdiction. While incarceration is recommended due to the nature of the offense, Mr. Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to his successful reintegration into the community upon his release. During this time, it is further recommended that a comprehensive plan be developed to address his anger management, domestic violence training, education, healthcare, mental health and substance use needs. It is hoped that, with this structure and support, Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `Given the circumstances of this case, it is recommended that Jane Doe Williams be sentenced to a period of retained jurisdiction. While incarceration is recommended due to the nature of the offense, Jane Doe Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to their successful reintegration into the community upon their release. During this time, it is further recommended that a comprehensive plan be developed to address their anger management, domestic violence training, education, healthcare, mental health and substance use needs. It is hoped that, with this structure and support, Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  test("generates summary for Rider recommendation type with no protective factors and no needs", () => {
    const recommendationType = RecommendationType.Rider;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [],
      protectiveFactors: [],
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);

    const femaleOrTransFemaleCopy = `Given the circumstances of this case, it is recommended that Ms. Williams be sentenced to a period of retained jurisdiction. During this time, it is further recommended that a comprehensive plan be developed to address her needs. It is hoped that, with this structure and support, Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `Given the circumstances of this case, it is recommended that Mr. Williams be sentenced to a period of retained jurisdiction. During this time, it is further recommended that a comprehensive plan be developed to address his needs. It is hoped that, with this structure and support, Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `Given the circumstances of this case, it is recommended that Jane Doe Williams be sentenced to a period of retained jurisdiction. During this time, it is further recommended that a comprehensive plan be developed to address their needs. It is hoped that, with this structure and support, Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ needs and opportunities and single protective factors
  test("generates summary for Probation recommendation type (with needs and opportunities and single protective factor) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [
        "CaseManagement",
        "ClothingAndToiletries",
        "DomesticViolenceIssues",
        "Education",
      ],
      protectiveFactors: [allProtectiveFactors[0]],
      opportunityDescriptions: sampleOpportunityDescriptions,
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);
    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Williams be sentenced to a period of felony probation. Ms. Williams has no prior criminal convictions—suggesting a solid foundation for success in the community. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address her case management, domestic violence training and education needs while on supervision. A variety of local resources are available to meet these needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Williams be sentenced to a period of felony probation. Mr. Williams has no prior criminal convictions—suggesting a solid foundation for success in the community. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address his case management, domestic violence training and education needs while on supervision. A variety of local resources are available to meet these needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jane Doe Williams be sentenced to a period of felony probation. Jane Doe Williams has no prior criminal convictions—suggesting a solid foundation for success in the community. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address their case management, domestic violence training and education needs while on supervision. A variety of local resources are available to meet these needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ needs and opportunities and no protective factors
  test("generates summary for Probation recommendation type (with needs and opportunities and NO protective factors) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [
        "CaseManagement",
        "ClothingAndToiletries",
        "DomesticViolenceIssues",
        "Education",
      ],
      protectiveFactors: [],
      opportunityDescriptions: sampleOpportunityDescriptions,
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);
    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Williams be sentenced to a period of felony probation. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address her case management, domestic violence training and education needs while on supervision. A variety of local resources are available to meet these needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Williams be sentenced to a period of felony probation. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address his case management, domestic violence training and education needs while on supervision. A variety of local resources are available to meet these needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jane Doe Williams be sentenced to a period of felony probation. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address their case management, domestic violence training and education needs while on supervision. A variety of local resources are available to meet these needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ needs and opportunities and protective factors
  test("generates summary for Probation recommendation type (with needs and opportunities and protective factors) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [
        "CaseManagement",
        "ClothingAndToiletries",
        "DomesticViolenceIssues",
        "Education",
      ],
      protectiveFactors: allProtectiveFactors,
      opportunityDescriptions: sampleOpportunityDescriptions,
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);
    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Williams be sentenced to a period of felony probation. Ms. Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities—factors which suggest a solid foundation for success in the community. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address her case management, domestic violence training and education needs while on supervision. A variety of local resources are available to meet these needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Williams be sentenced to a period of felony probation. Mr. Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities—factors which suggest a solid foundation for success in the community. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address his case management, domestic violence training and education needs while on supervision. A variety of local resources are available to meet these needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jane Doe Williams be sentenced to a period of felony probation. Jane Doe Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities—factors which suggest a solid foundation for success in the community. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address their case management, domestic violence training and education needs while on supervision. A variety of local resources are available to meet these needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ opportunities and NO needs and NO protective Factors
  test("generates summary for Probation recommendation type (with opportunities and NO needs and NO protective factors) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jo Robertson",
      lastName: "Robertson",
      needs: [],
      protectiveFactors: [],
      opportunityDescriptions: sampleOpportunityDescriptions,
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);
    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Robertson be sentenced to a period of felony probation. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address her needs while on supervision. A variety of local resources are available to meet these needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Ms. Robertson will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Robertson be sentenced to a period of felony probation. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address his needs while on supervision. A variety of local resources are available to meet these needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Mr. Robertson will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jo Robertson be sentenced to a period of felony probation. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address their needs while on supervision. A variety of local resources are available to meet these needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Jo Robertson will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ opportunities and protective factors and NO needs
  test("generates summary for Probation recommendation type (with opportunities and protective factors and NO needs) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jo Robertson",
      lastName: "Robertson",
      needs: [],
      protectiveFactors: allProtectiveFactors,
      opportunityDescriptions: sampleOpportunityDescriptions,
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);
    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Robertson be sentenced to a period of felony probation. Ms. Robertson has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities—factors which suggest a solid foundation for success in the community. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address her needs while on supervision. A variety of local resources are available to meet these needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Ms. Robertson will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Robertson be sentenced to a period of felony probation. Mr. Robertson has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities—factors which suggest a solid foundation for success in the community. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address his needs while on supervision. A variety of local resources are available to meet these needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Mr. Robertson will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jo Robertson be sentenced to a period of felony probation. Jo Robertson has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities—factors which suggest a solid foundation for success in the community. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address their needs while on supervision. A variety of local resources are available to meet these needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Jo Robertson will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ needs and protective factors and NO opportunities
  test("generates summary for Probation recommendation type (with needs and protective factors and NO opportunities) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jo Robertson",
      lastName: "Robertson",
      needs: allNeeds,
      protectiveFactors: allProtectiveFactors,
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);
    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Robertson be sentenced to a period of felony probation. Ms. Robertson has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities—factors which suggest a solid foundation for success in the community. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address her anger management, case management, domestic violence training, education, family support, food insecurity, financial support, healthcare, housing, vocational training, mental health, substance use and transportation needs while on supervision. Given this support and structure, it is hoped that Ms. Robertson will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Robertson be sentenced to a period of felony probation. Mr. Robertson has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities—factors which suggest a solid foundation for success in the community. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address his anger management, case management, domestic violence training, education, family support, food insecurity, financial support, healthcare, housing, vocational training, mental health, substance use and transportation needs while on supervision. Given this support and structure, it is hoped that Mr. Robertson will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jo Robertson be sentenced to a period of felony probation. Jo Robertson has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities—factors which suggest a solid foundation for success in the community. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address their anger management, case management, domestic violence training, education, family support, food insecurity, financial support, healthcare, housing, vocational training, mental health, substance use and transportation needs while on supervision. Given this support and structure, it is hoped that Jo Robertson will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ needs and NO protective factors and NO opportunities
  test("generates summary for Probation recommendation type (with needs and NO protective factors and NO opportunities) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jo Robertson",
      lastName: "Robertson",
      needs: allNeeds,
      protectiveFactors: [],
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);
    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Robertson be sentenced to a period of felony probation. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address her anger management, case management, domestic violence training, education, family support, food insecurity, financial support, healthcare, housing, vocational training, mental health, substance use and transportation needs while on supervision. Given this support and structure, it is hoped that Ms. Robertson will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Robertson be sentenced to a period of felony probation. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address his anger management, case management, domestic violence training, education, family support, food insecurity, financial support, healthcare, housing, vocational training, mental health, substance use and transportation needs while on supervision. Given this support and structure, it is hoped that Mr. Robertson will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jo Robertson be sentenced to a period of felony probation. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address their anger management, case management, domestic violence training, education, family support, food insecurity, financial support, healthcare, housing, vocational training, mental health, substance use and transportation needs while on supervision. Given this support and structure, it is hoped that Jo Robertson will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ NO needs and NO opportunities and NO protective factors
  test("generates summary for Probation recommendation type (with NO needs and NO opportunities and NO protective factors) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jo Robertson",
      lastName: "Robertson",
      needs: [],
      protectiveFactors: [],
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);
    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Robertson be sentenced to a period of felony probation. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address her needs while on supervision. Given this support and structure, it is hoped that Ms. Robertson will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Robertson be sentenced to a period of felony probation. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address his needs while on supervision. Given this support and structure, it is hoped that Mr. Robertson will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jo Robertson be sentenced to a period of felony probation. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address their needs while on supervision. Given this support and structure, it is hoped that Jo Robertson will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ protective factors and NO needs and NO opportunities
  test.skip("generates summary for Probation recommendation type (with protective factors and NO needs and NO opportunities) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jo Robertson",
      lastName: "Robertson",
      needs: [],
      opportunityDescriptions: [],
      protectiveFactors: allProtectiveFactors,
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);
    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Robertson be sentenced to a period of felony probation. Ms. Robertson has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities—factors which suggest a solid foundation for success in the community. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address her needs while on supervision. Given this support and structure, it is hoped that Ms. Robertson will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Robertson be sentenced to a period of felony probation. Mr. Robertson has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities—factors which suggest a solid foundation for success in the community. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address his needs while on supervision. Given this support and structure, it is hoped that Mr. Robertson will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jo Robertson be sentenced to a period of felony probation. Jo Robertson has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities—factors which suggest a solid foundation for success in the community. To provide a clear path forward, it is further recommended that a comprehensive plan be put in place to address their needs while on supervision. Given this support and structure, it is hoped that Jo Robertson will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });
});

/**
 * North Dakota Summary
 * Based on the following template ([link to template](https://docs.google.com/document/d/191u3uo84WNzJIvv-ZFPYhu6jRU1UpjRXNjkZUCrmNHE/))
 */

describe("generateRecommendationSummary for US_ND", () => {
  // No recommendation
  test("generates summary for None recommendation type", () => {
    const recommendationType = RecommendationType.None;
    const summary = generateTestFormattedRecommendationSummary({
      recommendation: recommendationType,
      stateCode: "US_ND",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [],
      opportunityDescriptions: [],
      gender: "FEMALE",
    });

    expect(summary).toBe(
      "Due to the circumstances of this case, I respectfully decline to make a sentencing recommendation at this time.",
    );
  });

  // Other recommendation (no protective factors, no needs, no opportunities)
  test("generates summary for Other recommendation type (no protective factors, no needs, no opportunities)", () => {
    const recommendationType = OTHER_OPTION;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ND",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [],
      opportunityDescriptions: [],
      protectiveFactors: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);

    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Williams be sentenced to a period of incarceration with the North Dakota Department of Corrections and Rehabilitation. During this time, it is further recommended that a comprehensive plan be developed to address her needs, both while incarcerated and in preparation for reentry. Given this support and structure, it is hoped that Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Williams be sentenced to a period of incarceration with the North Dakota Department of Corrections and Rehabilitation. During this time, it is further recommended that a comprehensive plan be developed to address his needs, both while incarcerated and in preparation for reentry. Given this support and structure, it is hoped that Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jane Doe Williams be sentenced to a period of incarceration with the North Dakota Department of Corrections and Rehabilitation. During this time, it is further recommended that a comprehensive plan be developed to address their needs, both while incarcerated and in preparation for reentry. Given this support and structure, it is hoped that Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Other recommendation (w/ protective factors, needs, opportunities)
  test("generates summary for Other recommendation type (w/ protective factors, needs, opportunities)", () => {
    const recommendationType = OTHER_OPTION;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ND",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: allNeeds,
      opportunityDescriptions: sampleOpportunityDescriptions,
      protectiveFactors: allProtectiveFactors,
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);

    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Williams be sentenced to a period of incarceration with the North Dakota Department of Corrections and Rehabilitation. While incarceration is recommended due to the nature of the offense, Ms. Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to her successful reintegration into the community upon her release. During this time, it is further recommended that a comprehensive plan be developed to address her anger management, domestic violence training, education, family support, financial support, healthcare, general re-entry support, housing, vocational training, mental health and substance use needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support her eventual transition, such as a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Williams be sentenced to a period of incarceration with the North Dakota Department of Corrections and Rehabilitation. While incarceration is recommended due to the nature of the offense, Mr. Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to his successful reintegration into the community upon his release. During this time, it is further recommended that a comprehensive plan be developed to address his anger management, domestic violence training, education, family support, financial support, healthcare, general re-entry support, housing, vocational training, mental health and substance use needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support his eventual transition, such as a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jane Doe Williams be sentenced to a period of incarceration with the North Dakota Department of Corrections and Rehabilitation. While incarceration is recommended due to the nature of the offense, Jane Doe Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to their successful reintegration into the community upon their release. During this time, it is further recommended that a comprehensive plan be developed to address their anger management, domestic violence training, education, family support, financial support, healthcare, general re-entry support, housing, vocational training, mental health and substance use needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support their eventual transition, such as a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Other recommendation (w/ single protective factor, needs, opportunities)
  test("generates summary for Other recommendation type (w/ single protective factors, needs, opportunities)", () => {
    const recommendationType = OTHER_OPTION;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ND",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: allNeeds,
      opportunityDescriptions: sampleOpportunityDescriptions,
      protectiveFactors: [allProtectiveFactors[0]],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);

    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Williams be sentenced to a period of incarceration with the North Dakota Department of Corrections and Rehabilitation. While incarceration is recommended due to the nature of the offense, Ms. Williams has no prior criminal convictions, suggesting a solid foundation that may contribute to her successful reintegration into the community upon her release. During this time, it is further recommended that a comprehensive plan be developed to address her anger management, domestic violence training, education, family support, financial support, healthcare, general re-entry support, housing, vocational training, mental health and substance use needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support her eventual transition, such as a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Williams be sentenced to a period of incarceration with the North Dakota Department of Corrections and Rehabilitation. While incarceration is recommended due to the nature of the offense, Mr. Williams has no prior criminal convictions, suggesting a solid foundation that may contribute to his successful reintegration into the community upon his release. During this time, it is further recommended that a comprehensive plan be developed to address his anger management, domestic violence training, education, family support, financial support, healthcare, general re-entry support, housing, vocational training, mental health and substance use needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support his eventual transition, such as a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jane Doe Williams be sentenced to a period of incarceration with the North Dakota Department of Corrections and Rehabilitation. While incarceration is recommended due to the nature of the offense, Jane Doe Williams has no prior criminal convictions, suggesting a solid foundation that may contribute to their successful reintegration into the community upon their release. During this time, it is further recommended that a comprehensive plan be developed to address their anger management, domestic violence training, education, family support, financial support, healthcare, general re-entry support, housing, vocational training, mental health and substance use needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support their eventual transition, such as a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // 21+ year recommendation
  test("generates summary for 21+ years recommendation type with expected name and salutations", () => {
    const recommendationType = "21+ years";
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      sentenceLengthStart: 21,
      sentenceLengthEnd: -1,
      stateCode: "US_ND",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [],
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);

    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Williams be given a sentence of at least 21 years with the North Dakota Department of Corrections and Rehabilitation. Hopefully the defendant will take advantage of the resources available to her while incarcerated and make the changes necessary to set her life on a better path.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Williams be given a sentence of at least 21 years with the North Dakota Department of Corrections and Rehabilitation. Hopefully the defendant will take advantage of the resources available to him while incarcerated and make the changes necessary to set his life on a better path.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jane Doe Williams be given a sentence of at least 21 years with the North Dakota Department of Corrections and Rehabilitation. Hopefully the defendant will take advantage of the resources available to them while incarcerated and make the changes necessary to set their life on a better path.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Less than one year recommendation w/ needs and opportunities, no protective factors
  test("generates summary for less than one year recommendation type with needs and opportunities, and no protective factors with expected name and salutations", () => {
    const recommendationType = "Less than one year";
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      sentenceLengthStart: 0,
      sentenceLengthEnd: 1,
      stateCode: "US_ND",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [
        "CaseManagement",
        "ClothingAndToiletries",
        "DomesticViolenceIssues",
        "FamilyServices",
        "FinancialAssistance",
        "FoodInsecurity",
        "GeneralReEntrySupport",
        "HousingOpportunities",
        "JobTrainingOrOpportunities",
        "Transportation",
      ],
      opportunityDescriptions: sampleOpportunityDescriptions,
      protectiveFactors: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);

    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Williams be given a sentence of less than one year with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. During this time, it is further recommended that a comprehensive plan be developed to address her domestic violence training, family support, financial support, general re-entry support, housing and vocational training needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support her eventual transition, such as a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Williams be given a sentence of less than one year with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. During this time, it is further recommended that a comprehensive plan be developed to address his domestic violence training, family support, financial support, general re-entry support, housing and vocational training needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support his eventual transition, such as a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jane Doe Williams be given a sentence of less than one year with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. During this time, it is further recommended that a comprehensive plan be developed to address their domestic violence training, family support, financial support, general re-entry support, housing and vocational training needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support their eventual transition, such as a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Less than one year recommendation (default) w/ needs and opportunities and protective factors
  test("generates summary for less than one year recommendation type w/ needs and opportunities and protective factors with expected name and salutations", () => {
    const recommendationType = "Less than one year";
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      sentenceLengthStart: 0,
      sentenceLengthEnd: 1,
      stateCode: "US_ND",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [
        "CaseManagement",
        "ClothingAndToiletries",
        "DomesticViolenceIssues",
        "FamilyServices",
        "FinancialAssistance",
        "FoodInsecurity",
        "GeneralReEntrySupport",
        "HousingOpportunities",
        "JobTrainingOrOpportunities",
        "Transportation",
      ],
      opportunityDescriptions: sampleOpportunityDescriptions,
      protectiveFactors: allProtectiveFactors,
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);

    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Williams be given a sentence of less than one year with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. While incarceration is recommended due to the nature of the offense, Ms. Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to her successful reintegration into the community upon her release. During this time, it is further recommended that a comprehensive plan be developed to address her domestic violence training, family support, financial support, general re-entry support, housing and vocational training needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support her eventual transition, such as a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Ms. Williams will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Williams be given a sentence of less than one year with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. While incarceration is recommended due to the nature of the offense, Mr. Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to his successful reintegration into the community upon his release. During this time, it is further recommended that a comprehensive plan be developed to address his domestic violence training, family support, financial support, general re-entry support, housing and vocational training needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support his eventual transition, such as a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Mr. Williams will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jane Doe Williams be given a sentence of less than one year with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. While incarceration is recommended due to the nature of the offense, Jane Doe Williams has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to their successful reintegration into the community upon their release. During this time, it is further recommended that a comprehensive plan be developed to address their domestic violence training, family support, financial support, general re-entry support, housing and vocational training needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support their eventual transition, such as a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Jane Doe Williams will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // 11-20 years recommendation w/ protective factors, opportunities and NO needs
  test("generates summary for 11-20 years recommendation type (with protective factors, opportunities and NO needs) with expected name, pronouns and salutations", () => {
    const recommendationType = "11-20 years";
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      sentenceLengthStart: 11,
      sentenceLengthEnd: 20,
      stateCode: "US_ND",
      fullName: "Jo Robertson",
      lastName: "Robertson",
      needs: [],
      opportunityDescriptions: sampleOpportunityDescriptions,
      protectiveFactors: [allProtectiveFactors[0], allProtectiveFactors[1]],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);
    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Robertson be given a sentence between 11 and 20 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. While incarceration is recommended due to the nature of the offense, Ms. Robertson has no prior criminal convictions and no history of violent behavior. These factors suggest a solid foundation that may contribute to her successful reintegration into the community upon her release. During this time, it is further recommended that a comprehensive plan be developed to address her needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support her eventual transition, such as a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Ms. Robertson will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Robertson be given a sentence between 11 and 20 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. While incarceration is recommended due to the nature of the offense, Mr. Robertson has no prior criminal convictions and no history of violent behavior. These factors suggest a solid foundation that may contribute to his successful reintegration into the community upon his release. During this time, it is further recommended that a comprehensive plan be developed to address his needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support his eventual transition, such as a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Mr. Robertson will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jo Robertson be given a sentence between 11 and 20 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. While incarceration is recommended due to the nature of the offense, Jo Robertson has no prior criminal convictions and no history of violent behavior. These factors suggest a solid foundation that may contribute to their successful reintegration into the community upon their release. During this time, it is further recommended that a comprehensive plan be developed to address their needs, both while incarcerated and in preparation for reentry. A variety of local resources are available to support their eventual transition, such as a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Given this support and structure, it is hoped that Jo Robertson will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  //  3-5 years recommendation w/ needs, protective factors and NO opportunities
  test("generates summary for 3-5 years recommendation type (with needs, protective factors and NO opportunities) with expected name, pronouns and salutations", () => {
    const recommendationType = "3-5 years";
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      sentenceLengthStart: 11,
      sentenceLengthEnd: 20,
      stateCode: "US_ND",
      fullName: "Jo Robertson",
      lastName: "Robertson",
      needs: allNeeds,
      protectiveFactors: allProtectiveFactors,
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);
    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Robertson be given a sentence between 3 and 5 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. While incarceration is recommended due to the nature of the offense, Ms. Robertson has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to her successful reintegration into the community upon her release. During this time, it is further recommended that a comprehensive plan be developed to address her anger management, domestic violence training, education, family support, financial support, healthcare, general re-entry support, housing, vocational training, mental health and substance use needs, both while incarcerated and in preparation for reentry. Given this support and structure, it is hoped that Ms. Robertson will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Robertson be given a sentence between 3 and 5 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. While incarceration is recommended due to the nature of the offense, Mr. Robertson has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to his successful reintegration into the community upon his release. During this time, it is further recommended that a comprehensive plan be developed to address his anger management, domestic violence training, education, family support, financial support, healthcare, general re-entry support, housing, vocational training, mental health and substance use needs, both while incarcerated and in preparation for reentry. Given this support and structure, it is hoped that Mr. Robertson will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jo Robertson be given a sentence between 3 and 5 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. While incarceration is recommended due to the nature of the offense, Jo Robertson has no prior criminal convictions, no history of violent behavior, no substance abuse issues, had previous success under supervision, had lengthy periods of sobriety after completing treatment, no diagnosis of a mental illness, stable housing, steady employment, financial stability, a high level of academic achievement, a strong social support network, close family ties, been actively participating in treatment programs, enrolled in educational or vocational training and been actively involved in community activities. These factors suggest a solid foundation that may contribute to their successful reintegration into the community upon their release. During this time, it is further recommended that a comprehensive plan be developed to address their anger management, domestic violence training, education, family support, financial support, healthcare, general re-entry support, housing, vocational training, mental health and substance use needs, both while incarcerated and in preparation for reentry. Given this support and structure, it is hoped that Jo Robertson will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // 6-10 years recommendation w/ NO needs and NO opportunities and NO protective factors
  test("generates summary for 6-10 years recommendation type (with NO needs and NO opportunities and NO protective factors) with expected name, pronouns and salutations", () => {
    const recommendationType = "6-10 years";
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      sentenceLengthStart: 11,
      sentenceLengthEnd: 20,
      stateCode: "US_ND",
      fullName: "Jo Robertson",
      lastName: "Robertson",
      needs: [],
      opportunityDescriptions: [],
      protectiveFactors: [],
      gender: "FEMALE",
    };
    let summary = generateTestFormattedRecommendationSummary(props);
    const femaleOrTransFemaleCopy = `After careful consideration of the details of this case, it is recommended that Ms. Robertson be given a sentence between 6 and 10 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. During this time, it is further recommended that a comprehensive plan be developed to address her needs, both while incarcerated and in preparation for reentry. Given this support and structure, it is hoped that Ms. Robertson will make the changes necessary to build a more stable and productive future.`;
    const maleOrTransMaleCopy = `After careful consideration of the details of this case, it is recommended that Mr. Robertson be given a sentence between 6 and 10 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. During this time, it is further recommended that a comprehensive plan be developed to address his needs, both while incarcerated and in preparation for reentry. Given this support and structure, it is hoped that Mr. Robertson will make the changes necessary to build a more stable and productive future.`;
    const neutralGenderCopy = `After careful consideration of the details of this case, it is recommended that Jo Robertson be given a sentence between 6 and 10 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. During this time, it is further recommended that a comprehensive plan be developed to address their needs, both while incarcerated and in preparation for reentry. Given this support and structure, it is hoped that Jo Robertson will make the changes necessary to build a more stable and productive future.`;

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateTestFormattedRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });
});
