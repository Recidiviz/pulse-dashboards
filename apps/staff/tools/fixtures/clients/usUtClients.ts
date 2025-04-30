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
  },
];
