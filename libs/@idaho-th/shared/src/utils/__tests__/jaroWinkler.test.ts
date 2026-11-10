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

import { jaroWinkler } from "~@idaho-th/shared";

describe("jaroWinkler", () => {
  it("returns 1 for identical strings and 0 when either side is empty", () => {
    expect(jaroWinkler("Hope Housing", "Hope Housing")).toBe(1);
    expect(jaroWinkler("", "abc")).toBe(0);
    expect(jaroWinkler("abc", "")).toBe(0);
  });

  it("scores close names higher than unrelated names for provider search", () => {
    const close = jaroWinkler("hope housing", "hope house");
    const far = jaroWinkler("hope housing", "zzz plaza");
    expect(close).toBeGreaterThan(far);
    expect(close).toBeGreaterThan(0.8);
  });

  it("applies a shared-prefix bonus (Winkler)", () => {
    const withPrefix = jaroWinkler("martha", "marhta");
    const withoutSharedStart = jaroWinkler("martha", "artham");
    expect(withPrefix).toBeGreaterThan(withoutSharedStart);
  });
});
