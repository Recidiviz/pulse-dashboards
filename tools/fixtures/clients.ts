// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY, without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { ClientRecord } from "../../src/FirestoreStore";
import { FixtureData } from "../workflowsFixtures";

const US_CA_CLIENTS: Omit<ClientRecord, "personType" | "recordId">[] = [
  {
    personName: {
      givenNames: "PETER",
      surname: "FRENCH FRY",
      middleNames: "JR",
    },
    personExternalId: "001",
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
    // TODO: Update milestone type/text when CA types are confirmed
    milestones: [
      {
        text: "Violation-free for 6+ months",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "4 months with current employer",
        type: "MONTHS_WITH_CURRENT_EMPLOYER",
      },
    ],
  },
  {
    personName: {
      givenNames: "PANDA",
      surname: "BEAR",
      middleNames: "JR",
    },
    personExternalId: "002",
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
    // TODO: Update milestone type/text when CA types are confirmed
    milestones: [
      {
        text: "Violation-free for 6+ months",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "4 months with current employer",
        type: "MONTHS_WITH_CURRENT_EMPLOYER",
      },
      {
        text: "6 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
  },
  {
    personName: {
      givenNames: "MISTER",
      surname: "LION",
      middleNames: "JR",
    },
    personExternalId: "003",
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
      givenNames: "MINNIE",
      surname: "MOUSE",
      middleNames: "HUMMUS",
    },
    personExternalId: "005",
    pseudonymizedId: "p005",
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
    // TODO: Update milestone type/text when CA types are confirmed
    milestones: [
      {
        text: "Violation-free for 6+ months",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "4 months with current employer",
        type: "MONTHS_WITH_CURRENT_EMPLOYER",
      },
    ],
  },
  {
    personName: {
      givenNames: "FURBY",
      surname: "JOURNEY",
      middleNames: "W.",
    },
    personExternalId: "006",
    pseudonymizedId: "p006",
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
    // TODO: Update milestone type/text when CA types are confirmed
    milestones: [
      {
        text: "Violation-free for 6+ months",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "4 months with current employer",
        type: "MONTHS_WITH_CURRENT_EMPLOYER",
      },
    ],
  },
  {
    personName: {
      givenNames: "Olive",
      surname: "Oyle",
    },
    personExternalId: "007",
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
    // TODO: Update milestone type/text when CA types are confirmed
    milestones: [
      {
        text: "Violation-free for 6+ months",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "4 months with current employer",
        type: "MONTHS_WITH_CURRENT_EMPLOYER",
      },
    ],
  },
];

const US_ID_CLIENTS: Omit<ClientRecord, "personType" | "recordId">[] = [
  {
    personName: {
      givenNames: "BETTY",
      surname: "RUBBLE",
      middleNames: "JANE",
    },
    personExternalId: "001",
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
      givenNames: "DINO",
      surname: "SAUR",
      middleNames: "DEE",
    },
    personExternalId: "002",
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
    emailAddress: "dino@saur.net",
  },
  {
    personName: {
      givenNames: "SYLVESTER",
      surname: "SLATE",
    },
    personExternalId: "003",
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
        address: "456 Shutterfly Lane",
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
    emailAddress: "sylvester@slate.net",
  },
  {
    personName: {
      givenNames: "FRAN",
      surname: "DRESCHER",
    },
    personExternalId: "005",
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
    emailAddress: "fran@drescher.net",
  },
  {
    personName: {
      givenNames: "ASH",
      surname: "KETCHUM",
    },
    personExternalId: "006",
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
        name: "NASA",
        address: "456 Shuttle St",
      },
    ],
    milestones: [
      {
        text: "50 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
    emailAddress: "ash@ketchum.net",
  },
  {
    personName: {
      givenNames: "CANDY",
      surname: "RAIN",
    },
    personExternalId: "004",
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
      givenNames: "CARRIE",
      surname: "UNDERWOOD",
    },
    personExternalId: "007",
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
      surname: "DAVID",
    },
    personExternalId: "008",
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
        name: "Comedy Central",
        address: "493 Laugh St",
      },
    ],
    emailAddress: "larry@david.net",
  },
];

