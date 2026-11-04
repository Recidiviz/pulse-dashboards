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

import { afterEach, beforeAll, describe, expect, test } from "vitest";

import {
  isNetworkFailure,
  isPageUnloading,
  isUnloadCancellation,
  trackPageUnload,
} from "./exceptions";

const leavePage = () => window.dispatchEvent(new Event("pagehide"));
const returnToPage = () => window.dispatchEvent(new Event("pageshow"));

describe("isNetworkFailure", () => {
  test.each([
    ["Chrome and Edge", "Failed to fetch"],
    ["Firefox", "NetworkError when attempting to fetch resource."],
    ["Safari", "Load failed"],
  ])("recognizes what %s raises", (_engine, message) => {
    expect(isNetworkFailure(new TypeError(message))).toBe(true);
  });

  test("an ordinary TypeError is not one", () => {
    expect(isNetworkFailure(new TypeError("x.map is not a function"))).toBe(
      false,
    );
  });

  test("an Error with the same message is not one", () => {
    expect(isNetworkFailure(new Error("Failed to fetch"))).toBe(false);
  });

  test.each([undefined, null, "Failed to fetch"])("%p is not one", (thrown) => {
    expect(isNetworkFailure(thrown)).toBe(false);
  });
});

describe("isUnloadCancellation", () => {
  beforeAll(() => {
    trackPageUnload();
  });

  afterEach(() => {
    returnToPage();
  });

  test("a network failure while the page unloads is one", () => {
    leavePage();

    expect(isUnloadCancellation(new TypeError("Failed to fetch"))).toBe(true);
  });

  test("a network failure on a live page is not one", () => {
    // A CORS block, a DNS failure, or a dropped connection. These must still
    // report.
    expect(isUnloadCancellation(new TypeError("Failed to fetch"))).toBe(false);
  });

  test("a real bug while the page unloads is not one", () => {
    leavePage();

    expect(isUnloadCancellation(new TypeError("x.map is not a function"))).toBe(
      false,
    );
    expect(
      isUnloadCancellation(
        new Error("Typesense scoped-key mint failed: 502 Bad Gateway"),
      ),
    ).toBe(false);
  });

  test("a page restored from the back/forward cache is live again", () => {
    leavePage();
    returnToPage();

    expect(isPageUnloading()).toBe(false);
  });
});
