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
    const recommendationType = RecommendationType.Rider;
    const result = formatNeedsList(allNeeds, recommendationType);
    expect(result).toEqual([
      "Anger management",
      "Domestic violence training",
      "Education",
      "Healthcare",
      "Mental health",
      "Substance use",
    ]);
    expect(result).not.toContain("Case management");
    expect(result).not.toContain("Clothing and toiletries");
    expect(result).not.toContain("Family support");
    expect(result).not.toContain("Financial support");
    expect(result).not.toContain("Food insecurity");
    expect(result).not.toContain("General reentry support");
    expect(result).not.toContain("Housing");
    expect(result).not.toContain("Job training or opportunities");
    expect(result).not.toContain("Transportation");
    expect(result).not.toContain("Other");
  });

  test("format needs list based on Term recommendation type", () => {
    const recommendationType = RecommendationType.Term;
    const result = formatNeedsList(allNeeds, recommendationType);
    expect(result).toEqual([
      "Anger management",
      "Domestic violence training",
      "Education",
      "Healthcare",
      "Mental health",
      "Substance use",
    ]);
    expect(result).not.toContain("Case management");
    expect(result).not.toContain("Clothing and toiletries");
    expect(result).not.toContain("Family support");
    expect(result).not.toContain("Financial support");
    expect(result).not.toContain("Food insecurity");
    expect(result).not.toContain("General reentry support");
    expect(result).not.toContain("Housing");
    expect(result).not.toContain("Job training or opportunities");
    expect(result).not.toContain("Transportation");
    expect(result).not.toContain("Other");
  });

  test("format needs list based using the default adjustments for Probation recommendation type", () => {
    const recommendationType = RecommendationType.Probation;
    const result = formatNeedsList(allNeeds, recommendationType);
    expect(result).toEqual([
      "Anger management",
      "Case management",
      "Domestic violence training",
      "Education",
      "Family support",
      "Food insecurity",
      "Financial support",
      "Healthcare",
      "Housing",
      "Vocational training",
      "Mental health",
      "Substance use",
      "Transportation",
    ]);

    expect(result).not.toContain("Clothing and toiletries");
    expect(result).not.toContain("General reentry support");
    expect(result).not.toContain("Job training or opportunities");
    expect(result).not.toContain("Other");
  });

  test("format needs list based using the default adjustments for None recommendation type", () => {
    const recommendationType = RecommendationType.None;
    const result = formatNeedsList(allNeeds, recommendationType);
    expect(result).toEqual([
      "Anger management",
      "Case management",
      "Domestic violence training",
      "Education",
      "Family support",
      "Food insecurity",
      "Financial support",
      "Healthcare",
      "Housing",
      "Vocational training",
      "Mental health",
      "Substance use",
      "Transportation",
    ]);

    expect(result).not.toContain("Clothing and toiletries");
    expect(result).not.toContain("General reentry support");
    expect(result).not.toContain("Job training or opportunities");
    expect(result).not.toContain("Other");
  });
});

/**
 * Based on the following template ([link to template](https://docs.google.com/document/d/1-cSzLhJoH_pnSn599ikDTj9blx7UYHWauYLUItSsPy0/)):
 */
describe("generateRecommendationSummary", () => {
  // No recommendation
  test("generates summary for None recommendation type", () => {
    const recommendationType = RecommendationType.None;
    const summary = generateRecommendationSummary({
      recommendation: recommendationType,
      fullName: "Jane Doe Williams",
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
      fullName: "Jane Doe Williams",
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

    // Gender: Trans Male
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Rider recommendation
  test("generates summary for Rider recommendation type with expected name and salutations", () => {
    const recommendationType = RecommendationType.Rider;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      fullName: "Jane Doe Williams",
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

    // Gender: Trans Male
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ needs and opportunities
  test("generates summary for Probation recommendation type (with needs and opportunities) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      fullName: "Jane Doe Williams",
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

    // Gender: Trans Male
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ opportunities and NO needs
  test("generates summary for Probation recommendation type (with opportunities and NO needs) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      fullName: "Jo Robertson",
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

    // Gender: Trans Male
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ needs and NO opportunities
  test("generates summary for Probation recommendation type (with needs and NO opportunities) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      fullName: "Jo Robertson",
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

    // Gender: Trans Male
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });

  // Probation recommendation w/ NO needs and NO opportunities
  test("generates summary for Probation recommendation type (with NO needs and NO opportunities) with expected name, pronouns and salutations", () => {
    const recommendationType = RecommendationType.Probation;
    const props: GenerateRecommendationProps = {
      recommendation: recommendationType,
      fullName: "Jo Robertson",
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

    // Gender: Trans Male
    props.gender = "NON_BINARY";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "TRANS";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "INTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = "EXTERNAL_UNKNOWN";
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);

    // Gender: Trans Male
    props.gender = undefined;
    summary = generateRecommendationSummary(props);
    expect(summary).toBe(neutralGenderCopy);
  });
});
