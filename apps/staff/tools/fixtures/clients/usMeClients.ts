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

export const US_ME_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "Laura",
      surname: "Wilson",
    },
    personExternalId: "009",
    displayId: "d009",
    pseudonymizedId: "p009",
    stateCode: "US_ME",
    officerId: "OFFICER8",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: "2024-12-31",
    allEligibleOpportunities: ["usMeEarlyTermination"],
    supervisionStartDate: "2022-02-22",
    currentBalance: 0,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-03",
    specialConditions: [],
    boardConditions: [],
    currentEmployers: [
      {
        name: "Tire store",
        address: "456 Bedrock Lane",
      },
    ],
    milestones: [
      {
        text: "8 months without a violation",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "15 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
    emailAddress: "laura@example.com",
  },
  {
    personName: {
      givenNames: "Jennifer",
      surname: "Perez",
    },
    personExternalId: "010",
    displayId: "d010",
    pseudonymizedId: "p010",
    stateCode: "US_ME",
    officerId: "OFFICER8",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: "2024-12-31",
    allEligibleOpportunities: ["usMeEarlyTermination"],
    supervisionStartDate: "2020-02-22",
    currentBalance: 0,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-03",
    specialConditions: [],
    boardConditions: [],
    currentEmployers: [
      {
        name: "Tire store",
        address: "456 Bedrock Lane",
      },
    ],
    milestones: [
      {
        text: "8 months without a violation",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "15 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
    emailAddress: "jlo@example.com",
  },
  {
    personName: {
      givenNames: "Mariah",
      surname: "Wright",
    },
    personExternalId: "011",
    displayId: "d011",
    pseudonymizedId: "p011",
    stateCode: "US_ME",
    officerId: "OFFICER8",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: "2024-12-31",
    allEligibleOpportunities: ["usMeEarlyTermination"],
    supervisionStartDate: "2020-02-22",
    currentBalance: 0,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-03",
    specialConditions: [],
    boardConditions: [],
    currentEmployers: [
      {
        name: "Tire store",
        address: "456 Bedrock Lane",
      },
    ],
    milestones: [
      {
        text: "8 months without a violation",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "15 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
    emailAddress: "mc@example.com",
  },
  {
    personName: {
      givenNames: "Dale",
      surname: "Moore",
    },
    personExternalId: "012",
    displayId: "d012",
    pseudonymizedId: "p012",
    stateCode: "US_ME",
    officerId: "OFFICER8",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: "2024-12-31",
    allEligibleOpportunities: ["usMeEarlyTermination"],
    supervisionStartDate: "2022-02-22",
    currentBalance: 0,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2023-01-03",
    specialConditions: [],
    boardConditions: [],
    currentEmployers: [
      {
        name: "Tire store",
        address: "456 Bedrock Lane",
      },
    ],
    milestones: [
      {
        text: "8 months without a violation",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "15 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
    emailAddress: "cooper@example.com",
  },
];
