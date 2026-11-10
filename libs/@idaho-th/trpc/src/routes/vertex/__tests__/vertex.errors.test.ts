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

import {
  formatVertexErrorForLog,
  handleVertexError,
  isNonRetryableVertexExtractionError,
  VertexExtractionError,
  VertexExtractionTimeoutError,
  VertexQuotaExceededError,
  VertexResponseValidationError,
  VertexSafetyBlockedError,
} from "../vertex.errors";

describe("Vertex error classes", () => {
  it("are server-caused unless a throw site says the document caused them", () => {
    expect(new VertexExtractionError("boom").userCaused).toBe(false);
    expect(
      new VertexExtractionError("boom", { userCaused: true }).userCaused,
    ).toBe(true);
    expect(new VertexResponseValidationError("bad shape").userCaused).toBe(
      false,
    );
  });

  it("all derive from VertexExtractionError and carry their own name", () => {
    const errors = [
      new VertexExtractionError("boom"),
      new VertexQuotaExceededError(),
      new VertexSafetyBlockedError(),
      new VertexResponseValidationError("bad shape"),
      new VertexExtractionTimeoutError("timed out"),
    ];

    expect(errors.map((error) => error.name)).toEqual([
      "VertexExtractionError",
      "VertexQuotaExceededError",
      "VertexSafetyBlockedError",
      "VertexResponseValidationError",
      "VertexExtractionTimeoutError",
    ]);
    expect(
      errors.every((error) => error instanceof VertexExtractionError),
    ).toBe(true);
  });

  it("preserves the cause chain", () => {
    const cause = new Error("underlying");
    const error = new VertexResponseValidationError("bad shape", { cause });

    expect(error.cause).toBe(cause);
  });
});

describe("isNonRetryableVertexExtractionError", () => {
  it.each([
    ["validation", new VertexResponseValidationError("bad shape")],
    ["safety", new VertexSafetyBlockedError()],
    ["quota", new VertexQuotaExceededError()],
  ])("treats a %s failure as non-retryable", (_label, error) => {
    expect(isNonRetryableVertexExtractionError(error)).toBe(true);
  });

  it.each([
    ["a timeout", new VertexExtractionTimeoutError("timed out")],
    ["a generic extraction error", new VertexExtractionError("boom")],
    ["a plain Error", new Error("boom")],
    ["a non-error value", "boom"],
  ])("treats %s as retryable", (_label, error) => {
    expect(isNonRetryableVertexExtractionError(error)).toBe(false);
  });
});

describe("formatVertexErrorForLog", () => {
  it("reduces an Error to its name and message", () => {
    expect(formatVertexErrorForLog(new VertexQuotaExceededError())).toEqual({
      errorName: "VertexQuotaExceededError",
      errorMessage: "Vertex AI quota exceeded",
    });
  });

  it("stringifies a non-Error value", () => {
    expect(formatVertexErrorForLog({ weird: true })).toEqual({
      errorReason: "[object Object]",
    });
  });

  // The log record must never carry the raw payload: extraction errors are
  // raised on housing application PDFs.
  it("emits no field beyond name/message", () => {
    const error = Object.assign(new Error("failed"), {
      applicantName: "Jane Doe",
    });

    expect(Object.keys(formatVertexErrorForLog(error))).toEqual([
      "errorName",
      "errorMessage",
    ]);
  });
});

describe("handleVertexError", () => {
  it.each([
    ["status 429", { status: 429 }],
    ["numeric code 429", { code: 429 }],
    ["string code 429", { code: "429" }],
    ["a quota message", new Error("Resource QUOTA exhausted")],
  ])("maps %s to a quota error", (_label, error) => {
    expect(() => handleVertexError(error)).toThrow(VertexQuotaExceededError);
  });

  it.each([
    ["status 403", { status: 403 }],
    ["a safety message", new Error("Blocked by SAFETY filter")],
  ])("maps %s to a safety error", (_label, error) => {
    expect(() => handleVertexError(error)).toThrow(VertexSafetyBlockedError);
  });

  it("prefers the status over a conflicting message", () => {
    expect(() => handleVertexError({ status: 429, message: "safety" })).toThrow(
      VertexQuotaExceededError,
    );
  });

  it("wraps an unclassified Error, keeping its message and cause", () => {
    const cause = new Error("socket hang up");

    try {
      handleVertexError(cause);
      expect.unreachable("handleVertexError must throw");
    } catch (error) {
      expect(error).toBeInstanceOf(VertexExtractionError);
      expect((error as Error).message).toBe(
        "Vertex AI call failed: socket hang up",
      );
      expect((error as Error).cause).toBe(cause);
    }
  });

  it("falls back to the error name when the message is blank", () => {
    const blank = new Error("   ");
    blank.name = "AbortError";

    expect(() => handleVertexError(blank)).toThrow(
      "Vertex AI call failed: AbortError",
    );
  });

  it("drops an unclassified plain object's fields entirely when none are on the safe allowlist", () => {
    expect(() => handleVertexError({ detail: "nope" })).toThrow(
      "Vertex AI call failed: Unknown Vertex AI error",
    );
  });

  it("keeps only the safe-allowlisted fields of an unclassified plain object", () => {
    expect(() =>
      handleVertexError({ message: "upstream failure", secret: "nope" }),
    ).toThrow('Vertex AI call failed: {"message":"upstream failure"}');
  });

  it("falls back when a safe field's own value can't be serialized", () => {
    const circular: Record<string, unknown> = {};
    circular["message"] = circular;

    expect(() => handleVertexError(circular)).toThrow(
      "Vertex AI call failed: Unknown Vertex AI error",
    );
  });

  it("never echoes a raw primitive into the message", () => {
    expect(() => handleVertexError("plain failure")).toThrow(
      "Vertex AI call failed: Unknown Vertex AI error",
    );
  });

  it("scrubs blobs and emails out of an unclassified Error's message", () => {
    const blob = "C".repeat(500);
    const cause = new Error(
      `upload echo for jane@example.com with payload: ${blob}`,
    );

    expect(() => handleVertexError(cause)).toThrow(
      "Vertex AI call failed: upload echo for [redacted] with payload: [redacted]",
    );
  });

  it("truncates an unclassified Error's message past the length cap", () => {
    const cause = new Error(
      Array.from({ length: 700 }, () => "word").join(" "),
    );

    try {
      handleVertexError(cause);
      expect.unreachable("handleVertexError must throw");
    } catch (error) {
      expect((error as Error).message.endsWith("...[truncated]")).toBe(true);
      expect((error as Error).message.length).toBeLessThan(3050);
    }
  });
});
