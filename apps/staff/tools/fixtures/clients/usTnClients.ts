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

export const US_TN_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "Tonye",
      surname: "Barley",
    },
    personExternalId: "100",
    displayId: "d100",
    pseudonymizedId: "p100",
    stateCode: "US_TN",
    officerId: "OFFICER1",
    district: "DISTRICT 50",
    supervisionType: "TN PAROLEE",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2021-10-26",
    address: "123 Main St, Nashville, TN 12345",
    phoneNumber: "5555555678",
    expirationDate: "2025-12-31",
    currentBalance: 0,
    lastPaymentAmount: 50,
    lastPaymentDate: "2021-11-15",
    specialConditions: [
      "OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS",
    ],
    allEligibleOpportunities: ["compliantReporting"],
    currentEmployers: [
      {
        name: "Tire store",
        address: "456 Blue Drive",
      },
    ],
    milestones: [
      {
        text: "Birthday this month (February 10)",
        type: "BIRTHDAY_THIS_MONTH",
      },
      {
        text: "4 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
    emailAddress: "tonye@example.com",
  },
  {
    personName: {
      givenNames: "Vivian",
      surname: "Hanskill",
    },
    personExternalId: "101",
    displayId: "d101",
    pseudonymizedId: "p101",
    stateCode: "US_TN",
    officerId: "OFFICER1",
    district: "DISTRICT 50",
    supervisionType: "TN PROBATIONER",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2019-12-20",
    address: "456 Broadway, Nashville, TN 12345",
    phoneNumber: "5555555678",
    supervisionStartDate: "2021-03-12",
    expirationDate: "2022-02-11",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-03",
    specialConditions: [
      "OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS",
    ],
    allEligibleOpportunities: ["compliantReporting", "usTnExpiration"],
    currentEmployers: [
      {
        name: "Photo Stop Photography Studio",
        address: "41048 Creekside Road",
      },
    ],
    milestones: [
      {
        text: "Birthday this month (February 10)",
        type: "BIRTHDAY_THIS_MONTH",
      },
      {
        text: "4 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
    emailAddress: "vivian@example.com",
  },
  {
    personName: {
      givenNames: "Rebekah",
      surname: "Kariner",
      middleNames: "H.",
    },
    personExternalId: "102",
    displayId: "d102",
    pseudonymizedId: "p102",
    stateCode: "US_TN",
    officerId: "OFFICER1",
    district: "DISTRICT 50",
    supervisionType: "TN PROBATIONER",
    supervisionLevel: "MAXIMUM",
    supervisionLevelStart: "2021-07-05",
    address: "999 Main St, Nashville, TN 12345",
    phoneNumber: "5555555678",
    supervisionStartDate: "2020-02-22",
    expirationDate: "2025-12-31",
    currentBalance: 0,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-03",
    specialConditions: [
      "OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS",
    ],
    allEligibleOpportunities: ["supervisionLevelDowngrade"],
    currentEmployers: [
      {
        name: "Ceramics R Us",
        address: "2948 Telegraph Road",
      },
    ],
    emailAddress: "rebekah@example.com",
  },
  {
    personName: {
      givenNames: "Jacob",
      surname: "Underwood",
    },
    personExternalId: "104",
    displayId: "d104",
    pseudonymizedId: "p104",
    stateCode: "US_TN",
    officerId: "OFFICER2",
    district: "DISTRICT 50",
    supervisionType: "DIVERSION",
    supervisionLevel: "STANDARD: MINIMUM",
    supervisionLevelStart: "2022-01-07",
    address: "999 Main St, Nashville, TN 12345",
    phoneNumber: "5555555678",
    expirationDate: "2025-12-31",
    currentBalance: 125.75,
    specialConditions: [
      "OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS",
    ],
    allEligibleOpportunities: ["compliantReporting"],
    currentEmployers: [
      {
        name: "The Noodle Store",
      },
    ],
    emailAddress: "jacob@example.com",
  },
  {
    personName: {
      givenNames: "Sarah",
      surname: "Velazquez",
      middleNames: "M",
    },
    personExternalId: "107",
    displayId: "d107",
    pseudonymizedId: "p107",
    stateCode: "US_TN",
    officerId: "OFFICER2",
    district: "DISTRICT 50",
    supervisionType: "DETERMINATE RLSE PROBATIONER",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2020-05-19",
    address: "999 Main St, Nashville, TN 12345",
    phoneNumber: "5555555678",
    expirationDate: "2025-12-31",
    currentBalance: 0,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-03",
    specialConditions: [
      "OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS",
    ],
    allEligibleOpportunities: [],
    emailAddress: "sarah@example.com",
  },
  {
    personName: {
      givenNames: "Jacqueline",
      surname: "Wright",
    },
    personExternalId: "109",
    displayId: "d109",
    pseudonymizedId: "p109",
    stateCode: "US_TN",
    officerId: "OFFICER2",
    district: "DISTRICT 50",
    supervisionType: "TN PAROLEE",
    supervisionLevel: "STANDARD: MINIMUM",
    supervisionLevelStart: "2021-02-11",
    address: "999 Main St, Nashville, TN 12345",
    phoneNumber: "5555555678",
    expirationDate: "2025-12-31",
    currentBalance: 0,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-03",
    specialConditions: [],
    allEligibleOpportunities: [],
    currentEmployers: [
      {
        name: "Tire store",
      },
    ],
    emailAddress: "jackie@example.com",
  },
  {
    personName: {
      givenNames: "Twila",
      surname: "Lowery",
      middleNames: "Natalie",
    },
    personExternalId: "108",
    displayId: "d108",
    pseudonymizedId: "p108",
    stateCode: "US_TN",
    officerId: "OFFICER1",
    district: "DISTRICT 50",
    supervisionType: "TN PROBATIONER",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2019-12-20",
    address: "456 Broadway, Nashville, TN 12345",
    phoneNumber: "5555555678",
    expirationDate: "2024-12-31",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-03",
    specialConditions: [
      "OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS",
    ],
    allEligibleOpportunities: [],
    currentEmployers: [
      {
        name: "Tire store",
        address: "492 White Lotus St",
      },
    ],
  },
  {
    personExternalId: "201",
    displayId: "d201",
    pseudonymizedId: "p201",
    stateCode: "US_TN",
    personName: {
      givenNames: "Harry",
      surname: "Amira",
    },
    officerId: "OFFICER1",
    currentBalance: 282,
    district: "DISTRICT X",
    supervisionType: "ISC",
    boardConditions: [],
    emailAddress: "harry@example.com",
    currentEmployers: [
      {
        name: "The Camera Store",
        address: "496 Fakers Ave",
      },
    ],
    allEligibleOpportunities: ["compliantReporting"],
  },
  {
    personExternalId: "202",
    displayId: "d202",
    pseudonymizedId: "p202",
    stateCode: "US_TN",
    personName: {
      givenNames: "Linda",
      surname: "Smith",
    },
    officerId: "OFFICER1",
    currentBalance: 700,
    lastPaymentAmount: 100,
    lastPaymentDate: "2022-01-03",
    district: "DISTRICT X",
    supervisionType: "ISC",
    boardConditions: [],
    emailAddress: "linda@example.com",
    allEligibleOpportunities: ["compliantReporting"],
  },
];
