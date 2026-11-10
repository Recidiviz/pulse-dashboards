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

import { buildSearchArg } from "../search";

describe("buildSearchArg", () => {
  test("keeps only fields present in the allowlist", () => {
    const result = buildSearchArg(
      {
        name: { contains: "smith", mode: "insensitive" },
        pseudonymizedId: { contains: "x", mode: "insensitive" },
      },
      ["name"],
    );

    expect(result).toEqual({
      name: { contains: "smith", mode: "insensitive" },
    });
  });

  test("returns undefined when no fields are allowed", () => {
    const result = buildSearchArg(
      { auth0Sub: { contains: "x", mode: "insensitive" } },
      ["name"],
    );

    expect(result).toBeUndefined();
  });

  test("returns undefined for an empty allowlist", () => {
    const result = buildSearchArg(
      { name: { contains: "smith", mode: "insensitive" } },
      [],
    );

    expect(result).toBeUndefined();
  });
});
