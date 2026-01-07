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

export const US_NC_CLIENTS: ClientFixture[] = [
  {
    personName: {
      givenNames: "Jake",
      middleNames: "Todd",
      surname: "Bryant",
    },
    personExternalId: "NC001",
    displayId: "NC001",
    pseudonymizedId: "NC001",
    stateCode: "US_NC",
    officerId: "NCOFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    supervisionStartDate: "2021-02-02",
    expirationDate: "2024-08-02",
    allEligibleOpportunities: [],
  },
  {
    personName: {
      givenNames: "Sandy",
      middleNames: "Ellie",
      surname: "Dolan",
    },
    personExternalId: "NC002",
    displayId: "NC002",
    pseudonymizedId: "NC002",
    stateCode: "US_NC",
    officerId: "NCOFFICER1",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    address: "345 Main Street",
    phoneNumber: "5555555678",
    supervisionStartDate: "2020-01-01",
    expirationDate: "2023-03-30",
    allEligibleOpportunities: [],
  },
];
