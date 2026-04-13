// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
  VitalsSupervisionContacts,
  vitalsSupervisionContactsSchema,
} from "../SupervisionVitalsMetric/schema";

export const rawSupervisionOfficerContactsFixture: VitalsSupervisionContacts[] =
  [
    {
      fullName: "Adams, Quinn",
      displayPersonExternalId: "707222",
      stateCode: "US_IX",
      personId: 707222,
      officerId: "so2",
      contactType: "needs_in_person_contact",
      contactDueDate: "2026-02-28",
      contactCompleted: true,
      contactCompletedDate: "2026-02-25",
    },
    {
      fullName: "Adams, Quinn",
      displayPersonExternalId: "707222",
      stateCode: "US_IX",
      personId: 707222,
      officerId: "so2",
      contactType: "needs_employment_verification",
      contactDueDate: "2026-03-01",
      contactCompleted: false,
      contactCompletedDate: null,
    },
    {
      fullName: "Roberts, Frank",
      displayPersonExternalId: "205752",
      stateCode: "US_IX",
      personId: 205752,
      officerId: "so2",
      contactType: "needs_in_person_contact",
      contactDueDate: "2026-03-10",
      contactCompleted: false,
      contactCompletedDate: null,
    },
    {
      fullName: "Rivera, Jessica",
      displayPersonExternalId: "792381",
      stateCode: "US_IX",
      personId: 792381,
      officerId: "so2",
      contactType: "needs_in_person_contact",
      contactDueDate: "2026-02-15",
      contactCompleted: true,
      contactCompletedDate: "2026-02-14",
    },
    {
      fullName: "Wilson, Samuel",
      displayPersonExternalId: "869516",
      stateCode: "US_IX",
      personId: 869516,
      officerId: "so2",
      contactType: "needs_employment_verification",
      contactDueDate: "2026-03-05",
      contactCompleted: true,
      contactCompletedDate: "2026-03-04",
    },
    {
      fullName: "Adams, Aaron",
      displayPersonExternalId: "170571",
      stateCode: "US_IX",
      personId: 170571,
      officerId: "so2",
      contactType: "needs_in_person_contact",
      contactDueDate: "2026-03-12",
      contactCompleted: false,
      contactCompletedDate: null,
    },
  ];

export const supervisionOfficerContactsFixture =
  rawSupervisionOfficerContactsFixture.map((m) =>
    vitalsSupervisionContactsSchema.parse(m),
  );
