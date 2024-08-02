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

import { Staff } from "../APIClient";

export const StaffInfoFixture: Staff = {
  pseudonymizedId: "ABC123",
  fullName: "",
  email: "firstlast@test.com",
  stateCode: "US_ID",
  hasLoggedIn: false,
  Cases: [
    {
      id: "f9c7ad42-949c-4f11-9ece-caf66df9f913",
      externalId: "198374019",
      Client: {
        fullName: "Blanda Furman",
      },
      dueDate: new Date("2025-01-19T13:52:20.338Z"),
      reportType: "Full PSI",
      offense: "Burglary",
      status: "InProgress",
    },
    {
      id: "f9c7ad42-949c-4f11-9ece-caf66df9f9132",
      externalId: "198374019",
      Client: {
        fullName: "Xavier Smith",
      },
      dueDate: new Date("2024-11-01T13:52:20.338Z"),
      reportType: "File Review",
      offense: "Burglary",
      status: "NotYetStarted",
    },
    {
      id: "f9c7ad42-949c-4f11-9ece-caf66df9f9132x2",
      externalId: "198374019",
      Client: {
        fullName: "Anne Teak",
      },
      dueDate: new Date("2023-01-11T13:52:20.338Z"),
      reportType: "File Review +  Update LSI-R",
      offense: undefined,
      status: "Complete",
    },
    {
      id: "f9c7ad42-949c-4f11-9ece-caf66df9f9132x",
      externalId: "198374019",
      Client: {
        fullName: "Bob Thornburg",
      },
      dueDate: new Date("2025-01-11T13:52:20.338Z"),
      reportType: "File Review +  Update LSI-R",
      offense: "Burglary",
      status: "Complete",
    },
  ],
};
