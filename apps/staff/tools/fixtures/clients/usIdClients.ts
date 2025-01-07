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

export const US_ID_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "Casey",
      surname: "Martinez",
      middleNames: "Jane",
    },
    personExternalId: "001",
    displayId: "d001",
    pseudonymizedId: "p001",
    stateCode: "US_ID",
    officerId: "OFFICER4",
    district: "DISTRICT 1",
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
    allEligibleOpportunities: [
      "LSU",
      "earnedDischarge",
      "usIdSupervisionLevelDowngrade",
    ],
    currentEmployers: [
      {
        name: "Tire store",
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
  },
  {
    personName: {
      givenNames: "Larry",
      surname: "Green",
      middleNames: "Jeremy",
    },
    personExternalId: "002",
    displayId: "d002",
    pseudonymizedId: "p002",
    stateCode: "US_ID",
    officerId: "OFFICER4",
    district: "DISTRICT 1",
    supervisionType: "PROBATION",
    supervisionLevel: "MINIMUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    supervisionStartDate: "2020-07-11",
    expirationDate: "2022-07-10",
    currentBalance: 0,
    lastPaymentAmount: 17.84,
    lastPaymentDate: "2022-01-04",
    allEligibleOpportunities: ["pastFTRD", "earnedDischarge"],
    currentEmployers: [
      {
        name: "The Makerspace",
        address: "456 Tinker Trail",
      },
    ],
    milestones: [
      {
        text: "42 months since last violation",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "43 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
    emailAddress: "larry@example.com",
  },
  {
    personName: {
      givenNames: "Sylvester",
      surname: "Allen",
    },
    personExternalId: "003",
    displayId: "d003",
    pseudonymizedId: "p003",
    stateCode: "US_ID",
    officerId: "OFFICER4",
    district: "DISTRICT 1",
    supervisionType: "PAROLE",
    supervisionLevel: "HIGH",
    supervisionLevelStart: "2021-02-02",
    address: "77 Limestone Lane",
    phoneNumber: "5555555678",
    supervisionStartDate: "2021-07-11",
    expirationDate: "2025-06-09",
    currentBalance: 0,
    lastPaymentAmount: 17.84,
    lastPaymentDate: "2022-10-04",
    allEligibleOpportunities: [
      "usIdSupervisionLevelDowngrade",
      "LSU",
      "earnedDischarge",
    ],
    currentEmployers: [
      {
        name: "Cameraworks",
        address: "456 Jessup Lane",
      },
    ],
    milestones: [
      {
        text: "23 months since last violation",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "43 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
    emailAddress: "sylvester@example.com",
  },
  {
    personName: {
      givenNames: "Francine",
      surname: "Adams",
    },
    personExternalId: "005",
    displayId: "d005",
    pseudonymizedId: "p005",
    stateCode: "US_ID",
    officerId: "OFFICER6",
    district: "DISTRICT 1",
    supervisionType: "PAROLE",
    supervisionLevel: "HIGH",
    supervisionLevelStart: "2021-02-02",
    address: "77 Limestone Lane",
    phoneNumber: "5555555678",
    supervisionStartDate: "2021-07-11",
    expirationDate: "2025-06-09",
    currentBalance: 0,
    lastPaymentAmount: 17.84,
    lastPaymentDate: "2022-10-04",
    allEligibleOpportunities: ["LSU"],
    currentEmployers: [
      {
        name: "Blue Bean Coffee",
        address: "456 Dark Roast Way",
      },
    ],
    milestones: [
      {
        text: "16 months since last violation",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "30 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
    emailAddress: "fran@example.com",
  },
  {
    personName: {
      givenNames: "Jessica",
      surname: "Rivera",
    },
    personExternalId: "006",
    displayId: "d006",
    pseudonymizedId: "p006",
    stateCode: "US_ID",
    officerId: "OFFICER6",
    district: "DISTRICT 1",
    supervisionType: "PAROLE",
    supervisionLevel: "HIGH",
    supervisionLevelStart: "2021-02-02",
    address: "77 Limestone Lane",
    phoneNumber: "5555555678",
    supervisionStartDate: "2021-07-11",
    expirationDate: "2025-06-09",
    currentBalance: 0,
    lastPaymentAmount: 17.84,
    lastPaymentDate: "2022-10-04",
    allEligibleOpportunities: ["LSU"],
    currentEmployers: [
      {
        name: "NARA CORP.",
        address: "456 Windsor St",
      },
    ],
    milestones: [
      {
        text: "50 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
    emailAddress: "jessica@example.com",
  },
  {
    personName: {
      givenNames: "Candy",
      surname: "Rain",
    },
    personExternalId: "004",
    displayId: "d004",
    pseudonymizedId: "p004",
    stateCode: "US_ID",
    officerId: "OFFICER6",
    district: "DISTRICT 1",
    supervisionType: "PAROLE",
    supervisionLevel: "HIGH",
    supervisionLevelStart: "2021-02-02",
    address: "77 Limestone Lane",
    phoneNumber: "5555555678",
    supervisionStartDate: "2021-07-11",
    expirationDate: "2025-06-09",
    currentBalance: 0,
    lastPaymentAmount: 17.84,
    lastPaymentDate: "2022-10-04",
    allEligibleOpportunities: ["earnedDischarge"],
    currentEmployers: [
      {
        name: "The Penny Ice Cream Store",
        address: "456 Sweets Dr",
      },
    ],
    milestones: [
      {
        text: "Birthday this month (February 18)",
        type: "BIRTHDAY_THIS_MONTH",
      },
      {
        text: "18 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
    emailAddress: "candy@example.com",
  },
  {
    personName: {
      givenNames: "Carolyn",
      surname: "Scott",
    },
    personExternalId: "007",
    displayId: "d007",
    pseudonymizedId: "p007",
    stateCode: "US_ID",
    officerId: "OFFICER6",
    district: "DISTRICT 1",
    supervisionType: "PAROLE",
    supervisionLevel: "HIGH",
    supervisionLevelStart: "2021-02-02",
    address: "77 Limestone Lane",
    phoneNumber: "5555555678",
    supervisionStartDate: "2021-07-11",
    expirationDate: "2025-06-09",
    currentBalance: 0,
    lastPaymentAmount: 17.84,
    lastPaymentDate: "2022-10-04",
    allEligibleOpportunities: ["earnedDischarge"],
    currentEmployers: [
      {
        name: "Software R Us",
      },
      {
        name: "AI Poems",
        address: "456 WeWrite Way",
      },
    ],
    milestones: [
      {
        text: "Birthday this month (February 23)",
        type: "BIRTHDAY_THIS_MONTH",
      },
      {
        text: "44 months with the same employer",
        type: "MONTHS_WITH_CURRENT_EMPLOYER",
      },
    ],
  },
  {
    personName: {
      givenNames: "Larry",
      surname: "Roberts",
    },
    personExternalId: "008",
    displayId: "d008",
    pseudonymizedId: "p008",
    stateCode: "US_ID",
    officerId: "OFFICER6",
    district: "DISTRICT 1",
    supervisionType: "DUAL",
    supervisionLevel: "HIGH",
    supervisionLevelStart: "2021-02-02",
    address: "77 Limestone Lane",
    phoneNumber: "5555555678",
    supervisionStartDate: "2021-07-11",
    expirationDate: "2025-06-09",
    currentBalance: 0,
    lastPaymentAmount: 17.84,
    lastPaymentDate: "2022-10-04",
    allEligibleOpportunities: ["earnedDischarge"],
    currentEmployers: [
      {
        name: "ABC Inc.",
        address: "493 ABC St",
      },
    ],
    emailAddress: "larry@example.com",
  },
  {
    personName: {
      givenNames: "Alfred",
      surname: "Hill",
    },
    personExternalId: "010",
    displayId: "d010",
    pseudonymizedId: "p010",
    stateCode: "US_ID",
    officerId: "OFFICER4",
    district: "DISTRICT 1",
    supervisionType: "PROBATION",
    supervisionLevel: "MINIMUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    supervisionStartDate: "2020-01-11",
    expirationDate: "2025-06-09",
    currentBalance: 0,
    lastPaymentAmount: 1939,
    lastPaymentDate: "2022-01-04",
    allEligibleOpportunities: ["pastFTRD"],
    currentEmployers: [
      {
        name: "Sports and Drive Warehouse",
        address: "1007 Mountain Drive, Utah",
      },
    ],
    milestones: [
      {
        text: "42 months since last violation",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "43 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
    emailAddress: "alfred@example.com",
  },
];
