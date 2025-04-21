// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import {
  RawSupervisionOfficerSupervisor,
  supervisionOfficerSupervisorSchema,
} from "./schema";

export const rawSupervisionOfficerSupervisorFixture: RawSupervisionOfficerSupervisor[] =
  [
    {
      fullName: {
        givenNames: "Alejandro",
        middleNames: "D",
        surname: "Gonzalez",
      },
      externalId: "agonzalez123",
      supervisionLocationForListPage: "Region 1",
      supervisionLocationForSupervisorPage: "Unit 1",
      pseudonymizedId: "hashed-agonzalez123",
      hasOutliers: true,
      email: "mock-email",
    },
    {
      fullName: { givenNames: "David", surname: "Lee" },
      externalId: "dlee456",
      supervisionLocationForListPage: "Region 2",
      supervisionLocationForSupervisorPage: "Unit 1",
      pseudonymizedId: "hashed-dlee456",
      hasOutliers: true,
      email: null,
    },
    {
      fullName: { givenNames: "Rosa", surname: "Smith" },
      externalId: "rsmith789",
      supervisionLocationForListPage: "Region 1",
      supervisionLocationForSupervisorPage: "Unit 1",
      pseudonymizedId: "hashed-rsmith789",
      hasOutliers: true,
      email: "mock-email",
    },
    {
      fullName: { givenNames: "Charles", surname: "Thomas" },
      externalId: "cthomas321",
      supervisionLocationForListPage: "Region 2",
      supervisionLocationForSupervisorPage: null,
      pseudonymizedId: "hashed-cthomas321",
      hasOutliers: false,
      email: null,
    },
    {
      fullName: { givenNames: "Cora", surname: "Matterson" },
      externalId: "cmatterson567",
      supervisionLocationForListPage: "EXTERNAL_UNKNOWN",
      supervisionLocationForSupervisorPage: null,
      pseudonymizedId: "hashed-cmatterson567",
      hasOutliers: false,
      email: null,
    },
    {
      fullName: { givenNames: "Jared", surname: "Williams" },
      externalId: "jwilliams345",
      supervisionLocationForListPage: null,
      supervisionLocationForSupervisorPage: "NULL",
      pseudonymizedId: "hashed-jwilliams345",
      hasOutliers: false,
      email: null,
    },
  ];
export const supervisionOfficerSupervisorsFixture =
  rawSupervisionOfficerSupervisorFixture.map((b) =>
    supervisionOfficerSupervisorSchema.parse(b),
  );
