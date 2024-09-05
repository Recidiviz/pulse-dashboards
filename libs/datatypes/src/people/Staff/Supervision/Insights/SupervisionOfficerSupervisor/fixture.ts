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
      supervisionDistrict: "Region D1",
      pseudonymizedId: "hashed-agonzalez123",
      hasOutliers: true,
      email: "mock-email",
    },
    {
      fullName: { givenNames: "David", surname: "Lee" },
      externalId: "dlee456",
      supervisionDistrict: null,
      pseudonymizedId: "hashed-dlee456",
      hasOutliers: true,
      email: null,
    },
    {
      fullName: { givenNames: "Rosa", surname: "Smith" },
      externalId: "rsmith789",
      supervisionDistrict: "Region D1",
      pseudonymizedId: "hashed-rsmith789",
      hasOutliers: true,
      email: "mock-email",
    },
    {
      fullName: { givenNames: "Charles", surname: "Thomas" },
      externalId: "cthomas321",
      supervisionDistrict: null,
      pseudonymizedId: "hashed-cthomas321",
      hasOutliers: false,
      email: null,
    },
  ];
export const supervisionOfficerSupervisorsFixture =
  rawSupervisionOfficerSupervisorFixture.map((b) =>
    supervisionOfficerSupervisorSchema.parse(b),
  );
