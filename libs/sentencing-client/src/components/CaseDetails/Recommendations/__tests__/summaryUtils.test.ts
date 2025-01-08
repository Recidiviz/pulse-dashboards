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
 * Based on the following template ([link to template](https://docs.google.com/document/d/1-cSzLhJoH_pnSn599ikDTj9blx7UYHWauYLUItSsPy0/))
 */
describe("generateRecommendationSummary for US_ID", () => {
  // No recommendation
  test("generates summary for None recommendation type", () => {
    const recommendationType = RecommendationType.None;
    const summary = generateRecommendationSummary({
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
  test("generates summary for Term recommendation type with expected name and salutations", () => {
    const recommendationType = RecommendationType.Term;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [],
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateRecommendationSummary(props);

    const femaleOrTransFemaleCopy =
      "Due to the circumstances of their case, I respectfully recommend Ms. Williams be sentenced to a period of incarceration under the physical custody of the Idaho Department of Correction where they can address their needs issues.";
    const maleOrTransMaleCopy =
      "Due to the circumstances of their case, I respectfully recommend Mr. Williams be sentenced to a period of incarceration under the physical custody of the Idaho Department of Correction where they can address their needs issues.";
    const neutralGenderCopy =
      "Due to the circumstances of their case, I respectfully recommend Jane Doe Williams be sentenced to a period of incarceration under the physical custody of the Idaho Department of Correction where they can address their needs issues.";

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Rider recommendation
  test("generates summary for Rider recommendation type with expected name and salutations", () => {
    const recommendationType = RecommendationType.Rider;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [],
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateRecommendationSummary(props);

    const femaleOrTransFemaleCopy =
      "I recommend that Ms. Williams be sentenced to a period of retained jurisdiction where they can address their needs issues.";
    const maleOrTransMaleCopy =
      "I recommend that Mr. Williams be sentenced to a period of retained jurisdiction where they can address their needs issues.";
    const neutralGenderCopy =
      "I recommend that Jane Doe Williams be sentenced to a period of retained jurisdiction where they can address their needs issues.";

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ needs and opportunities
  test("generates summary for Probation recommendation type (with needs and opportunities) with expected name, pronouns and salutations", () => {
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
      opportunityDescriptions: pluralizeDuplicates([
        "mental health provider",
        "inpatient substance use treatment facility",
        "inpatient substance use treatment facility",
        "mental health court",
        "veterans court",
        "mental health court",
      ]),
      gender: "FEMALE",
    };
    let summary = generateRecommendationSummary(props);
    const femaleOrTransFemaleCopy =
      "After careful consideration of the details of this case, I respectfully recommend that Ms. Williams be sentenced to a period of felony probation. There are a variety of opportunities in the community that may help to meet her case management, domestic violence training and education needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Should probation be granted, a list of potential resources will be made available to Ms. Williams' supervising officer. Hopefully the defendant will take advantage of the resources available to her while on supervision and make the changes necessary to set her life on a better path.";
    const maleOrTransMaleCopy =
      "After careful consideration of the details of this case, I respectfully recommend that Mr. Williams be sentenced to a period of felony probation. There are a variety of opportunities in the community that may help to meet his case management, domestic violence training and education needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Should probation be granted, a list of potential resources will be made available to Mr. Williams' supervising officer. Hopefully the defendant will take advantage of the resources available to him while on supervision and make the changes necessary to set his life on a better path.";
    const neutralGenderCopy =
      "After careful consideration of the details of this case, I respectfully recommend that Jane Doe Williams be sentenced to a period of felony probation. There are a variety of opportunities in the community that may help to meet their case management, domestic violence training and education needs, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Should probation be granted, a list of potential resources will be made available to Jane Doe Williams' supervising officer. Hopefully the defendant will take advantage of the resources available to them while on supervision and make the changes necessary to set their life on a better path.";

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ opportunities and NO needs
  test("generates summary for Probation recommendation type (with opportunities and NO needs) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jo Robertson",
      lastName: "Robertson",
      needs: [],
      opportunityDescriptions: pluralizeDuplicates([
        "mental health provider",
        "inpatient substance use treatment facility",
        "inpatient substance use treatment facility",
        "mental health court",
        "veterans court",
        "mental health court",
      ]),
      gender: "FEMALE",
    };
    let summary = generateRecommendationSummary(props);
    const femaleOrTransFemaleCopy =
      "After careful consideration of the details of this case, I respectfully recommend that Ms. Robertson be sentenced to a period of felony probation. There are a variety of opportunities in the community to support her, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Should probation be granted, a list of potential resources will be made available to Ms. Robertson's supervising officer. Hopefully the defendant will take advantage of the resources available to her while on supervision and make the changes necessary to set her life on a better path.";
    const maleOrTransMaleCopy =
      "After careful consideration of the details of this case, I respectfully recommend that Mr. Robertson be sentenced to a period of felony probation. There are a variety of opportunities in the community to support him, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Should probation be granted, a list of potential resources will be made available to Mr. Robertson's supervising officer. Hopefully the defendant will take advantage of the resources available to him while on supervision and make the changes necessary to set his life on a better path.";
    const neutralGenderCopy =
      "After careful consideration of the details of this case, I respectfully recommend that Jo Robertson be sentenced to a period of felony probation. There are a variety of opportunities in the community to support them, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. Should probation be granted, a list of potential resources will be made available to Jo Robertson's supervising officer. Hopefully the defendant will take advantage of the resources available to them while on supervision and make the changes necessary to set their life on a better path.";

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ needs and NO opportunities
  test("generates summary for Probation recommendation type (with needs and NO opportunities) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jo Robertson",
      lastName: "Robertson",
      needs: allNeeds,
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateRecommendationSummary(props);
    const femaleOrTransFemaleCopy =
      "After careful consideration of the details of this case, I respectfully recommend that Ms. Robertson be sentenced to a period of felony probation. There are a variety of opportunities in the community that may help to meet her anger management, case management, domestic violence training, education, family support, food insecurity, financial support, healthcare, housing, vocational training, mental health, substance use and transportation needs, and I hope that the defendant will take advantage of these resources while on supervision and make the changes necessary to set her life on a better path.";
    const maleOrTransMaleCopy =
      "After careful consideration of the details of this case, I respectfully recommend that Mr. Robertson be sentenced to a period of felony probation. There are a variety of opportunities in the community that may help to meet his anger management, case management, domestic violence training, education, family support, food insecurity, financial support, healthcare, housing, vocational training, mental health, substance use and transportation needs, and I hope that the defendant will take advantage of these resources while on supervision and make the changes necessary to set his life on a better path.";
    const neutralGenderCopy =
      "After careful consideration of the details of this case, I respectfully recommend that Jo Robertson be sentenced to a period of felony probation. There are a variety of opportunities in the community that may help to meet their anger management, case management, domestic violence training, education, family support, food insecurity, financial support, healthcare, housing, vocational training, mental health, substance use and transportation needs, and I hope that the defendant will take advantage of these resources while on supervision and make the changes necessary to set their life on a better path.";

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ NO needs and NO opportunities
  test("generates summary for Probation recommendation type (with NO needs and NO opportunities) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ID",
      fullName: "Jo Robertson",
      lastName: "Robertson",
      needs: [],
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateRecommendationSummary(props);
    const femaleOrTransFemaleCopy =
      "After careful consideration of the details of this case, I respectfully recommend that Ms. Robertson be sentenced to a period of felony probation. There are a variety of opportunities in the community that may help to meet her needs, and I hope that the defendant will take advantage of these resources while on supervision and make the changes necessary to set her life on a better path.";
    const maleOrTransMaleCopy =
      "After careful consideration of the details of this case, I respectfully recommend that Mr. Robertson be sentenced to a period of felony probation. There are a variety of opportunities in the community that may help to meet his needs, and I hope that the defendant will take advantage of these resources while on supervision and make the changes necessary to set his life on a better path.";
    const neutralGenderCopy =
      "After careful consideration of the details of this case, I respectfully recommend that Jo Robertson be sentenced to a period of felony probation. There are a variety of opportunities in the community that may help to meet their needs, and I hope that the defendant will take advantage of these resources while on supervision and make the changes necessary to set their life on a better path.";

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });
});

/**
 * Based on the following template ([link to template](https://docs.google.com/document/d/191u3uo84WNzJIvv-ZFPYhu6jRU1UpjRXNjkZUCrmNHE/edit?tab=t.0))
 */

describe("generateRecommendationSummary for US_ND", () => {
  // No recommendation
  test("generates summary for None recommendation type", () => {
    const recommendationType = RecommendationType.None;
    const summary = generateRecommendationSummary({
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

  // Other recommendation
  test("generates summary for Other recommendation type", () => {
    const recommendationType = OTHER_OPTION;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      stateCode: "US_ND",
      fullName: "Jane Doe Williams",
      lastName: "Williams",
      needs: [],
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateRecommendationSummary(props);

    const femaleOrTransFemaleCopy =
      "After careful consideration of the details of this case, it is recommended that Ms. Williams be sentenced to a period of incarceration with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure she needs while allowing her to access a variety of community-based resources to address her key needs, setting her up for a fresh start. Hopefully the defendant will take advantage of the resources available to her and make the changes necessary to set her life on a better path.";
    const maleOrTransMaleCopy =
      "After careful consideration of the details of this case, it is recommended that Mr. Williams be sentenced to a period of incarceration with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure he needs while allowing him to access a variety of community-based resources to address his key needs, setting him up for a fresh start. Hopefully the defendant will take advantage of the resources available to him and make the changes necessary to set his life on a better path.";
    const neutralGenderCopy =
      "After careful consideration of the details of this case, it is recommended that Jane Doe Williams be sentenced to a period of incarceration with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure they need while allowing them to access a variety of community-based resources to address their key needs, setting them up for a fresh start. Hopefully the defendant will take advantage of the resources available to them and make the changes necessary to set their life on a better path.";

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
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
    let summary = generateRecommendationSummary(props);

    const femaleOrTransFemaleCopy =
      "After careful consideration of the details of this case, it is recommended that Ms. Williams be given a sentence of at least 21 years with the North Dakota Department of Corrections and Rehabilitation. Hopefully the defendant will take advantage of the resources available to her while incarcerated and make the changes necessary to set her life on a better path.";
    const maleOrTransMaleCopy =
      "After careful consideration of the details of this case, it is recommended that Mr. Williams be given a sentence of at least 21 years with the North Dakota Department of Corrections and Rehabilitation. Hopefully the defendant will take advantage of the resources available to him while incarcerated and make the changes necessary to set his life on a better path.";
    const neutralGenderCopy =
      "After careful consideration of the details of this case, it is recommended that Jane Doe Williams be given a sentence of at least 21 years with the North Dakota Department of Corrections and Rehabilitation. Hopefully the defendant will take advantage of the resources available to them while incarcerated and make the changes necessary to set their life on a better path.";

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Less than one year recommendation (default) w/ needs and opportunities
  test("generates summary for less than one year recommendation type with expected name and salutations", () => {
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
      opportunityDescriptions: pluralizeDuplicates([
        "mental health provider",
        "inpatient substance use treatment facility",
        "inpatient substance use treatment facility",
        "mental health court",
        "veterans court",
        "mental health court",
      ]),
      gender: "FEMALE",
    };
    let summary = generateRecommendationSummary(props);

    const femaleOrTransFemaleCopy =
      "After careful consideration of the details of this case, it is recommended that Ms. Williams be given a sentence of less than one year with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure she needs while allowing her to access a variety of community-based resources, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. These services would support Ms. Williams in addressing her key needs, including domestic violence training, family support, financial support, general re-entry support, housing and vocational training. Hopefully the defendant will take advantage of the resources available to her and make the changes necessary to set her life on a better path.";
    const maleOrTransMaleCopy =
      "After careful consideration of the details of this case, it is recommended that Mr. Williams be given a sentence of less than one year with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure he needs while allowing him to access a variety of community-based resources, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. These services would support Mr. Williams in addressing his key needs, including domestic violence training, family support, financial support, general re-entry support, housing and vocational training. Hopefully the defendant will take advantage of the resources available to him and make the changes necessary to set his life on a better path.";
    const neutralGenderCopy =
      "After careful consideration of the details of this case, it is recommended that Jane Doe Williams be given a sentence of less than one year with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure they need while allowing them to access a variety of community-based resources, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. These services would support Jane Doe Williams in addressing their key needs, including domestic violence training, family support, financial support, general re-entry support, housing and vocational training. Hopefully the defendant will take advantage of the resources available to them and make the changes necessary to set their life on a better path.";

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // 11-20 years recommendation w/ opportunities and NO needs
  test("generates summary for 11-20 years recommendation type (with opportunities and NO needs) with expected name, pronouns and salutations", () => {
    const recommendationType = "11-20 years";
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      sentenceLengthStart: 11,
      sentenceLengthEnd: 20,
      stateCode: "US_ND",
      fullName: "Jo Robertson",
      lastName: "Robertson",
      needs: [],
      opportunityDescriptions: pluralizeDuplicates([
        "mental health provider",
        "inpatient substance use treatment facility",
        "inpatient substance use treatment facility",
        "mental health court",
        "veterans court",
        "mental health court",
      ]),
      gender: "FEMALE",
    };
    let summary = generateRecommendationSummary(props);
    const femaleOrTransFemaleCopy =
      "After careful consideration of the details of this case, it is recommended that Ms. Robertson be given a sentence between 11 and 20 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure she needs while allowing her to access a variety of community-based resources, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. These services would support Ms. Robertson in addressing her key needs, setting her up for a fresh start. Hopefully the defendant will take advantage of the resources available to her and make the changes necessary to set her life on a better path.";
    const maleOrTransMaleCopy =
      "After careful consideration of the details of this case, it is recommended that Mr. Robertson be given a sentence between 11 and 20 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure he needs while allowing him to access a variety of community-based resources, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. These services would support Mr. Robertson in addressing his key needs, setting him up for a fresh start. Hopefully the defendant will take advantage of the resources available to him and make the changes necessary to set his life on a better path.";
    const neutralGenderCopy =
      "After careful consideration of the details of this case, it is recommended that Jo Robertson be given a sentence between 11 and 20 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure they need while allowing them to access a variety of community-based resources, including a mental health provider, inpatient substance use treatment facilities, mental health courts and a veterans court. These services would support Jo Robertson in addressing their key needs, setting them up for a fresh start. Hopefully the defendant will take advantage of the resources available to them and make the changes necessary to set their life on a better path.";

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  //  11-20 years recommendation w/ needs and NO opportunities
  test("generates summary for 11-20 years recommendation type (with needs and NO opportunities) with expected name, pronouns and salutations", () => {
    const recommendationType = "11-20 years";
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      sentenceLengthStart: 11,
      sentenceLengthEnd: 20,
      stateCode: "US_ND",
      fullName: "Jo Robertson",
      lastName: "Robertson",
      needs: allNeeds,
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateRecommendationSummary(props);
    const femaleOrTransFemaleCopy =
      "After careful consideration of the details of this case, it is recommended that Ms. Robertson be given a sentence between 11 and 20 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure she needs while allowing her to access a variety of community-based resources to address her key needs, including anger management, domestic violence training, education, family support, financial support, healthcare, general re-entry support, housing, vocational training, mental health and substance use. Hopefully the defendant will take advantage of the resources available to her and make the changes necessary to set her life on a better path.";
    const maleOrTransMaleCopy =
      "After careful consideration of the details of this case, it is recommended that Mr. Robertson be given a sentence between 11 and 20 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure he needs while allowing him to access a variety of community-based resources to address his key needs, including anger management, domestic violence training, education, family support, financial support, healthcare, general re-entry support, housing, vocational training, mental health and substance use. Hopefully the defendant will take advantage of the resources available to him and make the changes necessary to set his life on a better path.";
    const neutralGenderCopy =
      "After careful consideration of the details of this case, it is recommended that Jo Robertson be given a sentence between 11 and 20 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure they need while allowing them to access a variety of community-based resources to address their key needs, including anger management, domestic violence training, education, family support, financial support, healthcare, general re-entry support, housing, vocational training, mental health and substance use. Hopefully the defendant will take advantage of the resources available to them and make the changes necessary to set their life on a better path.";

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // 11-20 years recommendation w/ NO needs and NO opportunities
  test("generates summary for 11-20 years recommendation type (with NO needs and NO opportunities) with expected name, pronouns and salutations", () => {
    const recommendationType = "11-20 years";
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      sentenceLengthStart: 11,
      sentenceLengthEnd: 20,
      stateCode: "US_ND",
      fullName: "Jo Robertson",
      lastName: "Robertson",
      needs: [],
      opportunityDescriptions: [],
      gender: "FEMALE",
    };
    let summary = generateRecommendationSummary(props);
    const femaleOrTransFemaleCopy =
      "After careful consideration of the details of this case, it is recommended that Ms. Robertson be given a sentence between 11 and 20 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure she needs while allowing her to access a variety of community-based resources to address her key needs, setting her up for a fresh start. Hopefully the defendant will take advantage of the resources available to her and make the changes necessary to set her life on a better path.";
    const maleOrTransMaleCopy =
      "After careful consideration of the details of this case, it is recommended that Mr. Robertson be given a sentence between 11 and 20 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure he needs while allowing him to access a variety of community-based resources to address his key needs, setting him up for a fresh start. Hopefully the defendant will take advantage of the resources available to him and make the changes necessary to set his life on a better path.";
    const neutralGenderCopy =
      "After careful consideration of the details of this case, it is recommended that Jo Robertson be given a sentence between 11 and 20 years with the North Dakota Department of Corrections and Rehabilitation, followed by a period of supervised probation. This approach would provide the structure they need while allowing them to access a variety of community-based resources to address their key needs, setting them up for a fresh start. Hopefully the defendant will take advantage of the resources available to them and make the changes necessary to set their life on a better path.";

    // Gender: Female
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Trans Female
    props.gender = "TRANS_FEMALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(femaleOrTransFemaleCopy);

    // Gender: Male
    props.gender = "MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Trans Male
    props.gender = "TRANS_MALE";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(maleOrTransMaleCopy);

    // Gender: Non-binary
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Internal Unknown
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: External Unknown
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Undefined
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });
});
