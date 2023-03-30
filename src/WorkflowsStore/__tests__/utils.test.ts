// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { StaffRecord } from "../../FirestoreStore/types";
import { staffNameComparator } from "../utils";

test("staffNameComparator", () => {
  const sortableStaff: StaffRecord[] = [
    {
      id: "1",
      stateCode: "us_xx",
      email: null,
      hasCaseload: true,
      hasFacilityCaseload: false,
      givenNames: "John",
      surname: "Doe",
    },
    {
      id: "2",
      stateCode: "us_xx",
      email: null,
      hasCaseload: true,
      hasFacilityCaseload: false,
      givenNames: "Jane",
      surname: "Doe",
    },
    {
      id: "3",
      stateCode: "us_xx",
      email: null,
      hasCaseload: true,
      hasFacilityCaseload: false,
      givenNames: "Chad",
      surname: "Doe-Adams",
    },
    {
      id: "4",
      stateCode: "us_xx",
      email: null,
      hasCaseload: true,
      hasFacilityCaseload: false,
      givenNames: "Bob",
      surname: "Adams-Doe",
    },
    {
      id: "4",
      stateCode: "us_xx",
      email: null,
      hasCaseload: true,
      hasFacilityCaseload: false,
      givenNames: "Brad",
      surname: "Collins (Doe)",
    },
  ];

  const sortedStaff = sortableStaff.sort(staffNameComparator);
  expect(sortedStaff.map((s) => `${s.givenNames} ${s.surname}`.trim())).toEqual(
    [
      "Bob Adams-Doe",
      "Brad Collins (Doe)",
      "Jane Doe",
      "John Doe",
      "Chad Doe-Adams",
    ]
  );
});
