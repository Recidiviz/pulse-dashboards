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

export const US_CA_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "Peter",
      surname: "Green",
      middleNames: "Jr",
    },
    personExternalId: "001",
    displayId: "d001",
    pseudonymizedId: "p001",
    stateCode: "US_CA",
    officerId: "OFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    supervisionStartDate: "2022-01-01",
    expirationDate: "2024-12-31",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-04",
    allEligibleOpportunities: [],
    currentEmployers: [
      {
        name: "Tire store",
      },
    ],
    milestones: [
      {
        text: "6-months violation free",
        type: "NO_VIOLATION_WITHIN_6_MONTHS",
      },
      {
        text: "Sustainable housing for 1-year",
        type: "HOUSING_TYPE_IS_NOT_TRANSIENT",
      },
    ],
  },
  {
    personName: {
      givenNames: "Keith",
      surname: "Garcia",
      middleNames: "Jr",
    },
    personExternalId: "002",
    displayId: "d002",
    pseudonymizedId: "p002",
    stateCode: "US_CA",
    officerId: "OFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    supervisionStartDate: "2022-01-01",
    expirationDate: "2024-12-31",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-04",
    allEligibleOpportunities: [],
    currentEmployers: [
      {
        name: "Tire store",
      },
    ],
    milestones: [
      {
        text: "6-months violation free",
        type: "NO_VIOLATION_WITHIN_6_MONTHS",
      },
      {
        text: "Sustainable housing for 1-year",
        type: "HOUSING_TYPE_IS_NOT_TRANSIENT",
      },
    ],
  },
  {
    personName: {
      givenNames: "Mary",
      surname: "Davis",
    },
    personExternalId: "003",
    displayId: "d003",
    pseudonymizedId: "p003",
    stateCode: "US_CA",
    officerId: "OFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    supervisionStartDate: "2022-01-01",
    expirationDate: "2024-12-31",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-04",
    allEligibleOpportunities: [],
    currentEmployers: [
      {
        name: "Tire store",
      },
    ],
    milestones: [],
  },
  {
    personName: {
      givenNames: "Jonathan",
      surname: "Mitchell",
    },
    personExternalId: "005",
    displayId: "d005",
    pseudonymizedId: "p005",
    stateCode: "US_CA",
    officerId: "OFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "HIGH",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    supervisionStartDate: "2022-01-01",
    expirationDate: "2024-12-31",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-04",
    allEligibleOpportunities: ["usCaSupervisionLevelDowngrade"],
    currentEmployers: [
      {
        name: "Tire store",
      },
    ],
    milestones: [
      {
        text: "6-months violation free",
        type: "NO_VIOLATION_WITHIN_6_MONTHS",
      },
      {
        text: "Sustainable housing for 1-year",
        type: "HOUSING_TYPE_IS_NOT_TRANSIENT",
      },
    ],
  },
  {
    personName: {
      givenNames: "Kyle",
      surname: "Journey",
      middleNames: "W.",
    },
    personExternalId: "006",
    displayId: "d006",
    pseudonymizedId: "p006",
    stateCode: "US_CA",
    officerId: "OFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "HIGH",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    supervisionStartDate: "2022-01-01",
    expirationDate: "2024-12-31",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-04",
    allEligibleOpportunities: ["usCaSupervisionLevelDowngrade"],
    currentEmployers: [
      {
        name: "Tire store",
      },
    ],
    milestones: [
      {
        text: "6-months violation free",
        type: "NO_VIOLATION_WITHIN_6_MONTHS",
      },
      {
        text: "Sustainable housing for 1-year",
        type: "HOUSING_TYPE_IS_NOT_TRANSIENT",
      },
      {
        text: "Employed for 6+ months",
        type: "EMPLOYED_6_MONTHS",
      },
    ],
  },
  {
    personName: {
      givenNames: "Oliver",
      surname: "Baker",
    },
    personExternalId: "007",
    displayId: "d007",
    pseudonymizedId: "p007",
    stateCode: "US_CA",
    officerId: "OFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    supervisionStartDate: "2022-01-01",
    expirationDate: "2024-12-31",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-04",
    allEligibleOpportunities: [],
    currentEmployers: [
      {
        name: "Tire store",
      },
    ],
    milestones: [
      {
        text: "6-months violation free",
        type: "NO_VIOLATION_WITHIN_6_MONTHS",
      },
      {
        text: "Sustainable housing for 1-year",
        type: "HOUSING_TYPE_IS_NOT_TRANSIENT",
      },
    ],
  },
];
