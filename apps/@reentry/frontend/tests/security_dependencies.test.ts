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

import { createRequire } from "module";
import semver from "semver";
import { describe, expect, it } from "vitest";

/**
 * Dependency Security Floor Tests
 *
 * GHSA-2xp9-vwfh-vxw4: the Next.js Image Optimization API (/_next/image)
 * decoded AVIF images through sharp's bundled libheif, whose heap overflow
 * allowed unauthenticated remote code execution. Next.js 15.5.24 / 16.3.3
 * stop decoding AVIF unless libheif is patched, and sharp 0.35.4 ships the
 * patched libheif 1.23.2. These tests fail if either is downgraded below the
 * fixed releases.
 */

const requireFromHere = createRequire(__filename);
// Resolve sharp the same way Next.js does, from the installed next package.
const requireFromNext = createRequire(
  requireFromHere.resolve("next/package.json"),
);

describe("Dependency security floors", () => {
  it("uses a Next.js release that includes the GHSA-2xp9-vwfh-vxw4 fix", () => {
    const { version } = requireFromHere("next/package.json") as {
      version: string;
    };

    expect(semver.satisfies(version, ">=15.5.24 <16.0.0 || >=16.3.3")).toBe(
      true,
    );
  });

  it("uses a sharp build whose bundled libheif is patched", () => {
    const sharp = requireFromNext("sharp") as typeof import("sharp");

    expect(semver.gte(sharp.versions.sharp, "0.35.4")).toBe(true);
    expect(sharp.versions.heif).toBeDefined();
    expect(semver.gte(sharp.versions.heif ?? "0.0.0", "1.23.2")).toBe(true);
  });
});
