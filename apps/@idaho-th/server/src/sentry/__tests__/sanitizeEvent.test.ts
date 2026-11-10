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

import type { Breadcrumb, ErrorEvent } from "@sentry/node";
import { z } from "zod";

import {
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
} from "~@idaho-th/server/sentry/sanitizeEvent";

describe("sanitizeSentryEvent", () => {
  it("removes request body, query string, cookies, and auth headers", () => {
    const event = {
      exception: {
        values: [{ type: "Error", value: "boom", stacktrace: { frames: [] } }],
      },
      request: {
        method: "POST",
        url: "https://housing-stg.recidiviz.org/api/trpc/draftIntake.extractContent?fileName=Jane%20Doe.pdf",
        query_string: "fileName=Jane%20Doe.pdf",
        cookies: { session: "secret" },
        data: { pdfBase64: "JVBERi0xLjQ=", email: "jane@example.com" },
        headers: {
          authorization: "Bearer secret-token",
          cookie: "session=secret",
          "content-type": "application/json",
          "user-agent": "vitest",
        },
      },
      environment: "staging",
    } as unknown as ErrorEvent;

    const sanitized = sanitizeSentryEvent(event);

    expect(sanitized.exception?.values?.[0]?.type).toBe("Error");
    expect(sanitized.exception?.values?.[0]?.value).toBe("boom");
    expect(sanitized.environment).toBe("staging");
    expect(sanitized.request?.method).toBe("POST");
    expect(sanitized.request?.url).toBe(
      "https://housing-stg.recidiviz.org/api/trpc/draftIntake.extractContent",
    );
    expect(sanitized.request?.query_string).toBeUndefined();
    expect(sanitized.request?.cookies).toBeUndefined();
    expect(sanitized.request?.data).toBeUndefined();
    expect(sanitized.request?.headers).toEqual({
      "content-type": "application/json",
      "user-agent": "vitest",
    });
  });

  it("removes user email/ip and tRPC input context", () => {
    const event = {
      user: {
        id: "staff-pseudo-1",
        email: "staff@example.com",
        ip_address: "203.0.113.10",
      },
      contexts: {
        trpc: {
          procedure: "housingApplication.create",
          input: {
            clientFullName: "Jane Doe",
            ssnLast4: "1234",
            pdfBase64: "JVBERi0xLjQ=",
          },
        },
      },
    } as unknown as ErrorEvent;

    const sanitized = sanitizeSentryEvent(event);

    expect(sanitized.user).toEqual({ id: "staff-pseudo-1" });
    expect(sanitized.contexts?.["trpc"]).toEqual({
      procedure: "housingApplication.create",
    });
  });

  it("drops a ZodError exception value, which quotes the values it rejected, and keeps the rest of the chain", () => {
    const zodError = new z.ZodError([
      {
        code: "invalid_enum_value",
        options: ["Parent", "Sibling"],
        path: ["relation"],
        message: "Invalid enum value",
        received: "Jane Q Public",
      },
    ]);
    const event = {
      exception: {
        values: [
          { type: "ZodError", value: zodError.message },
          { type: "VertexResponseValidationError", value: "validation failed" },
        ],
      },
    } as unknown as ErrorEvent;

    const sanitized = sanitizeSentryEvent(event);

    expect(sanitized.exception?.values).toEqual([
      { type: "VertexResponseValidationError", value: "validation failed" },
    ]);
    expect(JSON.stringify(sanitized)).not.toContain("Jane Q Public");
  });

  it("truncates an oversized exception message", () => {
    const long = Array.from({ length: 700 }, () => "word").join(" ");
    const event = {
      exception: {
        values: [{ type: "Error", value: long }],
      },
    } as unknown as ErrorEvent;

    const sanitized = sanitizeSentryEvent(event);
    const value = sanitized.exception?.values?.[0]?.value ?? "";

    expect(value.endsWith("...[truncated]")).toBe(true);
    expect(value.length).toBeLessThan(long.length);
  });

  it("redacts an unbroken blob and an email address in the exception message", () => {
    const blob = "A".repeat(500);
    const event = {
      exception: {
        values: [
          {
            type: "Error",
            value: `upload failed for jane@example.com with payload: ${blob}`,
          },
        ],
      },
    } as unknown as ErrorEvent;

    const sanitized = sanitizeSentryEvent(event);

    expect(sanitized.exception?.values?.[0]?.value).toBe(
      "upload failed for [redacted] with payload: [redacted]",
    );
  });

  it("scrubs event.message the same way, for captureMessage() events", () => {
    const blob = "A".repeat(500);
    const event = {
      message: `digest job failed for jane@example.com with payload: ${blob}`,
    } as unknown as ErrorEvent;

    const sanitized = sanitizeSentryEvent(event);

    expect(sanitized.message).toBe(
      "digest job failed for [redacted] with payload: [redacted]",
    );
  });

  it("strips the query string from the Referer header", () => {
    const event = {
      request: {
        method: "GET",
        headers: {
          referer:
            "https://housing-stg.recidiviz.org/staff/search?query=Jane+Doe",
        },
      },
    } as unknown as ErrorEvent;

    const sanitized = sanitizeSentryEvent(event);

    expect(sanitized.request?.headers).toEqual({
      referer: "https://housing-stg.recidiviz.org/staff/search",
    });
  });

  it("drops request/user fields that aren't on the explicit allowlist, even ones not named anywhere in this file", () => {
    const event = {
      request: {
        method: "GET",
        url: "https://housing-stg.recidiviz.org/api/trpc/housingApplication.getByStaff",
        env: { REMOTE_ADDR: "203.0.113.10" },
        headers: { "x-api-key": "future-header-nobody-allowlisted-yet" },
      },
      user: {
        id: "staff-pseudo-1",
        username: "jane.doe",
        geo: { country_code: "US", region: "ID", city: "Boise" },
      },
    } as unknown as ErrorEvent;

    const sanitized = sanitizeSentryEvent(event);

    expect(sanitized.request?.method).toBe("GET");
    expect(sanitized.request).not.toHaveProperty("env");
    expect(sanitized.request?.headers).toEqual({});
    expect(sanitized.user).toEqual({ id: "staff-pseudo-1" });
  });

  // A real crash rarely produces a fully populated event: a hook that fails
  // before routing captures a request with no headers, captureException on a
  // non-Error yields an exception value with no `value`, and an unauthorized
  // request has no user id. Each shape takes a different arm of the rebuild.
  describe("partially populated events", () => {
    it("keeps an exception value that has no message, rather than scrubbing undefined", () => {
      const event = {
        exception: {
          values: [
            { type: "Error", stacktrace: { frames: [] } },
            { type: "Error", value: "boom" },
          ],
        },
      } as ErrorEvent;

      const sanitized = sanitizeSentryEvent(event);

      expect(sanitized.exception?.values?.[0]).toEqual({
        type: "Error",
        stacktrace: { frames: [] },
      });
      expect(sanitized.exception?.values?.[1]?.value).toBe("boom");
    });

    it("omits method when the captured request has none", () => {
      const event = {
        request: { url: "https://example.com/trpc/foo?input=%7B%7D" },
      } as ErrorEvent;

      expect(sanitizeSentryEvent(event).request).toEqual({
        url: "https://example.com/trpc/foo",
      });
    });

    it("omits headers when the captured request has none", () => {
      const event = {
        request: { method: "POST", url: "https://example.com/trpc/foo" },
      } as ErrorEvent;

      const sanitized = sanitizeSentryEvent(event);

      expect(sanitized.request).toEqual({
        method: "POST",
        url: "https://example.com/trpc/foo",
      });
      expect(sanitized.request).not.toHaveProperty("headers");
    });

    it("returns an empty request when it carries no allowlisted field at all", () => {
      const event = {
        request: { data: { pdfBase64: "JVBERi0xLjQ=" }, cookies: { sid: "x" } },
      } as unknown as ErrorEvent;

      expect(sanitizeSentryEvent(event).request).toEqual({});
    });

    it("empties the user object when it carries PII but no id", () => {
      const event = {
        user: { email: "jane.doe@example.com", ip_address: "203.0.113.7" },
      } as ErrorEvent;

      expect(sanitizeSentryEvent(event).user).toEqual({});
    });

    it("leaves an event with no request, user, exception or message untouched", () => {
      const event = { environment: "test" } as ErrorEvent;

      expect(sanitizeSentryEvent(event)).toEqual({ environment: "test" });
    });
  });
});

