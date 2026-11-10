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

import { buildSortingArg, sortingSchema } from "../sorting";

const ALLOWED_FIELDS = ["expectedReleaseDate", "clientName"];

describe("sorting helpers", () => {
  it("defaults to createdAt desc when sorting is omitted", () => {
    expect(buildSortingArg(undefined, ALLOWED_FIELDS)).toEqual({
      orderBy: { createdAt: "desc" },
    });
  });

  it("passthroughs field and direction for allowlisted dashboard column sorts", () => {
    expect(
      buildSortingArg(
        { field: "expectedReleaseDate", direction: "asc" },
        ALLOWED_FIELDS,
      ),
    ).toEqual({ orderBy: { expectedReleaseDate: "asc" } });
    expect(
      buildSortingArg(
        { field: "clientName", direction: "desc" },
        ALLOWED_FIELDS,
      ),
    ).toEqual({
      orderBy: { clientName: "desc" },
    });
  });

  it("rejects a sort field outside the allowlist", () => {
    expect(() =>
      buildSortingArg(
        { field: "secretColumn", direction: "asc" },
        ALLOWED_FIELDS,
      ),
    ).toThrow(/not an allowed sort field/);
  });

  it("rejects invalid sort directions via Zod", () => {
    expect(() =>
      sortingSchema.parse({ field: "stage", direction: "sideways" }),
    ).toThrow();
    expect(sortingSchema.parse(undefined)).toBeUndefined();
  });
});
