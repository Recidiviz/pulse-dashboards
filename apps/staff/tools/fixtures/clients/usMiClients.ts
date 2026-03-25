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

export const US_MI_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "Patrick",
      surname: "King",
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
    allEligibleOpportunities: [
      "usMiEarlyDischarge",
      "usMiSupervisionLevelDowngrade",
    ],
  },
  {
    personName: {
      givenNames: "Eugene",
      surname: "Anderson",
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
    expirationDate: "2026-10-15",
    allEligibleOpportunities: [
      "usMiEarlyDischarge",
      "usMiClassificationReview",
    ],
  },
  {
    personName: {
      givenNames: "Samantha",
      surname: "Hernandez",
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
    expirationDate: "2028-11-10",
    allEligibleOpportunities: [
      "usMiEarlyDischarge",
      "usMiClassificationReview",
    ],
  },
  {
    personName: {
      givenNames: "Aaron",
      surname: "King",
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
    expirationDate: "2029-12-30",
    allEligibleOpportunities: ["usMiEarlyDischarge"],
  },
  {
    personName: {
      givenNames: "Nathaniel",
      surname: "Sackman",
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
    expirationDate: "2027-12-30",

    allEligibleOpportunities: ["usMiEarlyDischarge"],
  },
  {
    personName: {
      givenNames: "Fausto",
      surname: "Carter",
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
    expirationDate: "2030-12-30",

    allEligibleOpportunities: [
      "usMiEarlyDischarge",
      "usMiMinimumTelephoneReporting",
      "usMiPastFTRD",
    ],
  },
  {
    personName: {
      givenNames: "Daniel",
      surname: "Cartman",
    },
    personExternalId: "ed-eligible-3",
    displayId: "ded-eligible-3",
    pseudonymizedId: "pseudo-ed-eligible-3",
    stateCode: "US_MI",
    officerId: "OFFICER8",
    supervisionType: "PROBATION",
    supervisionLevel: "HIGH",
    supervisionLevelStart: "2023-12-20",
    currentBalance: 200,
    specialConditions: [],
    expirationDate: "2026-12-30",

    allEligibleOpportunities: ["usMiEarlyDischarge"],
  },
  {
    personName: {
      givenNames: "Ella",
      surname: "Carmichael",
    },
    personExternalId: "ed-eligible-4",
    displayId: "ded-eligible-4",
    pseudonymizedId: "pseudo-ed-eligible-4",
    stateCode: "US_MI",
    officerId: "OFFICER8",
    supervisionType: "PROBATION",
    supervisionLevel: "HIGH",
    supervisionLevelStart: "2019-10-20",
    currentBalance: 100,
    specialConditions: [],
    expirationDate: "2029-10-30",

    allEligibleOpportunities: ["usMiEarlyDischarge"],
  },
  {
    personName: {
      givenNames: "Sam",
      surname: "Miller",
    },
    personExternalId: "ed-eligible-5",
    displayId: "ded-eligible-5",
    pseudonymizedId: "pseudo-ed-eligible-5",
    stateCode: "US_MI",
    officerId: "OFFICER8",
    supervisionType: "PROBATION",
    supervisionLevel: "HIGH",
    supervisionLevelStart: "2019-12-20",
    currentBalance: 150,
    expirationDate: "2027-12-30",

    specialConditions: [],
    allEligibleOpportunities: ["usMiEarlyDischarge"],
  },
];
