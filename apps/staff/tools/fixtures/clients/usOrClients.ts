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
    supervisionLevelStart: "2022-03-15",
    address: "4817 SE Morrison St, Portland, OR 97215",
    phoneNumber: "5035551847",
    supervisionStartDate: "2022-03-15",
    expirationDate: "2027-03-15",
    currentBalance: 450.0,
    lastPaymentAmount: 75.0,
    lastPaymentDate: "2026-05-10",
    allEligibleOpportunities: ["usOrEarnedDischargeSentence"],
  },
  {
    personName: {
      givenNames: "Maria",
      surname: "Santos",
    },
    personExternalId: "002",
    displayId: "d002",
    pseudonymizedId: "p002",
    stateCode: "US_OR",
    officerId: "271828",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2023-02-10",
    address: "1230 Commercial St SE, Salem, OR 97302",
    phoneNumber: "5035552934",
    supervisionStartDate: "2023-02-10",
    expirationDate: "2027-02-10",
    currentBalance: 0,
    lastPaymentAmount: 100.0,
    lastPaymentDate: "2026-04-22",
    allEligibleOpportunities: ["usOrEarnedDischargeSentence"],
  },
  {
    personName: {
      givenNames: "James",
      surname: "Walker",
    },
    personExternalId: "003",
    displayId: "d003",
    pseudonymizedId: "p003",
    stateCode: "US_OR",
    officerId: "314159",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2023-05-01",
    address: "892 Willamette St, Eugene, OR 97401",
    phoneNumber: "5415553621",
    supervisionStartDate: "2023-05-01",
    expirationDate: "2028-05-01",
    currentBalance: 800.0,
    lastPaymentAmount: 50.0,
    lastPaymentDate: "2026-03-15",
    allEligibleOpportunities: ["usOrEarnedDischargeSentence"],
  },
  {
    personName: {
      givenNames: "Lisa",
      surname: "Chen",
    },
    personExternalId: "004",
    displayId: "d004",
    pseudonymizedId: "p004",
    stateCode: "US_OR",
    officerId: "271828",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: "2024-09-15",
    address: "2150 NE Highway 20, Bend, OR 97701",
    phoneNumber: "5415554782",
    supervisionStartDate: "2024-09-15",
    expirationDate: "2028-09-15",
    currentBalance: 125.5,
    lastPaymentAmount: 50.0,
    lastPaymentDate: "2026-05-01",
    allEligibleOpportunities: ["usOrEarnedDischargeSentence"],
  },
];
