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
      fullName: { given_names: "Miles", middle_names: "D", surname: "Davis" },
      externalId: "mdavis123",
      district: "D1",
    },
    {
      fullName: { given_names: "Billie", surname: "Holiday" },
      externalId: "bholiday456",
      district: null,
    },
    {
      fullName: { given_names: "Ella", surname: "Fitzgerald" },
      externalId: "efitzgerald789",
      district: "D1",
    },
    {
      fullName: { given_names: "John", surname: "Coltrane" },
      externalId: "jColtrane321",
      district: null,
    },
  ];
export const supervisionOfficerSupervisorsFixture =
  rawSupervisionOfficerSupervisorFixture.map((b) =>
    supervisionOfficerSupervisorSchema.parse(b)
  );
