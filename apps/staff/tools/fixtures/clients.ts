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

import { ClientRecord } from "../../src/FirestoreStore";
import { FirestoreFixture, PersonFixture } from "./utils";

type ClientFixture = PersonFixture<ClientRecord>;

const US_CA_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "PETER",
      surname: "GREEN",
      middleNames: "JR",
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
      givenNames: "KEITH",
      surname: "GARCIA",
      middleNames: "JR",
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
      givenNames: "MARY",
      surname: "DAVIS",
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
      givenNames: "JONATHAN",
      surname: "MITCHELL",
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
      givenNames: "KYLE",
      surname: "JOURNEY",
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
      givenNames: "OLIVER",
      surname: "BAKER",
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

const US_ID_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "CASEY",
      surname: "MARTINEZ",
      middleNames: "JANE",
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
      givenNames: "LARRY",
      surname: "GREEN",
      middleNames: "JEREMY",
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
    emailAddress: "dino@makerspace.net",
  },
  {
    personName: {
      givenNames: "SYLVESTER",
      surname: "ALLEN",
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
    emailAddress: "sylvester@cameraworks.net",
  },
  {
    personName: {
      givenNames: "FRANCINE",
      surname: "ADAMS",
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
    emailAddress: "fran@bluebeancoffee.net",
  },
  {
    personName: {
      givenNames: "JESSICA",
      surname: "RIVERA",
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
    emailAddress: "jessica@nara-corp.net",
  },
  {
    personName: {
      givenNames: "CANDY",
      surname: "RAIN",
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
    emailAddress: "candy@rain.net",
  },
  {
    personName: {
      givenNames: "CAROLYN",
      surname: "SCOTT",
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
      givenNames: "LARRY",
      surname: "ROBERTS",
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
    emailAddress: "larry@david.net",
  },
  {
    personName: {
      givenNames: "ALFRED",
      surname: "HILL",
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
    emailAddress: "alfred@sportsanddrive.net",
  },
];

const US_ME_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "LAURA",
      surname: "WILSON",
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
      givenNames: "JENNIFER",
      surname: "PEREZ",
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
      givenNames: "MARIAH",
      surname: "WRIGHT",
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
      givenNames: "DALE",
      surname: "MOORE",
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

const US_MI_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "PATRICK",
      surname: "KING",
    },
    personExternalId: "001",
    displayId: "d001",
    pseudonymizedId: "p001",
    stateCode: "US_MI",
    officerId: "OFFICER8",
    supervisionType: "PROBATION",
    supervisionLevel: "MAXIMUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: "2024-12-31",
    allEligibleOpportunities: ["usMiSupervisionLevelDowngrade"],
  },
  {
    personName: {
      givenNames: "EUGENE",
      surname: "ANDERSON",
    },
    personExternalId: "cr-eligible-1",
    displayId: "dcr-eligible-1",
    pseudonymizedId: "pseudo-cr-eligible-1",
    stateCode: "US_MI",
    officerId: "OFFICER8",
    supervisionType: "PROBATIONER",
    supervisionLevel: "MAXIMUM",
    supervisionLevelStart: "2019-12-20",
    currentBalance: 221.88,
    specialConditions: [],
    allEligibleOpportunities: ["usMiClassificationReview"],
  },
  {
    personName: {
      givenNames: "SAMANTHA",
      surname: "HERNANDEZ",
    },
    personExternalId: "cr-eligible-2",
    displayId: "dcr-eligible-2",
    pseudonymizedId: "pseudo-cr-eligible-2",
    stateCode: "US_MI",
    officerId: "OFFICER8",
    supervisionType: "PROBATIONER",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2021-07-02",
    currentBalance: 18.34,
    specialConditions: [],
    allEligibleOpportunities: ["usMiClassificationReview"],
  },
  {
    personName: {
      givenNames: "AARON",
      surname: "KING",
    },
    personExternalId: "ed-eligible-1",
    displayId: "ded-eligible-1",
    pseudonymizedId: "pseudo-ed-eligible-1",
    stateCode: "US_MI",
    officerId: "OFFICER8",
    supervisionType: "PAROLE",
    supervisionLevel: "HIGH",
    supervisionLevelStart: "2019-12-20",
    currentBalance: 221.88,
    specialConditions: [],
    allEligibleOpportunities: ["usMiEarlyDischarge"],
  },
  {
    personName: {
      givenNames: "NATHANIEL",
      surname: "SACKMAN",
    },
    personExternalId: "ed-eligible-2",
    displayId: "ded-eligible-2",
    pseudonymizedId: "pseudo-ed-eligible-2",
    stateCode: "US_MI",
    officerId: "OFFICER8",
    supervisionType: "PROBATION",
    supervisionLevel: "HIGH",
    supervisionLevelStart: "2019-12-20",
    currentBalance: 221.88,
    specialConditions: [],
    allEligibleOpportunities: ["usMiEarlyDischarge"],
  },
  {
    personName: {
      givenNames: "FAUSTO",
      surname: "CARTER",
    },
    personExternalId: "010",
    displayId: "d010",
    pseudonymizedId: "p010",
    stateCode: "US_MI",
    officerId: "OFFICER8",
    supervisionType: "PROBATION",
    supervisionLevel: "HIGH",
    supervisionLevelStart: "2019-12-20",
    currentBalance: 221.88,
    specialConditions: [],
    allEligibleOpportunities: ["usMiMinimumTelephoneReporting", "usMiPastFTRD"],
  },
];

const US_ND_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "JAMILYN",
      surname: "JONES",
      middleNames: "JANE",
    },
    personExternalId: "110",
    displayId: "d110",
    pseudonymizedId: "p110",
    stateCode: "US_ND",
    officerId: "OFFICER3",
    district: "DISTRICT 1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: "2024-12-31",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-03",
    specialConditions: [
      "OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS",
    ],
    allEligibleOpportunities: ["earlyTermination"],
    currentEmployers: [
      {
        name: "Film Production South",
        address: "456 Skywalker Lane",
      },
      {
        name: "Film Production East",
        address: "456 Solo Drive",
      },
    ],
  },
  {
    personName: {
      givenNames: "JUSTIN",
      surname: "JACOBS",
      middleNames: "JANE",
    },
    personExternalId: "111",
    displayId: "d111",
    pseudonymizedId: "p111",
    stateCode: "US_ND",
    officerId: "OFFICER3",
    district: "DISTRICT 1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: "2024-12-31",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-03",
    specialConditions: [
      "OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS",
    ],
    allEligibleOpportunities: ["earlyTermination"],
    currentEmployers: [
      {
        name: "Film Production South",
        address: "456 Skywalker Lane",
      },
      {
        name: "Film Production East",
        address: "456 Solo Drive",
      },
    ],
  },
];

