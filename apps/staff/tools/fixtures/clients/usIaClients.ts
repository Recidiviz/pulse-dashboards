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

import { relativeFixtureDate } from "~datatypes";

import { ClientFixture } from "../clients";

export const US_IA_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "Casee",
      surname: "Martinez",
    },
    personExternalId: "001",
    displayId: "12345",
    pseudonymizedId: "p001",
    stateCode: "US_IA",
    officerId: "OFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "LEVEL 3",
    supervisionLevelStart: relativeFixtureDate({ months: -12 }),
    supervisionStartDate: relativeFixtureDate({ months: -12 }),
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: relativeFixtureDate({ months: 2 }),
    allEligibleOpportunities: ["usIaEarlyDischarge"],
  },
  {
    personName: {
      givenNames: "Jennifer",
      surname: "Dough",
    },
    personExternalId: "002",
    displayId: "12346",
    pseudonymizedId: "p002",
    stateCode: "US_IA",
    officerId: "OFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "LEVEL 2",
    supervisionLevelStart: relativeFixtureDate({ months: -16 }),
    supervisionStartDate: relativeFixtureDate({ months: -14 }),
    address: "456 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: relativeFixtureDate({ months: 7 }),
    allEligibleOpportunities: ["usIaEarlyDischarge"],
  },
  {
    personName: {
      givenNames: "Harry",
      surname: "Ford",
    },
    personExternalId: "003",
    displayId: "12347",
    pseudonymizedId: "p003",
    stateCode: "US_IA",
    officerId: "OFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "LEVEL 1",
    supervisionLevelStart: relativeFixtureDate({ months: -15 }),
    supervisionStartDate: relativeFixtureDate({ months: -16 }),
    address: "789 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: relativeFixtureDate({ months: 12 }),
    allEligibleOpportunities: ["usIaEarlyDischarge"],
  },
  {
    personName: {
      givenNames: "Molly",
      surname: "Henderson",
    },
    personExternalId: "004",
    displayId: "12348",
    pseudonymizedId: "p004",
    stateCode: "US_IA",
    officerId: "OFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "LEVEL 2",
    supervisionLevelStart: relativeFixtureDate({ months: -8 }),
    supervisionStartDate: relativeFixtureDate({ months: -8 }),
    address: "100 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: relativeFixtureDate({ months: 9 }),
    allEligibleOpportunities: ["usIaEarlyDischarge"],
  },
];
