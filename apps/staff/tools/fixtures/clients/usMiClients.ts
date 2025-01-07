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
    allEligibleOpportunities: ["usMiSupervisionLevelDowngrade"],
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
    allEligibleOpportunities: ["usMiClassificationReview"],
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
    allEligibleOpportunities: ["usMiClassificationReview"],
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
    allEligibleOpportunities: ["usMiMinimumTelephoneReporting", "usMiPastFTRD"],
  },
];
