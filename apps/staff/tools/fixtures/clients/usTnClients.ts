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

import { add, formatISO } from "date-fns";

import { relativeFixtureDate } from "~datatypes";

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
    supervisionLevel: "8MO",
    supervisionLevelStart: relativeFixtureDate({ years: -2, days: -111 }),
    address: "123 Main St, Nashville, TN 12345",
    phoneNumber: "5555555678",
    supervisionStartDate: relativeFixtureDate({ years: -2, days: -555 }),
    expirationDate: relativeFixtureDate({ years: 1, days: 444 }),
    currentBalance: 0,
    lastPaymentAmount: 50,
    lastPaymentDate: relativeFixtureDate({ years: -1 }),
    specialConditions: [
      // these dates are not shifted, so we can't use relativeFixtureDate
      `[{"NOTE_UPDATE_DATE": "${formatISO(add(new Date(), { days: -111 }))}", "CONDITIONS_ON_DATE": "FORENSIC SOCIAL WORKER REFERRAL"},
        {"NOTE_UPDATE_DATE": "${formatISO(add(new Date(), { days: -222 }))}", "CONDITIONS_ON_DATE": "MUST COMPLETE RECOVERY COURT"}]
      `,
    ],
    allEligibleOpportunities: [
      "compliantReporting",
      "usTnCompliantReporting2025Policy",
    ],
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
    supervisionLevel: "8MO",
    supervisionLevelStart: relativeFixtureDate({ months: -19, days: -5 }),
    address: "456 Broadway, Nashville, TN 12345",
    phoneNumber: "5555555678",
    supervisionStartDate: relativeFixtureDate({ months: -19, days: -5 }),
    expirationDate: relativeFixtureDate({ days: -11 }),
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    lastPaymentDate: relativeFixtureDate({ days: -111 }),
    boardConditions: [
      {
        condition: "TA",
        conditionDescription: "TREATMENT AS ASSESSED",
      },
    ],
    allEligibleOpportunities: [
      "compliantReporting",
      "usTnExpiration",
      "usTnCompliantReporting2025Policy",
    ],
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
    supervisionLevel: "8LO",
    address: "999 Main St, Nashville, TN 12345",
    phoneNumber: "5555555678",
    currentBalance: 0,
    lastPaymentAmount: 125.75,
    supervisionLevelStart: relativeFixtureDate({ months: -10, days: -102 }),
    supervisionStartDate: relativeFixtureDate({ months: -10, days: -102 }),
    expirationDate: relativeFixtureDate({ months: 10, days: 102 }),
    lastPaymentDate: relativeFixtureDate({ days: -102 }),
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
    officerId: "OFFICER1",
    district: "DISTRICT 50",
    supervisionType: "DIVERSION",
    supervisionLevel: "8LO",
    supervisionLevelStart: relativeFixtureDate({ months: -20 }),
    address: "999 Main St, Nashville, TN 12345",
    phoneNumber: "5555555678",
    supervisionStartDate: relativeFixtureDate({ months: -20 }),
    expirationDate: relativeFixtureDate({ days: 1000 }),
    currentBalance: 125.75,
    allEligibleOpportunities: [
      "compliantReporting",
      "usTnCompliantReporting2025Policy",
    ],
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
    officerId: "OFFICER1",
    district: "DISTRICT 50",
    supervisionType: "DETERMINATE RLSE PROBATIONER",
    supervisionLevel: "8LO",
    supervisionLevelStart: relativeFixtureDate({ years: -1, days: 4 }),
    address: "999 Main St, Nashville, TN 12345",
    phoneNumber: "5555555678",
    supervisionStartDate: relativeFixtureDate({ years: -2, days: 22 }),
    expirationDate: relativeFixtureDate({ years: 5 }),
    currentBalance: 0,
    lastPaymentAmount: 125.75,
    lastPaymentDate: relativeFixtureDate({ months: -11 }),
    allEligibleOpportunities: [
      "compliantReporting",
      "usTnCompliantReporting2025Policy",
    ],
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
    officerId: "OFFICER1",
    district: "DISTRICT 50",
    supervisionType: "TN PAROLEE",
    supervisionLevel: "8LO",
    supervisionLevelStart: relativeFixtureDate({ months: -20, days: -109 }),
    expirationDate: relativeFixtureDate({ days: -2 }),
    lastPaymentDate: relativeFixtureDate({ days: -109 }),
    address: "999 Main St, Nashville, TN 12345",
    phoneNumber: "5555555678",
    currentBalance: 0,
    lastPaymentAmount: 125.75,
    allEligibleOpportunities: ["usTnExpiration"],
    currentEmployers: [
      {
        name: "Tire store",
        address: "567 Broadway",
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
    supervisionLevel: "8MO",
    address: "456 Broadway, Nashville, TN 12345",
    phoneNumber: "5555555678",
    currentBalance: 1221.88,
    lastPaymentAmount: 125.75,
    supervisionLevelStart: relativeFixtureDate({ months: -18, days: -108 }),
    supervisionStartDate: relativeFixtureDate({ months: -18, days: -108 }),
    expirationDate: relativeFixtureDate({ months: 18, days: 108 }),
    lastPaymentDate: relativeFixtureDate({ days: -118 }),
    allEligibleOpportunities: ["supervisionLevelDowngrade"],
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
    address: "456 Broadway, Nashville, TN 12345",
    phoneNumber: "5555555678",
    currentBalance: 282,
    district: "DISTRICT X",
    supervisionType: "ISC",
    supervisionLevel: "8LO",
    supervisionStartDate: relativeFixtureDate({ months: -13, days: 2 }),
    expirationDate: relativeFixtureDate({ months: 19, days: 19 }),
    emailAddress: "harry@example.com",
    currentEmployers: [
      {
        name: "The Camera Store",
        address: "496 Main Ave",
      },
    ],
    allEligibleOpportunities: [
      "compliantReporting",
      "usTnCompliantReporting2025Policy",
    ],
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
    address: "456 Broadway, Nashville, TN 12345",
    phoneNumber: "5555555678",
    currentBalance: 700,
    lastPaymentAmount: 100,
    lastPaymentDate: "2022-01-03",
    district: "DISTRICT X",
    supervisionType: "ISC",
    supervisionLevel: "8MO",
    supervisionStartDate: relativeFixtureDate({ months: -13, days: 2 }),
    expirationDate: relativeFixtureDate({ months: 19, days: 19 }),
    emailAddress: "linda@example.com",
    allEligibleOpportunities: [
      "compliantReporting",
      "usTnCompliantReporting2025Policy",
    ],
  },
  {
    personExternalId: "203",
    displayId: "d203",
    pseudonymizedId: "p203",
    stateCode: "US_TN",
    personName: {
      givenNames: "Reginald",
      surname: "Marvin",
    },
    officerId: "OFFICER1",
    address: "456 Broadway, Nashville, TN 12345",
    phoneNumber: "5555555678",
    currentBalance: 0,
    lastPaymentAmount: 100,
    lastPaymentDate: "2022-01-03",
    district: "DISTRICT X",
    supervisionType: "TN PROBATIONER",
    supervisionLevel: "8MO",
    supervisionLevelStart: relativeFixtureDate({ months: -18, days: 9 }),
    supervisionStartDate: relativeFixtureDate({ months: -23 }),
    expirationDate: relativeFixtureDate({ months: 18, days: 18 }),
    emailAddress: "reginald@example.com",
    allEligibleOpportunities: [
      "compliantReporting",
      "usTnCompliantReporting2025Policy",
    ],
  },
];