const US_OR_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "PETER",
      surname: "RIVINGTON",
    },
    personExternalId: "001",
    displayId: "d001",
    pseudonymizedId: "p001",
    stateCode: "US_OR",
    officerId: "314159",
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
    allEligibleOpportunities: ["usOrEarnedDischarge"],
  },
  {
    personName: {
      givenNames: "EDWARD",
      surname: "YU",
    },
    personExternalId: "002",
    displayId: "d002",
    pseudonymizedId: "p002",
    stateCode: "US_OR",
    officerId: "271828",
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
    allEligibleOpportunities: ["usOrEarnedDischarge"],
  },
];

const US_PA_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "BENJAMIN",
      surname: "HILL",
    },
    personExternalId: "001",
    displayId: "d001",
    pseudonymizedId: "p001",
    stateCode: "US_PA",
    officerId: "OFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: "2024-12-31",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-03",
    allEligibleOpportunities: ["usPaAdminSupervision"],
  },
  {
    personName: {
      givenNames: "LOUISA",
      surname: "DAVIDSON",
    },
    personExternalId: "002",
    displayId: "d002",
    pseudonymizedId: "p002",
    stateCode: "US_PA",
    officerId: "OFFICER2",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: "2024-12-31",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-03",
    specialConditions: [
      "OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS, OPEN TEXT FOR SPECIAL CONDITIONS",
    ],
    allEligibleOpportunities: ["usPaAdminSupervision"],
  },
  {
    personName: {
      givenNames: "KEVIN",
      surname: "ITO",
    },
    personExternalId: "003",
    displayId: "d003",
    pseudonymizedId: "p003",
    stateCode: "US_PA",
    officerId: "OFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2019-12-20",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: "2024-12-31",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-03",
    allEligibleOpportunities: ["usPaAdminSupervision"],
  },
  {
    personName: {
      givenNames: "OSCAR",
      surname: "TUPPER",
    },
    personExternalId: "CLIENT004",
    displayId: "d004",
    pseudonymizedId: "p004",
    stateCode: "US_PA",
    officerId: "OFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2020-11-16",
    address: "456 Hamilton Street",
    phoneNumber: "1111111789",
    expirationDate: "2025-11-20",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-03",
    allEligibleOpportunities: ["usPaSpecialCircumstancesSupervision"],
  },
  {
    personName: {
      givenNames: "TIMOTHY",
      surname: "FIELD",
    },
    personExternalId: "CLIENT005",
    displayId: "d005",
    pseudonymizedId: "p005",
    stateCode: "US_PA",
    officerId: "OFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2018-11-16",
    address: "123 Georgetown Road",
    phoneNumber: "2361411789",
    expirationDate: "2026-11-20",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: "2022-01-03",
    allEligibleOpportunities: ["usPaSpecialCircumstancesSupervision"],
  },
];

const US_TN_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "TONYE",
      surname: "BARLEY",
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
    emailAddress: "tonye@thompson.net",
  },
  {
    personName: {
      givenNames: "VIVIAN",
      surname: "HANSKILL",
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
    emailAddress: "vivian@photo-stop.net",
  },
  {
    personName: {
      givenNames: "REBEKAH",
      surname: "KARINER",
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
    emailAddress: "rebekah@ceramics-r-us.net",
  },
  {
    personName: {
      givenNames: "JACOB",
      surname: "UNDERWOOD",
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
    emailAddress: "ramonda@underwood.net",
  },
  {
    personName: {
      givenNames: "SARAH",
      surname: "VELAZQUEZ",
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
    emailAddress: "claribel@velazquez.net",
  },
  {
    personName: {
      givenNames: "JACQUELINE",
      surname: "WRIGHT",
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
    emailAddress: "jackie@mechanic-supply.net",
  },
  {
    personName: {
      givenNames: "TWILA",
      surname: "LOWERY",
      middleNames: "NATALIE",
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
    emailAddress: "harry@fake.net",
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
    emailAddress: "linda@fake.net",
    allEligibleOpportunities: ["compliantReporting"],
  },
];

const data: ClientFixture[] = [
  ...US_CA_CLIENTS,
  ...US_ID_CLIENTS,
  ...US_ME_CLIENTS,
  ...US_MI_CLIENTS,
  ...US_ND_CLIENTS,
  ...US_OR_CLIENTS,
  ...US_TN_CLIENTS,
  ...US_PA_CLIENTS,
];

export const clientsData: FirestoreFixture<ClientFixture> = {
  data,
  idFunc: (r) => r.personExternalId,
};
