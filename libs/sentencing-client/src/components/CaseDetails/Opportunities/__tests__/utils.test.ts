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
import { NONE_OPTION } from "../../Form/constants";
import { EligibilityAttributes } from "../types";
import {
  filterEligibleOpportunities,
  formatPhoneNumberWithExtension,
} from "../utils";

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
    lastUpdatedAt: new Date(),
    additionalNotes: null,
    genders: [],
    genericDescription: null,
  };
  let attributes: EligibilityAttributes;

  it("should return true if all criteria are met", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);
  });

  it("should return true for opportunities within the district and false for opportunities outside the district", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);

    attributes.county = "District 7 - Wallace"; // does not match criterion
    attributes.districtOfResidence = "DISTRICT 7"; // does not match criterion
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });

  it("should fallback on matching district of residence if district of residence and sentencing differ", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "District 7 - Caldwell",
      districtOfResidence: "DISTRICT 1",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);

    attributes.districtOfResidence = "DISTRICT 2"; // district (of residence) is the fallback and does not match criteron
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);

    attributes.county = "District 2 - Caldera"; // district sentencing matches district of residence and both do not match criteron
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });

  it("should fallback on matching district of sentencing if district of residence is null", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: null,
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);

    attributes.districtOfSentencing = "District 2";
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);

    attributes.districtOfResidence = "DISTRICT 1";
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);
  });

  it("should return false if age criteria are not met", () => {
    attributes = {
      age: 17, // below minAge
      hasDevelopmentalDisability: true,
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
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
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });

  it("should return false if sex offense criterion is not met, and true if the criterion is met", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: true, // does not match criterion
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);

    attributes.hasPreviousSexOffenseConviction = false; // matches criterion

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);

    attributes.isCurrentOffenseSexual = true; // current offense flag now does not match criterion

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });

  it("should return false if violent offense criterion is not met, and true if the criterion is met", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: true, // does not match criterion
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);

    attributes.hasPreviousViolentOffenseConviction = false; // matches criterion

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);

    attributes.isCurrentOffenseViolent = true; // current offense flag now does not match criterion

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });

  it("should return false if criminal history criterion is not met", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: true, // does not match criterion
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
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
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "NotGuilty", // does not match criterion
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
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
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
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
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
      isVeteran: true,
      mentalHealthDiagnoses: [], // does not match criterion
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);

    // If criteria is "Any", `mentalHealthDiagnoses` must contain one item that is not "None"
    attributes.mentalHealthDiagnoses = [NONE_OPTION];
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
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
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
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
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
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
      isVeteran: true,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["AngerManagement"], // does not match criterion
      lsirScore: 10,
    };
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);

    // should bypass needs addressed criterion if no needs are selected for client
    attributes.needsToBeAddressed = [];
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);

    attributes.needsToBeAddressed = ["AngerManagement", "Education"];
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);
  });

  it("should return false if LSIR score criterion is below min criterion", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
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
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
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
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
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
      district: "D1",
      lastUpdatedAt: new Date(),
      additionalNotes: null,
      genders: [],
      genericDescription: null,
    };

    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
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
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: true,
      hasPreviousViolentOffenseConviction: true,
      previouslyIncarceratedOrUnderSupervision: true,
      plea: "NotGuilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
      isVeteran: false,
      mentalHealthDiagnoses: [NONE_OPTION],
      substanceUseDisorderDiagnosis: "Severe",
      asamCareRecommendation: "ClinicallyManagedLowIntensityResidential",
      needsToBeAddressed: ["Education"],
      lsirScore: 30,
    };

    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);
  });

  it("should skip evaluating excluded attributes", () => {
    attributes = {
      age: 30,
      hasDevelopmentalDisability: true,
      isCurrentOffenseSexual: false,
      isCurrentOffenseViolent: false,
      hasPreviousSexOffenseConviction: false,
      hasPreviousViolentOffenseConviction: false,
      previouslyIncarceratedOrUnderSupervision: false,
      plea: "Guilty",
      county: "Caldwell",
      districtOfSentencing: "District 1",
      districtOfResidence: "DISTRICT 1",
      isVeteran: false,
      mentalHealthDiagnoses: ["BipolarDisorder"],
      substanceUseDisorderDiagnosis: "Moderate",
      asamCareRecommendation: "HighIntensityOutpatient",
      needsToBeAddressed: ["Education"],
      lsirScore: 10,
    };

    // `isVeteran` attribute does not meet the opportunity criteria
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);

    // Exclude `isVeteran` from attributes
    delete attributes["isVeteran"];

    // Should skip evaluating the `isVeteran` criteria and return `true` as all other criteria match
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);

    // Set age attribute to not match the opportunity criteria
    attributes.age = 70;
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(false);

    // Exclude `age` from attributes
    delete attributes["age"];

    // Should skip evaluating the `age` criteria and return `true` as all other criteria match
    expect(filterEligibleOpportunities(opportunity, attributes)).toBe(true);
  });
});

test("formatPhoneNumberWithExtension handles base phone numbers", () => {
  expect(formatPhoneNumberWithExtension("2234567890")).toBe("(223) 456-7890");
  // With US country code
  expect(formatPhoneNumberWithExtension("17234567890")).toBe("(723) 456-7890");
});

test("formatPhoneNumberWithExtension handles multiple phone numbers", () => {
  const multipleNumbersWithSomeCountryCode = "17234567890172345678902234567890";
  expect(
    formatPhoneNumberWithExtension(multipleNumbersWithSomeCountryCode),
  ).toBe("(723) 456-7890, (723) 456-7890, (223) 456-7890");
});

test("formatPhoneNumberWithExtension handles extensions", () => {
  expect(formatPhoneNumberWithExtension("223456789022")).toBe(
    "(223) 456-7890 x22",
  );
  // With US country code
  expect(formatPhoneNumberWithExtension("17234567890232312")).toBe(
    "(723) 456-7890 x232312",
  );
});

test("formatPhoneNumberWithExtension handles digits less than a phone number length", () => {
  expect(formatPhoneNumberWithExtension("223456789")).toBeNull();
  expect(formatPhoneNumberWithExtension("223456")).toBeNull();
});
