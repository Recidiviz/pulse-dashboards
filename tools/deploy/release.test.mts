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

import { describe, expect, it } from "vitest";

import { computeNextVersion } from "./release.mts";

describe("computeNextVersion", () => {
  it("bumps the minor of the latest release for a normal deploy", () => {
    expect(computeNextVersion(false, "v5.295.0", "")).toEqual({
      ok: true,
      version: "v5.296.0",
    });
  });

  it("bumps the patch of the nearest matching tag for a cherry-pick deploy", () => {
    // Uses describeTag (a lower minor), NOT the latest release, so CPs patch the right line.
    expect(computeNextVersion(true, "v5.295.0", "v5.290.3")).toEqual({
      ok: true,
      version: "v5.290.4",
    });
  });

  it("reports failure (with the inputs) when the version can't be incremented", () => {
    expect(computeNextVersion(false, "not-a-version", "")).toEqual({
      ok: false,
      versionToIncrement: "not-a-version",
      releaseType: "minor",
    });
  });

  it("reports failure for a cherry-pick with an unparseable describe tag", () => {
    expect(computeNextVersion(true, "v5.295.0", "")).toEqual({
      ok: false,
      versionToIncrement: "",
      releaseType: "patch",
    });
  });
});
