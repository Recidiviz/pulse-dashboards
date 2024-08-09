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

import { Opportunities } from "../../../../api";
import { EligibilityAttributes } from "../types";
import { filterEligibleOpportunities } from "../utils";

describe("filterEligibleOpportunities", () => {
  const opportunity: Opportunities[number] = {
    opportunityName: "Opportunity 1",
    description: "",
    providerName: null,
    providerPhoneNumber: "",
    providerWebsite: "",
    providerAddress: "",
    totalCapacity: 56,
    availableCapacity: 85,
    minAge: 18,
    maxAge: 65,
    developmentalDisabilityDiagnosisCriterion: true,
    noCurrentOrPriorSexOffenseCriterion: true,
    noCurrentOrPriorViolentOffenseCriterion: true,
    noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
    priorCriminalHistoryCriterion: "None",
    entryOfGuiltyPleaCriterion: true,
    veteranStatusCriterion: true,
    diagnosedMentalHealthDiagnosisCriterion: ["Any"],
    diagnosedSubstanceUseDisorderCriterion: "Moderate",
    asamLevelOfCareRecommendationCriterion: "HighIntensityOutpatient",
    needsAddressed: ["Education"],
    minLsirScoreCriterion: 5,
    maxLsirScoreCriterion: 25,
    district: "D1",
  };
  let attributes: EligibilityAttributes;

  it("should return true if all criteria are met", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);
  });

  it("should return false if age criteria are not met", () => {
    attributes = {
      age: 17, // below minAge
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);

    attributes.age = 66; // above maxAge
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);

    attributes.age = 65; // at maxAge
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);

    attributes.age = 18; // at minAge
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);
  });

  it("should return false if developmental disability criterion is not met", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: false, // does not match criterion
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });

  it("should return false if sex offense criterion is not met", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: true, // does not match criterion
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });

  it("should return false if violent offense criterion is not met", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: true, // does not match criterion
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });

  it("should return false if criminal history criterion is not met", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: true, // does not match criterion
      plea: "Guilty",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });

  it("should return false if plea criterion is not met", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "NotGuilty", // does not match criterion
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });

  it("should return false if veteran status criterion is not met", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      isVeteran: false, // does not match criterion
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });

  it("should handle mental health diagnosis criterion cases", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      isVeteran: true,
      mentalHealthDiagnoses: [], // does not match criterion
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);

    // If criteria is "Any", `mentalHealthDiagnoses` must contain one item that is not "None"
    attributes.mentalHealthDiagnoses = ["None"];
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);

    attributes.mentalHealthDiagnoses = ["BipolarDisorder"];
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);

    // If criteria has a non-Any value, the `mentalHealthDiagnoses` must include at least one item from the list
    const updatedOpportunity: Opportunities[number] = {
      ...opportunity,
      diagnosedMentalHealthDiagnosisCriterion: [
        "MajorDepressiveDisorder",
        "DelusionalDisorder",
      ],
    };

    attributes.mentalHealthDiagnoses = ["PsychoticDisorder"];
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      false,
    );

    attributes.mentalHealthDiagnoses = ["DelusionalDisorder", "Schizophrenia"];
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      true,
    );
  });

  it("should handle substance use disorder criterion cases", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Mild", // does not match criterion
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);

    attributes.substanceUseDisorderDiagnosis = "Moderate"; // matches criterion
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);

    // If criteria is "Any", the `substanceUseDisorderDiagnosis` should not be `null`
    let updatedOpportunity: Opportunities[number] = {
      ...opportunity,
      diagnosedSubstanceUseDisorderCriterion: "Any",
    };
    attributes.substanceUseDisorderDiagnosis = null;
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      false,
    );
    attributes.substanceUseDisorderDiagnosis = "Severe";
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      true,
    );

    // If criteria is "Mild", `substanceUseDisorderDiagnosis` can be Mild | Moderate | Severe
    updatedOpportunity = {
      ...opportunity,
      diagnosedSubstanceUseDisorderCriterion: "Mild",
    };
    attributes.substanceUseDisorderDiagnosis = null;
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      false,
    );
    attributes.substanceUseDisorderDiagnosis = "Mild";
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      true,
    );
    attributes.substanceUseDisorderDiagnosis = "Moderate";
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      true,
    );
    attributes.substanceUseDisorderDiagnosis = "Severe";
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      true,
    );

    // If criteria is "Moderate", `substanceUseDisorderDiagnosis` can be Moderate | Severe
    updatedOpportunity = {
      ...opportunity,
      diagnosedSubstanceUseDisorderCriterion: "Moderate",
    };
    attributes.substanceUseDisorderDiagnosis = null;
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      false,
    );
    attributes.substanceUseDisorderDiagnosis = "Mild";
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      false,
    );
    attributes.substanceUseDisorderDiagnosis = "Moderate";
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      true,
    );
    attributes.substanceUseDisorderDiagnosis = "Severe";
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      true,
    );

    // If criteria is "Severe", `substanceUseDisorderDiagnosis` can only be Severe
    updatedOpportunity = {
      ...opportunity,
      diagnosedSubstanceUseDisorderCriterion: "Severe",
    };
    attributes.substanceUseDisorderDiagnosis = null;
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      false,
    );
    attributes.substanceUseDisorderDiagnosis = "Mild";
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      false,
    );
    attributes.substanceUseDisorderDiagnosis = "Moderate";
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      false,
    );
    attributes.substanceUseDisorderDiagnosis = "Severe";
    expect(filterEligibleOpportunities(updatedOpportunity, attributes)).toBe(
      true,
    );
  });

  it("should return false if ASAM level of care recommendation criterion is not met", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "ClinicallyManagedHighIntensityResidential", // does not match criterion
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });

  it("should handle needs addressed criterion cases", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["AngerManagement"], // does not match criterion
      lsirScore: 10,
    };
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);

    attributes.needsToBeAddressed = [];
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);

    attributes.needsToBeAddressed = ["AngerManagement", "Education"];
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);
  });

  it("should return false if LSIR score criterion is below min criterion", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 4, // below minLsirScoreCriterion
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });

  it("should return false if LSIR score is above max criterion", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 30, // above maxLsirScoreCriterion
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });

  it("should return true if LSIR score is at/within the criterion range", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 5, // at maxLsirScoreCriterion
    };
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);

    // At minLsirScoreCriterion
    attributes.lsirScore = 25;
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);

    // Within minLsirScoreCriterion and maxLsirScoreCriterion
    attributes.lsirScore = 20;
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);
  });

  it("should handle no eligiblity criteria correctly", () => {
    const opportunityWithNoCriteria: Opportunities[number] = {
      opportunityName: "Opportunity 1",
      description: "",
      providerName: null,
      providerPhoneNumber: "",
      providerWebsite: "",
      providerAddress: "",
      totalCapacity: 56,
      availableCapacity: 85,
      minAge: null,
      maxAge: null,
      developmentalDisabilityDiagnosisCriterion: false,
      noCurrentOrPriorSexOffenseCriterion: false,
      noCurrentOrPriorViolentOffenseCriterion: false,
      priorCriminalHistoryCriterion: null,
      entryOfGuiltyPleaCriterion: false,
      veteranStatusCriterion: false,
      diagnosedMentalHealthDiagnosisCriterion: ["Any"],
      diagnosedSubstanceUseDisorderCriterion: null,
      asamLevelOfCareRecommendationCriterion: null,
      needsAddressed: [],
      minLsirScoreCriterion: null,
      maxLsirScoreCriterion: null,
      noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
      district: null,
    };

    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(
      filterEligibleOpportunities(opportunityWithNoCriteria, attributes),
    ).toBe(true);
  });

  it("should handle cases where attributes do not match any criteria", () => {
    attributes = {
      age: 85,
      hasDevelopmentalDisability: false,
      hasPreviousSexOffenseConviction: true,
      hasPreviousViolentOffenseConviction: true,
      previouslyIncarceratedOrUnderSupervision: true,
      plea: "NotGuilty",
      isVeteran: false,
      mentalHealthDiagnoses: ["None"],
      substanceUseDisorderDiagnosis: "Severe",
      asamCareRecommendation: "ClinicallyManagedLowIntensityResidential",
      needsToBeAddressed: ["Education"],
      lsirScore: 30,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });
});
