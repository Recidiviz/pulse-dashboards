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

import { parseBackfillRequest } from "../src/backfillRequestSchema";

const ok = (b: unknown) => {
  const r = parseBackfillRequest(b);
  if ("error" in r) throw new Error(`expected success, got: ${r.error}`);
  return r.request;
};
const err = (b: unknown) => {
  const r = parseBackfillRequest(b);
  if (!("error" in r)) throw new Error("expected an error");
  return r.error;
};

describe("parity with the hand-written extractors", () => {
  test("an empty body is a whole-collection run", () => {
    expect(ok({})).toEqual({});
    expect(ok(undefined)).toEqual({});
  });

  test("null reads the same as absent", () => {
    expect(
      ok({ stateCode: null, system: null, sourceCollection: null }),
    ).toEqual({});
  });

  test("a padded value is refused rather than trimmed", () => {
    expect(err({ stateCode: " US_TN " })).toContain("stateCode");
  });

  test("a three-letter tenant is valid", () => {
    expect(ok({ stateCode: "US_NYC" }).stateCode).toBe("US_NYC");
  });

  test.each(["us_tn", "TN", "US_TENN", ""])("rejects stateCode %p", (s) => {
    expect(err({ stateCode: s })).toContain("stateCode");
  });

  test.each(["supervision", "PAROLE", "", 7, true])(
    "rejects system %p",
    (s) => {
      expect(err({ collections: ["opportunities"], system: s })).toContain(
        "system",
      );
    },
  );

  test("a source with no system is refused", () => {
    expect(err({ sourceCollection: "US_TN-x" })).toContain(
      "system is required",
    );
  });

  test("a source with a system is accepted", () => {
    expect(ok({ sourceCollection: "US_TN-x", system: "SUPERVISION" })).toEqual({
      sourceCollection: "US_TN-x",
      system: "SUPERVISION",
    });
  });
});

describe("where it is STRICTER than the extractors", () => {
  test("a string `collections` is refused, not treated as no filter", () => {
    // Reading this as "no filter" runs EVERY collection, and the prune then
    // deletes whatever is out of scope.
    expect(err({ collections: "clients" })).toContain("collections");
  });

  test("a non-string inside `collections` is refused, not dropped", () => {
    expect(err({ collections: ["clients", 5] })).toContain("collections");
  });

  test("an empty `collections` is refused", () => {
    expect(err({ collections: [] })).toContain("collections");
  });

  test("a blank sourceCollection is refused, not ignored", () => {
    expect(err({ sourceCollection: "   " })).toContain("sourceCollection");
  });
});
