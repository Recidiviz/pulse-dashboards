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

import { errorLogFields } from "~@idaho-th/server/routes/internal/errorLogFields";

describe("errorLogFields", () => {
  it("labels a non-Error throw without inventing a name", () => {
    // Log fields carry no message, so an arbitrary thrown value cannot leak one.
    expect(errorLogFields("provider@example.com")).toEqual({
      errorName: "unknown",
    });
    expect(errorLogFields(undefined)).toEqual({ errorName: "unknown" });
  });

  it("reports the error name and never the message", () => {
    const error = new TypeError("failed for provider@example.com");

    expect(errorLogFields(error)).toEqual({ errorName: "TypeError" });
  });

  it("includes a string code when the error carries one", () => {
    const error = Object.assign(new Error("boom"), { code: "P2002" });

    expect(errorLogFields(error)).toEqual({
      errorName: "Error",
      errorCode: "P2002",
    });
  });

  it("drops a non-string code", () => {
    const error = Object.assign(new Error("boom"), { code: 404 });

    expect(errorLogFields(error)).toEqual({ errorName: "Error" });
  });

  it.each([
    ["a string", "kaboom"],
    ["null", null],
    ["a number", 500],
    ["a plain object", { message: "jane.doe@example.com" }],
  ])("labels a thrown %s as unknown", (_label, thrown) => {
    expect(errorLogFields(thrown)).toEqual({ errorName: "unknown" });
  });

  // The point of this helper is that a caller can spread it into a log line
  // without auditing the error first: the message is the field most likely to
  // carry an email, an address, or a PDF payload.
  it("returns nothing but name and code, however the value was thrown", () => {
    const withPii = new Error("failed for jane.doe@example.com at 12 Main St");

    for (const thrown of [withPii, "jane.doe@example.com", { err: withPii }]) {
      const fields: Record<string, unknown> = errorLogFields(thrown);

      expect(Object.keys(fields)).toEqual(["errorName"]);
      expect(JSON.stringify(fields)).not.toContain("jane.doe@example.com");
      expect(JSON.stringify(fields)).not.toContain("Main St");
    }
  });
});