const US_ME_CLIENTS: Omit<ClientRecord, "personType" | "recordId">[] = [
  {
    personName: {
      givenNames: "LAURA",
      surname: "PALMER",
    },
    personExternalId: "009",
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
      surname: "LOPEZ",
    },
    personExternalId: "010",
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
      surname: "CAREY",
    },
    personExternalId: "011",
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
      surname: "COOPER",
    },
    personExternalId: "012",
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

const US_MI_CLIENTS: Omit<ClientRecord, "personType" | "recordId">[] = [
  {
    personName: {
      givenNames: "PATRICK",
      surname: "STAR",
    },
    personExternalId: "001",
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
      surname: "KRABS",
    },
    personExternalId: "cr-eligible-1",
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
      givenNames: "SAGE",
      surname: "THE SAGE",
    },
    personExternalId: "cr-eligible-2",
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
      givenNames: "SQUIDWARD",
      surname: "TENTACLES",
    },
    personExternalId: "ed-eligible-1",
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
      givenNames: "NOT",
      surname: "SQUIDWARD",
    },
    personExternalId: "ed-eligible-2",
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
      givenNames: "GORAN",
      surname: "IVANISEVIC",
    },
    personExternalId: "010",
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

const US_ND_CLIENTS: Omit<ClientRecord, "personType" | "recordId">[] = [
  {
    personName: {
      givenNames: "JAMIE",
      surname: "JONES",
      middleNames: "JANE",
    },
    personExternalId: "110",
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
      surname: "TIMBERLAKE",
      middleNames: "JANE",
    },
    personExternalId: "111",
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

const US_TN_CLIENTS: Omit<ClientRecord, "personType" | "recordId">[] = [
  {
    personName: {
      givenNames: "TONYE",
      surname: "THOMPSON",
      middleNames: "BARBY",
    },
    personExternalId: "100",
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
      givenNames: "LINET",
      surname: "HANSEN",
    },
    personExternalId: "101",
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
        name: "Photography Studio",
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
    emailAddress: "linet@hansen.net",
  },
  {
    personName: {
      givenNames: "REBEKAH",
      surname: "CORTES",
      middleNames: "HATTI",
    },
    personExternalId: "102",
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
    emailAddress: "rebekah@cortes.net",
  },
  {
    personName: {
      givenNames: "RAMONDA",
      surname: "UNDERWOOD",
    },
    personExternalId: "104",
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
      givenNames: "CLARIBEL",
      surname: "VELAZQUEZ",
      middleNames: "M",
    },
    personExternalId: "107",
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
    allEligibleOpportunities: ["compliantReporting"],
    emailAddress: "claribel@velazquez.net",
  },
  {
    personName: {
      givenNames: "SHERRI",
      surname: "WRIGHT",
      middleNames: "RENELLE",
    },
    personExternalId: "109",
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
    allEligibleOpportunities: ["compliantReporting"],
    currentEmployers: [
      {
        name: "Tire store",
      },
    ],
    emailAddress: "sherri@renelle.net",
  },
  {
    personName: {
      givenNames: "TWILA",
      surname: "LOWERY",
      middleNames: "NATALIE",
    },
    personExternalId: "108",
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
    allEligibleOpportunities: ["compliantReporting"],
    currentEmployers: [
      {
        name: "Tire store",
        address: "492 White Lotus St",
      },
    ],
  },
];

const data: Omit<ClientRecord, "personType" | "recordId">[] = [
  ...US_CA_CLIENTS,
  ...US_ID_CLIENTS,
  ...US_ME_CLIENTS,
  ...US_MI_CLIENTS,
  ...US_ND_CLIENTS,
  ...US_TN_CLIENTS,
];

export const clientsData: FixtureData<
  Omit<ClientRecord, "personType" | "recordId">
> = {
  data,
  idFunc: (r) => r.personExternalId,
};