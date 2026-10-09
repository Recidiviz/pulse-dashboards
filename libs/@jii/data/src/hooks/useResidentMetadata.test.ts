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

import { usMaResidentJiiDataFixtures } from "~@jii/fixtures";
import { usMaStateDataSchema } from "~@jii/schemas";

import {
  ResidentRecord,
  useSingleResidentContext,
} from "../contexts/SingleResidentContext";
import { useResidentMetadata } from "./useResidentMetadata";

vi.mock("../contexts/SingleResidentContext");

const testStateSpecificData = usMaStateDataSchema.parse(
  usMaResidentJiiDataFixtures[0],
) as ResidentRecord["stateSpecificData"];

beforeEach(() => {
  vi.mocked(useSingleResidentContext).mockReturnValue({
    resident: {
      pseudonymizedId: "anonres001",
      stateSpecificData: testStateSpecificData,
    } as ResidentRecord,
    residentFlags: {},
  });
});

test("correct state code", () => {
  expect(useResidentMetadata("US_MA")).toEqual(testStateSpecificData);
});

test("incorrect stateCode", () => {
  expect(() => useResidentMetadata("US_TN")).toThrowErrorMatchingInlineSnapshot(
    `[Error: Expecting US_TN metadata but got US_MA]`,
  );
});
