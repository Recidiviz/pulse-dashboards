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

import type { MuPdfPage } from "~@idaho-th/trpc/pdfSorter/mupdf.types";
import {
  applyPageRotation,
  getPageRotationDegrees,
} from "~@idaho-th/trpc/pdfSorter/pdf/rotation";

/**
 * The subset of mupdf's page object these two functions touch. Driving them
 * through a stand-in keeps the rotation arithmetic testable without the WASM
 * module.
 */
function buildPage(rotate?: unknown) {
  const state = { rotate };
  const pageObject = {
    get: vi.fn((key: string) => {
      if (key !== "Rotate") return undefined;
      const value = state.rotate;
      if (value === undefined) return undefined;
      return {
        isNull: () => value === null,
        isNumber: () => typeof value === "number",
        asNumber: () => value as number,
      };
    }),
    put: vi.fn((key: string, value: unknown) => {
      if (key === "Rotate") state.rotate = value;
    }),
  };

  return {
    state,
    pageObject,
    page: { getObject: () => pageObject } as unknown as MuPdfPage,
  };
}

describe("getPageRotationDegrees", () => {
  it.each([0, 90, 180, 270])("reads a %i degree Rotate entry", (degrees) => {
    expect(getPageRotationDegrees(buildPage(degrees).page)).toBe(degrees);
  });

  it.each([
    ["an absent entry", undefined],
    ["a null entry", null],
    ["a non-numeric entry", "180"],
  ])("defaults to 0 for %s", (_label, rotate) => {
    expect(getPageRotationDegrees(buildPage(rotate).page)).toBe(0);
  });
});

describe("applyPageRotation", () => {
  it("writes nothing when there is no rotation to apply", () => {
    const { page, pageObject } = buildPage(90);

    applyPageRotation(page, 0);

    expect(pageObject.put).not.toHaveBeenCalled();
  });

  it("adds the rotation to the page's existing value", () => {
    const { page, state } = buildPage(90);

    applyPageRotation(page, 180);

    expect(state.rotate).toBe(270);
  });

  it("wraps past a full turn", () => {
    const { page, state } = buildPage(270);

    applyPageRotation(page, 180);

    expect(state.rotate).toBe(90);
  });

  it("treats a page with no Rotate entry as 0 degrees", () => {
    const { page, state } = buildPage(undefined);

    applyPageRotation(page, 180);

    expect(state.rotate).toBe(180);
  });

  it("is idempotent over two 180 degree turns", () => {
    const { page, state } = buildPage(0);

    applyPageRotation(page, 180);
    applyPageRotation(page, 180);

    expect(state.rotate).toBe(0);
  });
});
