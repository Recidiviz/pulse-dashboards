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

export const US_PA_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "Benjamin",
      surname: "Hill",
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
      givenNames: "Louisa",
      surname: "Davidson",
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
      givenNames: "Kevin",
      surname: "Ito",
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
      givenNames: "Oscar",
      surname: "Tupper",
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
      givenNames: "Timothy",
      surname: "Field",
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
