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

const startingDueDate = new Date();
// Adds a year to `startingDueDate` to prevent it from automatically being archived for testing purposes
const unarchivableDueDate = new Date(
  startingDueDate.setFullYear(startingDueDate.getFullYear() + 1),
);

export const StaffInfoFixture: Staff = {
  pseudonymizedId: "ABC123",
  supervisorId: "DEF456",
  fullName: "",
  email: "firstlast@test.com",
  stateCode: "US_ID",
  hasLoggedIn: false,
  cases: [
    {
      id: "f9c7ad42-949c-4f11-9ece-caf66df9f913",
      externalId: "198374019",
      client: {
        fullName: "Blanda Furman",
        externalId: "70478174",
      },
      dueDate: unarchivableDueDate,
      reportType: "FullPSI",
      offense: "Burglary",
      status: "InProgress",
      isCancelled: false,
    },
    {
      id: "f9c7ad42-949c-4f11-9ece-caf66df9f9132",
      externalId: "198374019",
      client: {
        fullName: "Xavier Smith",
        externalId: "93012938",
      },
      dueDate: unarchivableDueDate,
      reportType: "FileReview",
      offense: "Burglary",
      status: "NotYetStarted",
      isCancelled: false,
    },
    {
      id: "f9c7ad42-949c-4f11-9ece-caf66df9f9132x2",
      externalId: "198374019",
      client: {
        fullName: "Anne Teak",
        externalId: "98302183",
      },
      dueDate: new Date("2023-01-11T13:52:20.338Z"),
      reportType: "FileReviewWithUpdatedLSIRScore",
      offense: undefined,
      status: "Complete",
      isCancelled: false,
    },
    {
      id: "f9c7ad42-949c-4f11-9ece-caf66df9f9132x",
      externalId: "198374019",
      client: {
        fullName: "Bob Thornburg",
        externalId: "89721399",
      },
      dueDate: unarchivableDueDate,
      reportType: "FileReviewWithUpdatedLSIRScore",
      offense: "Burglary",
      status: "Complete",
      isCancelled: false,
    },
  ],
};
