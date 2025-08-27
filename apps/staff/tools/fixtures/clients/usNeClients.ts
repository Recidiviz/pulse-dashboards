// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { ClientFixture } from "../clients";

export const US_NE_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "Maria",
      surname: "Gonzalez",
      middleNames: "Elena",
    },
    personExternalId: "NE001",
    displayId: "12345",
    pseudonymizedId: "p001",
    stateCode: "US_NE",
    officerId: "NEOFFICER1",
    district: "DISTRICT 1",
    caseType: "GENERAL",
    caseTypeRawText: "GENERAL",
    supervisionType: "PAROLE",
    supervisionLevel: "MINIMUM",
    supervisionLevelStart: "2022-01-15",
    address: "123 Cornhusker Ave, Omaha, NE",
    currentPhysicalResidenceAddressStructured: {
      addressLine1: "123 Cornhusker Ave",
      addressCity: "Omaha",
      addressState: "NE",
      addressZip: "68102",
      addressCountry: "US",
    },
    phoneNumber: "4025551234",
    supervisionStartDate: "2021-06-01",
    expirationDate: "2025-06-01",
    currentBalance: 450.0,
    lastPaymentAmount: 75.0,
    lastPaymentDate: "2024-12-01",
    emailAddress: "maria.gonzalez@example.com",
    currentEmployers: [
      {
        name: "Nebraska Medical Center",
        address: "456 Fake Business Blvd, Fake Town, NE",
      },
    ],
    specialConditions: [
      "Complete substance abuse treatment program",
      "Maintain employment or education",
    ],
    milestones: [
      {
        text: "18 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
      {
        text: "12 months without violation",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
    ],
    allEligibleOpportunities: ["usNeConditionalLowRiskOverride"],
    metadata: {
      stateCode: "US_NE",
      lastFourOrasScores: [
        {
          assessmentDate: "2024-01-15",
          assessmentLevel: "LOW",
        },
        {
          assessmentDate: "2023-07-15",
          assessmentLevel: "MODERATE",
        },
      ],
      specialConditions: [
        {
          specialConditionType: "Substance Abuse Treatment",
          compliance: "Compliant",
        },
        {
          specialConditionType: "Employment Requirement",
          compliance: "Compliant",
        },
      ],
      paroleEarnedDischargeDate: "2025-06-01",
    },
  },
  {
    personName: {
      givenNames: "David",
      surname: "Thompson",
    },
    personExternalId: "NE002",
    displayId: "12346",
    pseudonymizedId: "p002",
    stateCode: "US_NE",
    officerId: "NEOFFICER1",
    district: "DISTRICT 1",
    caseType: "GENERAL",
    caseTypeRawText: "GENERAL",
    supervisionType: "PAROLE",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2022-03-10",
    address: "456 Prairie View Dr, Lincoln, NE",
    currentPhysicalResidenceAddressStructured: {
      addressLine1: "456 Prairie View Dr",
      addressCity: "Lincoln",
      addressState: "NE",
      addressZip: "68508",
      addressCountry: "US",
    },
    phoneNumber: "4025555678",
    supervisionStartDate: "2021-09-15",
    expirationDate: "2025-09-15",
    currentBalance: 0,
    lastPaymentAmount: 125.0,
    lastPaymentDate: "2024-11-15",
    emailAddress: "d.thompson@example.com",
    currentEmployers: [
      {
        name: "Lincoln Electric System",
        address: "111 Dummy Drive, Mock City, NE",
      },
      {
        name: "Weekend Auto Repair",
        address: "222 Pretend Place, Mock City, NE",
      },
    ],
    specialConditions: [
      "No contact with co-defendants",
      "Community service: 40 hours completed of 80 required",
    ],
    milestones: [
      {
        text: "15 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
      {
        text: "8 months with current employer",
        type: "MONTHS_WITH_CURRENT_EMPLOYER",
      },
    ],
    allEligibleOpportunities: ["usNeOverrideModerateToLow"],
    metadata: {
      stateCode: "US_NE",
      lastFourOrasScores: [
        {
          assessmentDate: "2024-02-10",
          assessmentLevel: "MODERATE",
        },
        {
          assessmentDate: "2023-08-10",
          assessmentLevel: "HIGH",
        },
        {
          assessmentDate: "2023-02-10",
          assessmentLevel: "MODERATE",
        },
      ],
      specialConditions: [
        {
          specialConditionType: "No Contact Order",
          compliance: "Compliant",
        },
        {
          specialConditionType: "Community Service",
          compliance: "Partially Compliant",
        },
      ],
      paroleEarnedDischargeDate: "2025-09-15",
    },
  },
  {
    personName: {
      givenNames: "Jennifer",
      surname: "Williams",
      middleNames: "Marie",
    },
    personExternalId: "NE003",
    displayId: "12347",
    pseudonymizedId: "p003",
    stateCode: "US_NE",
    officerId: "NEOFFICER1",
    district: "DISTRICT 1",
    caseType: "INTENSIVE",
    caseTypeRawText: "INTENSIVE",
    supervisionType: "PAROLE",
    supervisionLevel: "MINIMUM",
    supervisionLevelStart: "2021-12-01",
    address: "789 Meadowlark Ln, Grand Island, NE",
    currentPhysicalResidenceAddressStructured: {
      addressLine1: "789 Meadowlark Ln",
      addressCity: "Grand Island",
      addressState: "NE",
      addressZip: "68801",
      addressCountry: "US",
    },
    phoneNumber: "4025559876",
    supervisionStartDate: "2020-08-01",
    expirationDate: "2024-08-01",
    currentBalance: 225.5,
    lastPaymentAmount: 50.0,
    lastPaymentDate: "2024-12-10",
    currentEmployers: [
      {
        name: "Central Nebraska Community College",
        address: "333 Test Lane, Sample Town, NE",
      },
    ],
    specialConditions: ["Attend mental health counseling as directed"],
    milestones: [
      {
        text: "40 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
      {
        text: "24 months without violation",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "Birthday this month (January 14)",
        type: "BIRTHDAY_THIS_MONTH",
      },
    ],
    allEligibleOpportunities: ["usNeConditionalLowRiskOverride"],
    metadata: {
      stateCode: "US_NE",
      lastFourOrasScores: [
        {
          assessmentDate: "2024-03-01",
          assessmentLevel: "LOW",
        },
        {
          assessmentDate: "2023-09-01",
          assessmentLevel: "LOW",
        },
        {
          assessmentDate: "2023-03-01",
          assessmentLevel: "MODERATE",
        },
        {
          assessmentDate: "2022-09-01",
          assessmentLevel: "HIGH",
        },
      ],
      specialConditions: [
        {
          specialConditionType: "Mental Health Counseling",
          compliance: "Compliant",
        },
      ],
      paroleEarnedDischargeDate: "2024-08-01",
    },
  },
  {
    personName: {
      givenNames: "Robert",
      surname: "Johnson",
    },
    personExternalId: "NE004",
    displayId: "12348",
    pseudonymizedId: "p004",
    stateCode: "US_NE",
    officerId: "NEOFFICER1",
    district: "DISTRICT 1",
    caseType: "GENERAL",
    caseTypeRawText: "GENERAL",
    supervisionType: "PAROLE",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2022-02-28",
    address: "321 Sandhills Rd, North Platte, NE",
    currentPhysicalResidenceAddressStructured: {
      addressLine1: "321 Sandhills Rd",
      addressCity: "North Platte",
      addressState: "NE",
      addressZip: "69101",
      addressCountry: "US",
    },
    phoneNumber: "4025554321",
    supervisionStartDate: "2021-07-01",
    expirationDate: "2025-07-01",
    currentBalance: 800.0,
    lastPaymentAmount: 100.0,
    lastPaymentDate: "2024-11-30",
    emailAddress: "rjohnson@example.com",
    currentEmployers: [
      {
        name: "Union Pacific Railroad",
        address: "555 Example Expressway, Demo City, NE",
      },
    ],
    specialConditions: [
      "Submit to random drug testing",
      "Maintain stable residence",
      "Anger management counseling completed",
    ],
    milestones: [
      {
        text: "17 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
      {
        text: "6 months without violation",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
    ],
    allEligibleOpportunities: ["usNeOverrideModerateToLow"],
    metadata: {
      stateCode: "US_NE",
      lastFourOrasScores: [
        {
          assessmentDate: "2024-01-28",
          assessmentLevel: "MODERATE",
        },
        {
          assessmentDate: "2023-07-28",
          assessmentLevel: "HIGH",
        },
        {
          assessmentDate: "2023-01-28",
          assessmentLevel: "HIGH",
        },
      ],
      specialConditions: [
        {
          specialConditionType: "Drug Testing",
          compliance: "Compliant",
        },
        {
          specialConditionType: "Residence Requirement",
          compliance: "Compliant",
        },
        {
          specialConditionType: "Anger Management",
          compliance: "Compliant",
        },
      ],
      paroleEarnedDischargeDate: "2025-07-01",
    },
  },
  {
    personName: {
      givenNames: "Sarah",
      surname: "Davis",
    },
    personExternalId: "NE005",
    displayId: "12349",
    pseudonymizedId: "p005",
    stateCode: "US_NE",
    officerId: "NEOFFICER1",
    district: "DISTRICT 1",
    caseType: "GENERAL",
    caseTypeRawText: "GENERAL",
    supervisionType: "PAROLE",
    supervisionLevel: "MINIMUM",
    supervisionLevelStart: "2021-11-15",
    address: "654 Pioneer Trail, Kearney, NE",
    currentPhysicalResidenceAddressStructured: {
      addressLine1: "654 Pioneer Trail",
      addressCity: "Kearney",
      addressState: "NE",
      addressZip: "68845",
      addressCountry: "US",
    },
    phoneNumber: "4025558765",
    supervisionStartDate: "2020-05-15",
    expirationDate: "2024-05-15",
    currentBalance: 0,
    lastPaymentAmount: 200.0,
    lastPaymentDate: "2024-08-15",
    emailAddress: "sarah.davis@example.com",
    currentEmployers: [
      {
        name: "Great Plains Health",
        address: "888 Dummy Lane, Test Village, NE"
      },
    ],
    milestones: [
      {
        text: "44 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
      {
        text: "36 months without violation",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "22 months with current employer",
        type: "MONTHS_WITH_CURRENT_EMPLOYER",
      },
    ],
    allEligibleOpportunities: ["usNeConditionalLowRiskOverride"],
    metadata: {
      stateCode: "US_NE",
      lastFourOrasScores: [
        {
          assessmentDate: "2024-05-15",
          assessmentLevel: "LOW",
        },
        {
          assessmentDate: "2023-11-15",
          assessmentLevel: "LOW",
        },
        {
          assessmentDate: "2023-05-15",
          assessmentLevel: "MODERATE",
        },
      ],
      specialConditions: [],
      paroleEarnedDischargeDate: "2024-05-20",
    },
  },
];
