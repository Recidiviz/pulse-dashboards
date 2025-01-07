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

export const US_OR_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "Peter",
      surname: "Rivington",
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
    allEligibleOpportunities: [
      "usOrEarnedDischarge",
      "usOrEarnedDischargeSentence",
    ],
  },
  {
    personName: {
      givenNames: "Edward",
      surname: "Yu",
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
    allEligibleOpportunities: [
      "usOrEarnedDischarge",
      "usOrEarnedDischargeSentence",
    ],
  },
];
