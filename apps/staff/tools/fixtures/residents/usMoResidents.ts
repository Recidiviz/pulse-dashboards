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

import { ResidentFixture } from "../residents";

export const usMoResidents: ResidentFixture[] = [
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingRelease"],
    stateCode: "US_MO",
    personExternalId: "RES007",
    displayId: "dRES007",
    personName: {
      givenNames: "Eli",
      surname: "Greenberg",
    },
    gender: "MALE",
    pseudonymizedId: "anonres007",
    facilityId: "FACILITY1",
    unitId: "UNIT E",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [
        {
          sanctionCode: "D1-01",
          sanctionId: 7001,
          sanctionStartDate: "2024-11-10",
          sanctionExpirationDate: "2025-02-10",
        },
      ],
      numD1SanctionsPastYear: 1,
      solitaryAssignmentInfoPastYear: [
        { startDate: "2025-01-05", endDate: "2025-01-20" },
        { startDate: "2024-09-02", endDate: "2024-09-16" },
      ],
      numSolitaryAssignmentsPastYear: 2,
      medicalScore: 2,
      publicRiskScore: 3,
      maximumReleaseDate: "2026-08-15",
      conditionalReleaseDate: "2025-11-01",
      presumptiveParoleDate: "2025-06-01",
      institutionalRiskScore: 4,
      educationScore: 2,
      gangAffiliation: "NON-STG MEMBER",
      mentalHealthScore: 1,
      latestCycleSentences: [
        {
          offense: "Assault 2nd Degree",
          sentenceLengthYears: 5,
          sentenceLengthMonths: 0,
          sentenceLengthDays: 0,
        },
        {
          offense: "Property Damage",
          sentenceLengthYears: 1,
          sentenceLengthMonths: 6,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Anger Management",
          status: "COMPLETED",
          completionDate: "2025-02-28",
        },
        {
          program: "Substance Abuse Program",
          status: "COMPLETED",
          completionDate: "2024-10-15",
        },
      ],
      priorCycleSentences: [
        { offense: "Burglary", offenseDate: "2019-05-12" },
        { offense: "Theft", offenseDate: "2018-03-22" },
      ],
    },
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingRelease"],
    stateCode: "US_MO",
    personExternalId: "RES008",
    displayId: "dRES008",
    personName: {
      givenNames: "Ivan",
      surname: "Dimitriadis",
    },
    gender: "MALE",
    pseudonymizedId: "anonres008",
    facilityId: "FACILITY2",
    unitId: "UNIT F",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [
        {
          sanctionCode: "D1-03",
          sanctionId: 8002,
          sanctionStartDate: "2025-03-01",
          sanctionExpirationDate: "2025-05-01",
        },
        {
          sanctionCode: "D1-02",
          sanctionId: 8001,
          sanctionStartDate: "2024-08-20",
          sanctionExpirationDate: "2024-09-20",
        },
      ],
      numD1SanctionsPastYear: 2,
      solitaryAssignmentInfoPastYear: [
        { startDate: "2025-04-12", endDate: "2025-04-14" },
      ],
      numSolitaryAssignmentsPastYear: 1,
      medicalScore: 3,
      publicRiskScore: 2,
      maximumReleaseDate: "2027-03-10",
      conditionalReleaseDate: "2026-01-15",
      presumptiveParoleDate: "2025-12-20",
      institutionalRiskScore: 3,
      educationScore: 1,
      gangAffiliation: "STG ASSOCIATE",
      mentalHealthScore: 2,
      latestCycleSentences: [
        {
          offense: "Robbery 1st Degree",
          sentenceLengthYears: 7,
          sentenceLengthMonths: 0,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Cognitive Skills",
          status: "COMPLETED",
          completionDate: "2025-05-30",
        },
      ],
      priorCycleSentences: [
        { offense: "Trespassing", offenseDate: "2020-02-02" },
      ],
    },
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingRelease"],
    stateCode: "US_MO",
    personExternalId: "RES009",
    displayId: "dRES009",
    personName: {
      givenNames: "Simon",
      surname: "Kumar",
    },
    gender: "MALE",
    pseudonymizedId: "anonres009",
    facilityId: "FACILITY1",
    unitId: "UNIT G",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [],
      numD1SanctionsPastYear: 0,
      solitaryAssignmentInfoPastYear: [],
      numSolitaryAssignmentsPastYear: 0,
      medicalScore: null,
      publicRiskScore: 1,
      maximumReleaseDate: "2026-12-01",
      conditionalReleaseDate: "2025-09-01",
      presumptiveParoleDate: null,
      institutionalRiskScore: 1,
      educationScore: 3,
      gangAffiliation: "NON-STG MEMBER",
      mentalHealthScore: 0,
      latestCycleSentences: [
        {
          offense: "Fraud",
          sentenceLengthYears: 3,
          sentenceLengthMonths: 0,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Job Readiness",
          status: "COMPLETED",
          completionDate: "2025-03-10",
        },
      ],
      priorCycleSentences: [
        { offense: "Identity Theft", offenseDate: "2017-11-01" },
      ],
    },
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingRelease"],
    stateCode: "US_MO",
    personExternalId: "RES010",
    displayId: "dRES010",
    personName: {
      givenNames: "Alexa",
      surname: "Catrel",
    },
    gender: "TRANS_FEMALE",
    pseudonymizedId: "anonres010",
    facilityId: "FACILITY2",
    unitId: "UNIT H",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [
        {
          sanctionCode: "D1-04",
          sanctionId: 10010,
          sanctionStartDate: "2025-02-05",
          sanctionExpirationDate: "2025-03-05",
        },
      ],
      numD1SanctionsPastYear: 1,
      solitaryAssignmentInfoPastYear: [
        { startDate: "2025-02-10", endDate: "2025-02-18" },
      ],
      numSolitaryAssignmentsPastYear: 1,
      medicalScore: 1,
      publicRiskScore: 4,
      maximumReleaseDate: "2028-01-20",
      conditionalReleaseDate: "2026-06-15",
      presumptiveParoleDate: "2026-02-01",
      institutionalRiskScore: 2,
      educationScore: 2,
      gangAffiliation: "STG MEMBER",
      mentalHealthScore: 2,
      latestCycleSentences: [
        {
          offense: "Distribution of Controlled Substance",
          sentenceLengthYears: 6,
          sentenceLengthMonths: 0,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Substance Abuse Program",
          status: "COMPLETED",
          completionDate: "2025-04-01",
        },
        {
          program: "GED Prep",
          status: "COMPLETED",
          completionDate: "2024-12-12",
        },
      ],
      priorCycleSentences: [
        {
          offense: "Possession of Controlled Substance",
          offenseDate: "2020-06-30",
        },
      ],
    },
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingInitialHearing"],
    stateCode: "US_MO",
    personExternalId: "RES011",
    displayId: "dRES011",
    personName: {
      givenNames: "Aanya",
      surname: "Sharma",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres011",
    facilityId: "FACILITY1",
    unitId: "UNIT E",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [],
      numD1SanctionsPastYear: 0,
      solitaryAssignmentInfoPastYear: [
        { startDate: "2025-01-22", endDate: "2025-01-29" },
      ],
      numSolitaryAssignmentsPastYear: 1,
      medicalScore: 0,
      publicRiskScore: 1,
      maximumReleaseDate: "2025-12-30",
      conditionalReleaseDate: null,
      presumptiveParoleDate: "2025-09-10",
      institutionalRiskScore: 1,
      educationScore: 3,
      gangAffiliation: "NON-STG MEMBER",
      mentalHealthScore: 1,
      latestCycleSentences: [
        {
          offense: "Forgery",
          sentenceLengthYears: 2,
          sentenceLengthMonths: 6,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Financial Literacy",
          status: "COMPLETED",
          completionDate: "2025-03-18",
        },
      ],
      priorCycleSentences: [
        { offense: "Shoplifting", offenseDate: "2016-08-14" },
      ],
    },
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingInitialHearing"],
    stateCode: "US_MO",
    personExternalId: "RES012",
    displayId: "dRES008",
    personName: {
      givenNames: "Nina",
      surname: "Ruelas",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres012",
    facilityId: "FACILITY2",
    unitId: "UNIT F",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [
        {
          sanctionCode: "D1-05",
          sanctionId: 12012,
          sanctionStartDate: "2024-10-05",
          sanctionExpirationDate: "2024-11-05",
        },
      ],
      numD1SanctionsPastYear: 1,
      solitaryAssignmentInfoPastYear: [],
      numSolitaryAssignmentsPastYear: 0,
      medicalScore: 2,
      publicRiskScore: 2,
      maximumReleaseDate: "2027-09-09",
      conditionalReleaseDate: "2026-03-01",
      presumptiveParoleDate: null,
      institutionalRiskScore: 2,
      educationScore: 4,
      gangAffiliation: "NON-STG MEMBER",
      mentalHealthScore: 1,
      latestCycleSentences: [
        {
          offense: "Credit Card Fraud",
          sentenceLengthYears: 4,
          sentenceLengthMonths: 0,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Victim Impact",
          status: "COMPLETED",
          completionDate: "2025-06-10",
        },
      ],
      priorCycleSentences: [
        { offense: "Fraudulent Use of Device", offenseDate: "2019-09-21" },
      ],
    },
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingInitialHearing"],
    stateCode: "US_MO",
    personExternalId: "RES013",
    displayId: "dRES013",
    personName: {
      givenNames: "Jason",
      surname: "Holman",
    },
    gender: "MALE",
    pseudonymizedId: "anonres013",
    facilityId: "FACILITY1",
    unitId: "UNIT G",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [],
      numD1SanctionsPastYear: 0,
      solitaryAssignmentInfoPastYear: [
        { startDate: "2024-12-01", endDate: "2024-12-07" },
        { startDate: "2024-08-10", endDate: "2024-08-15" },
      ],
      numSolitaryAssignmentsPastYear: 2,
      medicalScore: 1,
      publicRiskScore: 2,
      maximumReleaseDate: "2026-05-05",
      conditionalReleaseDate: "2025-10-10",
      presumptiveParoleDate: "2025-07-01",
      institutionalRiskScore: 2,
      educationScore: 2,
      gangAffiliation: "NON-STG MEMBER",
      mentalHealthScore: 2,
      latestCycleSentences: [
        {
          offense: "Receiving Stolen Property",
          sentenceLengthYears: 3,
          sentenceLengthMonths: 6,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Thinking for a Change",
          status: "COMPLETED",
          completionDate: "2025-02-05",
        },
      ],
      priorCycleSentences: [
        { offense: "Theft by Deception", offenseDate: "2015-04-19" },
      ],
    },
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingInitialHearing"],
    stateCode: "US_MO",
    personExternalId: "RES014",
    displayId: "dRES014",
    personName: {
      givenNames: "Sam",
      surname: "Coolridge",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres014",
    facilityId: "FACILITY2",
    unitId: "UNIT H",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [],
      numD1SanctionsPastYear: 0,
      solitaryAssignmentInfoPastYear: [],
      numSolitaryAssignmentsPastYear: 0,
      medicalScore: 0,
      publicRiskScore: 1,
      maximumReleaseDate: "2025-11-11",
      conditionalReleaseDate: null,
      presumptiveParoleDate: null,
      institutionalRiskScore: 1,
      educationScore: 4,
      gangAffiliation: "NON-STG MEMBER",
      mentalHealthScore: 0,
      latestCycleSentences: [
        {
          offense: "Check Fraud",
          sentenceLengthYears: 2,
          sentenceLengthMonths: 0,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Life Skills",
          status: "COMPLETED",
          completionDate: "2025-01-15",
        },
      ],
      priorCycleSentences: [
        { offense: "Petty Theft", offenseDate: "2014-12-12" },
      ],
    },
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingReviewHearing"],
    stateCode: "US_MO",
    personExternalId: "RES015",
    displayId: "dRES015",
    personName: {
      givenNames: "Harold",
      surname: "Thompson",
    },
    gender: "MALE",
    pseudonymizedId: "anonres015",
    facilityId: "FACILITY1",
    unitId: "UNIT E",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [
        {
          sanctionCode: "D1-02",
          sanctionId: 15001,
          sanctionStartDate: "2024-07-04",
          sanctionExpirationDate: "2024-08-04",
        },
      ],
      numD1SanctionsPastYear: 1,
      solitaryAssignmentInfoPastYear: [
        { startDate: "2025-03-03", endDate: "2025-03-10" },
      ],
      numSolitaryAssignmentsPastYear: 1,
      medicalScore: 2,
      publicRiskScore: 3,
      maximumReleaseDate: "2027-07-04",
      conditionalReleaseDate: "2026-09-09",
      presumptiveParoleDate: "2026-01-01",
      institutionalRiskScore: 3,
      educationScore: 2,
      gangAffiliation: "STG ASSOCIATE",
      mentalHealthScore: 1,
      latestCycleSentences: [
        {
          offense: "Arson 2nd Degree",
          sentenceLengthYears: 8,
          sentenceLengthMonths: 0,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Fire Safety",
          status: "COMPLETED",
          completionDate: "2025-05-05",
        },
      ],
      priorCycleSentences: [
        { offense: "Vandalism", offenseDate: "2013-03-03" },
      ],
    },
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingReviewHearing"],
    stateCode: "US_MO",
    personExternalId: "RES016",
    displayId: "dRES016",
    personName: {
      givenNames: "Harriet",
      surname: "Davis",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres016",
    facilityId: "FACILITY2",
    unitId: "UNIT F",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [],
      numD1SanctionsPastYear: 0,
      solitaryAssignmentInfoPastYear: [
        { startDate: "2024-10-20", endDate: "2024-10-28" },
      ],
      numSolitaryAssignmentsPastYear: 1,
      medicalScore: 1,
      publicRiskScore: 2,
      maximumReleaseDate: "2026-03-14",
      conditionalReleaseDate: "2025-12-12",
      presumptiveParoleDate: null,
      institutionalRiskScore: 2,
      educationScore: 3,
      gangAffiliation: "NON-STG MEMBER",
      mentalHealthScore: 1,
      latestCycleSentences: [
        {
          offense: "Embezzlement",
          sentenceLengthYears: 4,
          sentenceLengthMonths: 0,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Ethics in Workplace",
          status: "COMPLETED",
          completionDate: "2025-02-22",
        },
      ],
      priorCycleSentences: [{ offense: "Forgery", offenseDate: "2012-06-16" }],
    },
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingReviewHearing"],
    stateCode: "US_MO",
    personExternalId: "RES017",
    displayId: "dRES017",
    personName: {
      givenNames: "Kofi",
      surname: "Anderson",
    },
    gender: "MALE",
    pseudonymizedId: "anonres017",
    facilityId: "FACILITY1",
    unitId: "UNIT G",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [
        {
          sanctionCode: "D1-01",
          sanctionId: 17001,
          sanctionStartDate: "2025-01-12",
          sanctionExpirationDate: "2025-02-12",
        },
        {
          sanctionCode: "D1-03",
          sanctionId: 17002,
          sanctionStartDate: "2024-09-09",
          sanctionExpirationDate: "2024-10-09",
        },
      ],
      numD1SanctionsPastYear: 2,
      solitaryAssignmentInfoPastYear: [],
      numSolitaryAssignmentsPastYear: 0,
      medicalScore: 3,
      publicRiskScore: 4,
      maximumReleaseDate: "2028-08-08",
      conditionalReleaseDate: "2026-12-01",
      presumptiveParoleDate: "2026-04-01",
      institutionalRiskScore: 4,
      educationScore: 1,
      gangAffiliation: "STG MEMBER",
      mentalHealthScore: 2,
      latestCycleSentences: [
        {
          offense: "Aggravated Assault",
          sentenceLengthYears: 10,
          sentenceLengthMonths: 0,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Violence Reduction",
          status: "COMPLETED",
          completionDate: "2025-07-07",
        },
      ],
      priorCycleSentences: [{ offense: "Battery", offenseDate: "2011-01-01" }],
    },
  },
  {
    allEligibleOpportunities: ["usMoOverdueRestrictiveHousingReviewHearing"],
    stateCode: "US_MO",
    personExternalId: "RES018",
    displayId: "dRES018",
    personName: {
      givenNames: "Elise",
      surname: "Baker",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres018",
    facilityId: "FACILITY2",
    unitId: "UNIT H",
    custodyLevel: "MINIMUM",
    // Resident record query doesn't currently write start/end dates for MO
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [],
      numD1SanctionsPastYear: 0,
      solitaryAssignmentInfoPastYear: [
        { startDate: "2025-05-01", endDate: "2025-05-03" },
      ],
      numSolitaryAssignmentsPastYear: 1,
      medicalScore: 0,
      publicRiskScore: 1,
      maximumReleaseDate: "2026-10-20",
      conditionalReleaseDate: "2025-08-08",
      presumptiveParoleDate: null,
      institutionalRiskScore: 1,
      educationScore: 3,
      gangAffiliation: "NON-STG MEMBER",
      mentalHealthScore: 0,
      latestCycleSentences: [
        {
          offense: "Possession of Stolen Property",
          sentenceLengthYears: 3,
          sentenceLengthMonths: 0,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Parenting",
          status: "COMPLETED",
          completionDate: "2025-06-20",
        },
      ],
      priorCycleSentences: [
        { offense: "Shoplifting", offenseDate: "2010-10-10" },
      ],
    },
  },
  {
    allEligibleOpportunities: ["usMoWorkRelease", "usMoOutsideClearance"],
    stateCode: "US_MO",
    personExternalId: "RES019",
    displayId: "dRES019",
    personName: { givenNames: "Jordan", surname: "Matthews" },
    gender: "MALE",
    pseudonymizedId: "anonres019",
    facilityId: "FACILITY1",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [],
      numD1SanctionsPastYear: 0,
      solitaryAssignmentInfoPastYear: [
        { startDate: "2025-03-15", endDate: "2025-03-18" },
      ],
      numSolitaryAssignmentsPastYear: 1,
      medicalScore: 1,
      publicRiskScore: 2,
      maximumReleaseDate: "2027-02-01",
      conditionalReleaseDate: "2026-04-15",
      presumptiveParoleDate: "2026-01-10",
      institutionalRiskScore: 2,
      educationScore: 3,
      gangAffiliation: "NON-STG MEMBER",
      mentalHealthScore: 1,
      latestCycleSentences: [
        {
          offense: "Nonviolent Drug Offense",
          sentenceLengthYears: 5,
          sentenceLengthMonths: 0,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Cognitive Skills",
          status: "COMPLETED",
          completionDate: "2025-05-22",
        },
        {
          program: "Job Readiness",
          status: "COMPLETED",
          completionDate: "2025-06-12",
        },
      ],
      priorCycleSentences: [
        { offense: "Possession", offenseDate: "2018-02-14" },
      ],
    },
  },
  {
    allEligibleOpportunities: ["usMoWorkRelease", "usMoOutsideClearance"],
    stateCode: "US_MO",
    personExternalId: "RES020",
    displayId: "dRES020",
    personName: { givenNames: "Priya", surname: "Nair" },
    gender: "FEMALE",
    pseudonymizedId: "anonres020",
    facilityId: "FACILITY1",
    unitId: "UNIT B",
    custodyLevel: "MINIMUM",
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [
        {
          sanctionCode: "D1-02",
          sanctionId: 20020,
          sanctionStartDate: "2024-09-01",
          sanctionExpirationDate: "2024-10-01",
        },
      ],
      numD1SanctionsPastYear: 1,
      solitaryAssignmentInfoPastYear: [],
      numSolitaryAssignmentsPastYear: 0,
      medicalScore: 0,
      publicRiskScore: 1,
      maximumReleaseDate: "2026-09-30",
      conditionalReleaseDate: "2025-11-15",
      presumptiveParoleDate: null,
      institutionalRiskScore: 1,
      educationScore: 4,
      gangAffiliation: "NON-STG MEMBER",
      mentalHealthScore: 0,
      latestCycleSentences: [
        {
          offense: "Property Damage",
          sentenceLengthYears: 3,
          sentenceLengthMonths: 0,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Life Skills",
          status: "COMPLETED",
          completionDate: "2025-04-02",
        },
      ],
      priorCycleSentences: [
        { offense: "Shoplifting", offenseDate: "2017-07-07" },
      ],
    },
  },
  {
    allEligibleOpportunities: ["usMoOutsideClearance"],
    stateCode: "US_MO",
    personExternalId: "RES021",
    displayId: "dRES021",
    personName: { givenNames: "Marcus", surname: "Lee" },
    gender: "MALE",
    pseudonymizedId: "anonres021",
    facilityId: "FACILITY2",
    unitId: "UNIT C",
    custodyLevel: "MINIMUM",
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [],
      numD1SanctionsPastYear: 0,
      solitaryAssignmentInfoPastYear: [
        { startDate: "2024-11-11", endDate: "2024-11-14" },
      ],
      numSolitaryAssignmentsPastYear: 1,
      medicalScore: 1,
      publicRiskScore: 2,
      maximumReleaseDate: "2027-06-18",
      conditionalReleaseDate: "2026-02-20",
      presumptiveParoleDate: null,
      institutionalRiskScore: 2,
      educationScore: 2,
      gangAffiliation: "NON-STG MEMBER",
      mentalHealthScore: 1,
      latestCycleSentences: [
        {
          offense: "Nonviolent Theft",
          sentenceLengthYears: 4,
          sentenceLengthMonths: 0,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Victim Impact",
          status: "COMPLETED",
          completionDate: "2025-05-08",
        },
      ],
      priorCycleSentences: [
        { offense: "Petit Larceny", offenseDate: "2016-03-03" },
      ],
    },
  },
  {
    allEligibleOpportunities: ["usMoOutsideClearance"],
    stateCode: "US_MO",
    personExternalId: "RES022",
    displayId: "dRES022",
    personName: { givenNames: "Tanya", surname: "Ortiz" },
    gender: "FEMALE",
    pseudonymizedId: "anonres022",
    facilityId: "FACILITY2",
    unitId: "UNIT D",
    custodyLevel: "MINIMUM",
    metadata: {
      stateCode: "US_MO",
      d1SanctionInfoPastYear: [
        {
          sanctionCode: "D1-01",
          sanctionId: 22022,
          sanctionStartDate: "2025-01-20",
          sanctionExpirationDate: "2025-02-20",
        },
      ],
      numD1SanctionsPastYear: 1,
      solitaryAssignmentInfoPastYear: [],
      numSolitaryAssignmentsPastYear: 0,
      medicalScore: 0,
      publicRiskScore: 1,
      maximumReleaseDate: "2026-07-07",
      conditionalReleaseDate: "2025-12-01",
      presumptiveParoleDate: null,
      institutionalRiskScore: 1,
      educationScore: 3,
      gangAffiliation: "NON-STG MEMBER",
      mentalHealthScore: 0,
      latestCycleSentences: [
        {
          offense: "Fraud",
          sentenceLengthYears: 3,
          sentenceLengthMonths: 0,
          sentenceLengthDays: 0,
        },
      ],
      latestCycleCompletedPrograms: [
        {
          program: "Financial Literacy",
          status: "COMPLETED",
          completionDate: "2025-06-01",
        },
      ],
      priorCycleSentences: [{ offense: "Forgery", offenseDate: "2015-09-09" }],
    },
  },
];
