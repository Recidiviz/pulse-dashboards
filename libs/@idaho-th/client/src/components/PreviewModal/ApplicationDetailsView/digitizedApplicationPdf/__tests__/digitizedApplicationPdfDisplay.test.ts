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

import { displayList, displayValue } from "../digitizedApplicationPdfDisplay";

describe("displayValue", () => {
  it("renders booleans, dates, and empty placeholders", () => {
    expect(displayValue(true)).toBe("Yes");
    expect(displayValue(false)).toBe("No");
    expect(displayValue(null)).toBe("—");
    expect(displayValue("")).toBe("—");
    expect(displayValue("null")).toBe("—");
    expect(displayValue("  Jane  ")).toBe("Jane");
    expect(displayValue(new Date("2026-04-20T12:00:00.000Z"))).toMatch(
      /\d{2}\/\d{2}\/2026/,
    );
  });
});

describe("displayList", () => {
  it("joins filtered values or returns the empty placeholder", () => {
    expect(displayList(["Driver License", "null", "State ID"])).toBe(
      "Driver License, State ID",
    );
    expect(displayList([])).toBe("—");
    expect(displayList(null)).toBe("—");
  });
});
