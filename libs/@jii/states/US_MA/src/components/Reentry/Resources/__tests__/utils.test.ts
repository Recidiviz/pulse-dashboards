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

import { groupResourcesBySubcategory } from "../utils";
import { makeResource } from "./testUtils";

describe("groupResourcesBySubcategory", () => {
  test("groups by subcategory in name order, matching the category case-insensitively", () => {
    const shelter = makeResource(1, {
      categories: [{ category: "Housing", subcategory: "Shelter" }],
    });
    const both = makeResource(2, {
      categories: [
        { category: "Housing", subcategory: "Shelter" },
        { category: "Housing", subcategory: "Medical facility" },
      ],
    });
    const employment = makeResource(3, {
      categories: [{ category: "Employment", subcategory: "Job training" }],
    });

    expect(
      groupResourcesBySubcategory([shelter, both, employment], "housing"),
    ).toEqual([
      ["Medical facility", [both]],
      ["Shelter", [shelter, both]],
    ]);
  });
});
