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

import { renderHook } from "@testing-library/react";

import { BackTargetProvider } from "./BackTargetContext";
import { useBackTarget } from "./useBackTarget";

describe("useBackTarget", () => {
  it("returns null when nothing has declared a target", () => {
    const { result } = renderHook(() => useBackTarget(), {
      wrapper: BackTargetProvider,
    });

    expect(result.current).toBeNull();
  });

  it("returns the path it's called with", () => {
    const { result } = renderHook(() => useBackTarget("/resources"), {
      wrapper: BackTargetProvider,
    });

    expect(result.current).toBe("/resources");
  });

  it("returns a path with a query string untouched", () => {
    const path =
      "/resources/categories/housing?subcategories=Shelter&tags=spanish";
    const { result } = renderHook(() => useBackTarget(path), {
      wrapper: BackTargetProvider,
    });

    expect(result.current).toBe(path);
  });

  it("updates when called again with a different path", () => {
    const { result, rerender } = renderHook(
      ({ path }: { path?: string }) => useBackTarget(path),
      {
        wrapper: BackTargetProvider,
        initialProps: { path: "/resources" },
      },
    );

    expect(result.current).toBe("/resources");

    rerender({ path: "/resources/categories/housing" });

    expect(result.current).toBe("/resources/categories/housing");
  });

  it("clears back to null when the caller stops declaring a path — e.g. navigating to a page that doesn't declare one", () => {
    const { result, rerender } = renderHook<string | null, { path?: string }>(
      ({ path }) => useBackTarget(path),
      {
        wrapper: BackTargetProvider,
        initialProps: { path: "/resources/categories/housing" },
      },
    );

    expect(result.current).toBe("/resources/categories/housing");

    rerender({ path: undefined });

    expect(result.current).toBeNull();
  });

  it("throws when used outside of a BackTargetProvider", () => {
    expect(() => renderHook(() => useBackTarget())).toThrow(
      "useBackTarget must be used within a BackTargetProvider",
    );
  });
});
