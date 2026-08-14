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

import { describe, expect, test } from "vitest";

import { generateConfigKey } from "~@meetings/config";

describe("generateConfigKey", () => {
  test("formats state code, agency version, and base version into a stable key", () => {
    const config = {
      stateCode: "US_NE",
      version: 1,
      baseVersion: 1,
    } as Parameters<typeof generateConfigKey>[0];
    expect(generateConfigKey(config)).toBe("US_NE@v1-base@v1");
  });

  test("reflects agency version changes", () => {
    const config = {
      stateCode: "US_NE",
      version: 2,
      baseVersion: 1,
    } as Parameters<typeof generateConfigKey>[0];
    expect(generateConfigKey(config)).toBe("US_NE@v2-base@v1");
  });

  test("reflects base version changes", () => {
    const config = {
      stateCode: "US_NE",
      version: 1,
      baseVersion: 3,
    } as Parameters<typeof generateConfigKey>[0];
    expect(generateConfigKey(config)).toBe("US_NE@v1-base@v3");
  });
});
