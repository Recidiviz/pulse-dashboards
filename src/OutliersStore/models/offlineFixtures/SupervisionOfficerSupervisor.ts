// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
} from "../SupervisionOfficerSupervisor";

export const rawSupervisionOfficerSupervisorFixture: RawSupervisionOfficerSupervisor[] =
  [
    {
      fullName: { givenNames: "Miles", middleNames: "D", surname: "Davis" },
      externalId: "mdavis123",
      supervisionDistrict: "Region D1",
      pseudonymizedId: "hashed-mdavis123",
      hasOutliers: true,
    },
    {
      fullName: { givenNames: "Billie", surname: "Holiday" },
      externalId: "bholiday456",
      supervisionDistrict: null,
      pseudonymizedId: "hashed-bholiday456",
      hasOutliers: true,
    },
    {
      fullName: { givenNames: "Ella", surname: "Fitzgerald" },
      externalId: "efitzgerald789",
      supervisionDistrict: "D1",
      pseudonymizedId: "hashed-efitzgerald789",
      hasOutliers: false,
    },
    {
      fullName: { givenNames: "John", surname: "Coltrane" },
      externalId: "jColtrane321",
      supervisionDistrict: null,
      pseudonymizedId: "hashed-jColtrane321",
      hasOutliers: false,
    },
  ];
export const supervisionOfficerSupervisorsFixture =
  rawSupervisionOfficerSupervisorFixture.map((b) =>
    supervisionOfficerSupervisorSchema.parse(b)
  );
