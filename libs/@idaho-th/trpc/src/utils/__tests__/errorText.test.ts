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

import { formatErrorForLog, scrubErrorText } from "../errorText";

describe("scrubErrorText", () => {
  it("leaves ordinary short text untouched", () => {
    expect(scrubErrorText("socket hang up")).toBe("socket hang up");
  });

  it("redacts an unbroken base64-ish blob", () => {
    const blob = "A".repeat(500);
    expect(scrubErrorText(`upload failed: ${blob}`)).toBe(
      "upload failed: [redacted]",
    );
  });

  it("redacts an email address", () => {
    expect(scrubErrorText("delivery failed for jane@example.com")).toBe(
      "delivery failed for [redacted]",
    );
  });

  it("truncates text past the length cap", () => {
    const long = Array.from({ length: 700 }, () => "word").join(" ");
    const scrubbed = scrubErrorText(long);
    expect(scrubbed.endsWith("...[truncated]")).toBe(true);
    expect(scrubbed.length).toBeLessThan(long.length);
  });
});

describe("formatErrorForLog", () => {
  it("reduces an Error to its name and scrubbed message", () => {
    expect(formatErrorForLog(new Error("boom"))).toEqual({
      errorName: "Error",
      errorMessage: "boom",
    });
  });

  it("never includes the raw error's own enumerable properties", () => {
    const error = Object.assign(new Error("failed"), {
      response: { data: "JVBERi0xLjQ=" },
    });

    expect(Object.keys(formatErrorForLog(error))).toEqual([
      "errorName",
      "errorMessage",
    ]);
  });

  it("scrubs blobs/emails out of an Error message", () => {
    const blob = "B".repeat(500);
    const error = new Error(
      `failed for jane@example.com with payload: ${blob}`,
    );

    expect(formatErrorForLog(error)).toEqual({
      errorName: "Error",
      errorMessage: "failed for [redacted] with payload: [redacted]",
    });
  });

  it("stringifies and scrubs a non-Error value", () => {
    expect(formatErrorForLog({ weird: true })).toEqual({
      errorReason: "[object Object]",
    });
  });
});
