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

export const US_UT_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "Gregory",
      surname: "Ludden",
    },
    personExternalId: "UT001",
    displayId: "123001",
    pseudonymizedId: "p001",
    stateCode: "US_UT",
    officerId: "UTOFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionStartDate: "2020-05-06",
    expirationDate: "2023-02-11",
    phoneNumber: "385-555-5555",
    allEligibleOpportunities: ["usUtEarlyTermination"],
    milestones: [
      {
        text: "Employed, studying, or with another source of income for 6+ months.",
        type: "US_UT_EMPLOYED_6_MONTHS",
      },
    ],
    metadata: {
      stateCode: "US_UT",
      interstateCompactIn: false,
      sentences: [
        {
          projectedCompletionDate: "2023-02-11",
          courtCaseNumber: "200345678",
          statutes: ["11-34-5(6)", "11-34-5(1.1)"],
        },
        {
          projectedCompletionDate: "2023-02-11",
          courtCaseNumber: "201654321",
          statutes: [
            "70-14-35",
            "70-15(2)(B)",
            "75-302(1)(A)(II)",
            "75-305",
            "75-307.5",
            "89-5-112.9",
          ],
        },
      ],
    },
  },
  {
    personName: {
      givenNames: "Olinda",
      surname: "Tillman",
    },
    personExternalId: "UT002",
    displayId: "123002",
    pseudonymizedId: "p002",
    stateCode: "US_UT",
    officerId: "UTOFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionStartDate: "2019-06-07",
    expirationDate: "2022-12-31",
    phoneNumber: "801-555-5555",
    allEligibleOpportunities: ["usUtEarlyTermination"],
    milestones: [
      {
        text: "Employed, studying, or with another source of income for 6+ months.",
        type: "US_UT_EMPLOYED_6_MONTHS",
      },
    ],
    metadata: {
      stateCode: "US_UT",
      interstateCompactIn: false,
      sentences: [
        {
          projectedCompletionDate: "2022-12-31",
          courtCaseNumber: "21113579",
          statutes: ["34-94-85", "512-346"],
        },
      ],
    },
  },
  {
    personName: {
      givenNames: "Zeke",
      surname: "Groves",
    },
    personExternalId: "UT003",
    displayId: "123003",
    pseudonymizedId: "p003",
    stateCode: "US_UT",
    officerId: "UTOFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionStartDate: "2021-09-20",
    expirationDate: "2023-01-20",
    phoneNumber: "435-555-5555",
    allEligibleOpportunities: ["usUtEarlyTermination"],
    milestones: [
      {
        text: "Employed, studying, or with another source of income for 6+ months.",
        type: "US_UT_EMPLOYED_6_MONTHS",
      },
    ],
    metadata: {
      stateCode: "US_UT",
      interstateCompactIn: false,
      sentences: [
        {
          projectedCompletionDate: "2023-01-20",
          courtCaseNumber: "2109485700",
          statutes: ["74-56(1)", "74-56(2.1)", "74-56(3)"],
        },
        {
          projectedCompletionDate: "2023-12-20",
          courtCaseNumber: "2133858300",
          statutes: ["15328"],
        },
      ],
    },
  },
  {
    personName: {
      givenNames: "Abigail",
      surname: "Besser",
    },
    personExternalId: "UT004",
    displayId: "123004",
    pseudonymizedId: "p004",
    stateCode: "US_UT",
    officerId: "UTOFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionStartDate: "2021-09-20",
    expirationDate: "2023-01-20",
    phoneNumber: "435-555-5555",
    allEligibleOpportunities: ["usUtEarlyTermination"],
    milestones: [
      {
        text: "Employed, studying, or with another source of income for 6+ months.",
        type: "US_UT_EMPLOYED_6_MONTHS",
      },
    ],
    metadata: {
      stateCode: "US_UT",
      interstateCompactIn: true,
      sentences: [
        {
          projectedCompletionDate: "2023-01-20",
          courtCaseNumber: "21124680",
          statutes: ["01.2364"],
        },
        {
          projectedCompletionDate: undefined,
          courtCaseNumber: "C21328999",
          statutes: ["41-5-1(A)+(B)(III)"],
        },
      ],
    },
  },
  {
    personName: {
      givenNames: "Lenny",
      surname: "Heath",
    },
    personExternalId: "UT005",
    displayId: "123005",
    pseudonymizedId: "p005",
    stateCode: "US_UT",
    officerId: "UTOFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionStartDate: "2021-09-12",
    expirationDate: "2023-01-11",
    phoneNumber: "435-555-5555",
    allEligibleOpportunities: ["usUtEarlyTermination"],
    milestones: [
      {
        text: "Employed, studying, or with another source of income for 6+ months.",
        type: "US_UT_EMPLOYED_6_MONTHS",
      },
    ],
    metadata: {
      stateCode: "US_UT",
      interstateCompactIn: false,
      sentences: [
        {
          projectedCompletionDate: "2023-01-20",
          courtCaseNumber: "21124680",
          statutes: ["77.26.77"],
        },
        {
          projectedCompletionDate: undefined,
          courtCaseNumber: "C21328999",
          statutes: ["41-5-1(A)+(B)(III)"],
        },
      ],
    },
  },
];