describe("sanitizeSentryBreadcrumb", () => {
  it("redacts console breadcrumb payloads", () => {
    const breadcrumb = {
      category: "console",
      level: "error",
      message: "Error in tRPC handler on path 'housingApplication.create':",
      data: {
        arguments: [{ email: "jane@example.com", pdfBase64: "abc" }],
      },
    } as Breadcrumb;

    expect(sanitizeSentryBreadcrumb(breadcrumb)).toEqual({
      category: "console",
      level: "error",
      message: "[console output redacted]",
      data: undefined,
    });
  });

  it("strips sensitive keys from non-console breadcrumb data", () => {
    const breadcrumb = {
      category: "http",
      data: {
        url: "https://example.com/health",
        input: { email: "jane@example.com" },
        authorization: "Bearer secret",
        status_code: 500,
      },
    } as Breadcrumb;

    expect(sanitizeSentryBreadcrumb(breadcrumb)).toEqual({
      category: "http",
      data: {
        url: "https://example.com/health",
        status_code: 500,
      },
    });
  });

  it("strips the query string embedded in breadcrumb data.url", () => {
    const breadcrumb = {
      category: "http",
      data: {
        url: "https://housing-stg.recidiviz.org/api/trpc/housingApplication.getByStaff?batch=1&input=%7B%22search%22%3A%22Jane%22%7D",
        status_code: 200,
      },
    } as Breadcrumb;

    expect(sanitizeSentryBreadcrumb(breadcrumb)).toEqual({
      category: "http",
      data: {
        url: "https://housing-stg.recidiviz.org/api/trpc/housingApplication.getByStaff",
        status_code: 200,
      },
    });
  });

  it("drops breadcrumb data fields that aren't on the explicit allowlist, even ones not named anywhere in this file", () => {
    const breadcrumb = {
      category: "query",
      data: {
        url: "https://example.com/health",
        status_code: 200,
        email: "jane@example.com",
        pdfBase64: "JVBERi0xLjQ=",
        params: ["jane@example.com", "203-555-0100"],
      },
    } as Breadcrumb;

    expect(sanitizeSentryBreadcrumb(breadcrumb)).toEqual({
      category: "query",
      data: {
        url: "https://example.com/health",
        status_code: 200,
      },
    });
  });
  it("redacts a console breadcrumb that has no message", () => {
    const breadcrumb = {
      category: "console",
      level: "warn",
      data: { arguments: ["jane.doe@example.com"] },
    } as unknown as Breadcrumb;

    expect(sanitizeSentryBreadcrumb(breadcrumb)).toEqual({
      category: "console",
      level: "warn",
      message: undefined,
      data: undefined,
    });
  });

  it("leaves a non-console breadcrumb with no data untouched", () => {
    const breadcrumb = { category: "navigation", level: "info" } as Breadcrumb;

    expect(sanitizeSentryBreadcrumb(breadcrumb)).toEqual({
      category: "navigation",
      level: "info",
    });
  });
});
