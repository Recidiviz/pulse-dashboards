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

import { QueryClient } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";

import { calendarApiError } from "../../fixtures";
import {
  calendarRetry,
  editorErrorMessage,
  GENERIC_CALENDAR_ERROR_MESSAGE,
  getCalendarErrorCode,
  getCalendarErrorMessage,
  isEditorFacingCalendarError,
} from "../errors";

describe("getCalendarErrorCode", () => {
  it("reads the tRPC code of a server error", () => {
    expect(
      getCalendarErrorCode(calendarApiError("NOT_FOUND", "Entry not found")),
    ).toBe("NOT_FOUND");
  });

  it.each([
    ["a client error with no response", new TRPCClientError("fetch failed")],
    ["a plain Error", new Error("Network error")],
    ["a string", "oops"],
    ["undefined", undefined],
  ])("returns undefined for %s", (_, error) => {
    expect(getCalendarErrorCode(error)).toBeUndefined();
  });
});

describe("getCalendarErrorMessage", () => {
  it.each([
    ["CONFLICT", "This hearing was just changed by Editor A."],
    ["PRECONDITION_FAILED", "This month changed since you reviewed it."],
    ["NOT_FOUND", "This month isn't available."],
    ["BAD_REQUEST", "Pick a day in November 2026."],
  ] as const)("shows the server's %s message", (code, message) => {
    const error = calendarApiError(code, message);

    expect(isEditorFacingCalendarError(error)).toBe(true);
    expect(getCalendarErrorMessage(error)).toBe(message);
  });

  it("hides an input validation failure, whose message is the zod issues", () => {
    const error = calendarApiError(
      "BAD_REQUEST",
      '[\n  {\n    "code": "too_small",\n    "path": ["monthId"]\n  }\n]',
    );

    expect(isEditorFacingCalendarError(error)).toBe(false);
    expect(getCalendarErrorMessage(error)).toBe(GENERIC_CALENDAR_ERROR_MESSAGE);
  });

  it.each([
    ["an internal error", calendarApiError("INTERNAL_SERVER_ERROR", "db down")],
    ["a forbidden error", calendarApiError("FORBIDDEN", "No access")],
    [
      "a stub",
      calendarApiError(
        "NOT_IMPLEMENTED",
        "Calendar.usCo.paroleBoard.admin.months.get isn't implemented yet",
      ),
    ],
    ["a network failure", new TRPCClientError("fetch failed")],
    ["a non-error", "oops"],
  ])("shows the generic message for %s", (_, error) => {
    expect(isEditorFacingCalendarError(error)).toBe(false);
    expect(getCalendarErrorMessage(error)).toBe(GENERIC_CALENDAR_ERROR_MESSAGE);
  });
});

describe("editorErrorMessage", () => {
  it("shows the server's message when it was written for editors", () => {
    const error = calendarApiError("CONFLICT", "FCF is already on November 3.");

    expect(editorErrorMessage(error, "We couldn't add this hearing.")).toBe(
      "FCF is already on November 3.",
    );
  });

  it("shows the fallback for any other error", () => {
    expect(
      editorErrorMessage(
        calendarApiError("INTERNAL_SERVER_ERROR", "db down"),
        "We couldn't add this hearing.",
      ),
    ).toBe("We couldn't add this hearing.");
  });
});

describe("calendarRetry", () => {
  it("never retries an error the server wrote for editors", () => {
    const retry = calendarRetry(new QueryClient());

    expect(
      retry(
        0,
        calendarApiError(
          "PRECONDITION_FAILED",
          "November 2026 isn't a draft any more.",
        ),
      ),
    ).toBe(false);
  });

  it("retries other errors three times when the QueryClient sets no retry", () => {
    const retry = calendarRetry(new QueryClient());
    const error = new TRPCClientError("fetch failed");

    expect(retry(2, error)).toBe(true);
    expect(retry(3, error)).toBe(false);
  });

  it.each([
    ["false", false, false],
    ["a count", 1, false],
    ["a function", () => true, true],
  ] as const)(
    "follows the QueryClient's default retry when it is %s",
    (_, retry, expected) => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry } },
      });

      expect(
        calendarRetry(queryClient)(1, new TRPCClientError("fetch failed")),
      ).toBe(expected);
    },
  );
});
