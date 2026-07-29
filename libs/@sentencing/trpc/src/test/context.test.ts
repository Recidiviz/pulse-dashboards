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

import { resolveHasSARRouteAccess } from "~@sentencing/trpc/context";

describe("resolveHasSARRouteAccess", () => {
  test("returns false when routes is undefined", () => {
    expect(resolveHasSARRouteAccess(undefined)).toBe(false);
  });

  test("returns false when routes has no sarAccess entry", () => {
    expect(resolveHasSARRouteAccess({ psi_workflowsSupervision: true })).toBe(
      false,
    );
  });

  test("returns false when the sarAccess entry is present but false", () => {
    expect(resolveHasSARRouteAccess({ psi_sarAccess: false })).toBe(false);
  });

  test("returns true when the sarAccess entry is true, regardless of its prefix", () => {
    expect(resolveHasSARRouteAccess({ psi_sarAccess: true })).toBe(true);
    expect(
      resolveHasSARRouteAccess({ some_other_prefix_sarAccess: true }),
    ).toBe(true);
  });

  test("returns true when sarAccess is granted alongside other unrelated routes", () => {
    expect(
      resolveHasSARRouteAccess({
        psi_workflowsSupervision: true,
        psi_sarAccess: true,
        system_prison: false,
      }),
    ).toBe(true);
  });
});
