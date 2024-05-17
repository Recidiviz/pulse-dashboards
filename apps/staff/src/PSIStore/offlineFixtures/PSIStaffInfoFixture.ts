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

export const PSIStaffInfoFixture = {
  id: "ABC123",
  externalId: "12312311",
  fullName: {
    givenNames: "Firstname",
    surname: "Lastname",
    middleNames: null,
    nameSuffix: null,
  },
  email: "firstlast@test.com",
  stateCode: "ID",
  casesMetadata: [
    {
      pseudonymizedCaseId: "CASE123",
      externalId: "12312311",
      fullName: "Anne Teak",
      stateCode: "US_ID",
      county: "Idaho County",
      dueDate: "Fri, 31 May 2024 20:41:00 GMT",
      primaryOffense: { offenseName: "Arson" },
      additionalOffenses: [{ offenseName: "Drug possession" }],
      submitStatus: "Pending",
    },
    {
      pseudonymizedCaseId: "CASE456",
      externalId: "234529",
      fullName: "Liz Erd",
      stateCode: "US_ID",
      county: "Idaho County",
      dueDate: "Fri, 31 May 2024 20:41:00 GMT",
      primaryOffense: { offenseName: "Fraud" },
      additionalOffenses: [{ offenseName: "General Crimes" }],
      submitStatus: "Submitted",
    },
  ],
};
