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

import { setTimeout } from "node:timers/promises";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createContact,
  upsertContact,
} from "~@idaho-th/trpc/intercom/intercom.contacts";
import {
  IntercomApiError,
  IntercomCodedError,
  intercomErrorCode,
  intercomRequest,
} from "~@idaho-th/trpc/intercom/intercom.http";
import { intercomCreateMessage } from "~@idaho-th/trpc/intercom/intercom.messages";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** How a proxy or load balancer typically serves a 5xx. */
function htmlResponse(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html" },
  });
}

/**
 * Awaits a rejection and narrows it, failing loudly if the call resolved instead
 * — a cast on `.catch` would silently pass in that case.
 */
async function captureIntercomError(
  promise: Promise<unknown>,
): Promise<IntercomApiError> {
  try {
    await promise;
  } catch (err) {
    if (err instanceof IntercomApiError) return err;
    throw err;
  }
  throw new Error("expected the Intercom request to reject");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("intercomRequest", () => {
  it("retries retryable 503 then succeeds", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(503, { errors: [{ message: "busy" }] }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { id: "ok" }));

    const result = await intercomRequest("GET", "/contacts/x", {
      token: "t",
      fetchFn,
      maxAttempts: 3,
      baseUrl: "https://api.intercom.io",
    });

    expect(result.data).toEqual({ id: "ok" });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("does not retry 400", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse(400, { errors: [{ message: "bad" }] }));

    await expect(
      intercomRequest("GET", "/contacts/x", {
        token: "t",
        fetchFn,
        maxAttempts: 3,
        baseUrl: "https://api.intercom.io",
      }),
    ).rejects.toMatchObject({ status: 400, retryable: false });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  // A proxy or load balancer serves 5xx as an HTML page. The status, not the
  // body, decides the code and whether we retry — parsing the body strictly here
  // would report intercom_invalid_response and give up on a transient failure.
  it("retries an HTML 503 and reports it by status, not by body", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(htmlResponse(503, "<html><body>Bad Gateway"))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await expect(
      intercomRequest("GET", "/contacts/x", {
        token: "t",
        fetchFn,
        maxAttempts: 3,
        baseUrl: "https://api.intercom.io",
      }),
    ).resolves.toEqual({ status: 200, data: { ok: true } });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("keeps an HTML 429 retryable so Retry-After is honoured", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response("<html>Too Many Requests</html>", {
        status: 429,
        headers: { "Content-Type": "text/html", "Retry-After": "0" },
      }),
    );

    await expect(
      intercomRequest("POST", "/contacts", {
        token: "t",
        fetchFn,
        maxAttempts: 2,
        baseUrl: "https://api.intercom.io",
      }),
    ).rejects.toMatchObject({
      status: 429,
      code: "intercom_rate_limited",
      retryable: true,
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("keeps an unparseable error body as opaque, truncated detail", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(htmlResponse(500, `<html>${"x".repeat(900)}</html>`));

    const err = await captureIntercomError(
      intercomRequest("GET", "/contacts/x", {
        token: "t",
        fetchFn,
        maxAttempts: 1,
        baseUrl: "https://api.intercom.io",
      }),
    );

    expect(err.code).toBe("intercom_upstream_unavailable");
    expect(err.detail?.length).toBeLessThanOrEqual(501);
    // Diagnostics only: third-party text must stay off any serialized surface.
    expect(Object.keys(err)).not.toContain("detail");
    expect(JSON.stringify(err)).not.toContain("xxx");
  });

  it("still rejects an unparseable 200 as an unusable response", async () => {
    const fetchFn = vi.fn().mockResolvedValue(htmlResponse(200, "<html>nope"));

    await expect(
      intercomRequest("GET", "/contacts/x", {
        token: "t",
        fetchFn,
        maxAttempts: 3,
        baseUrl: "https://api.intercom.io",
      }),
    ).rejects.toMatchObject({
      code: "intercom_invalid_response",
      retryable: false,
    });
    // Not retried: the write may have landed, so a replay risks a duplicate.
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("treats an empty error body as the status alone", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 502 }));

    const err = await captureIntercomError(
      intercomRequest("GET", "/contacts/x", {
        token: "t",
        fetchFn,
        maxAttempts: 1,
        baseUrl: "https://api.intercom.io",
      }),
    );

    expect(err.code).toBe("intercom_upstream_unavailable");
    expect(err.detail).toBeUndefined();
  });
});

describe("intercomRequest Retry-After against the deadline", () => {
  function rateLimited(retryAfterSeconds: string) {
    return () =>
      new Response(JSON.stringify({ errors: [{ message: "slow down" }] }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfterSeconds,
        },
      });
  }

  // The deadline spans every attempt, so a Retry-After longer than what is left
  // would leave the retry no time to run. Report the rate limit — the actionable,
  // still-retryable code — rather than spending the budget to report a timeout.
  it("surfaces the rate limit instead of burning the deadline on the wait", async () => {
    const fetchFn = vi.fn().mockImplementation(rateLimited("5"));

    const err = await captureIntercomError(
      intercomRequest("POST", "/contacts", {
        token: "t",
        fetchFn,
        maxAttempts: 3,
        timeoutMs: 50,
        baseUrl: "https://api.intercom.io",
      }),
    );

    // This code *is* the proof the guard fired: without it the call would sleep
    // into the 50ms deadline, the signal would abort mid-wait, and the code would
    // be intercom_timeout instead. No clock assertion needed to distinguish them.
    expect(err.code).toBe("intercom_rate_limited");
    expect(err.retryable).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("honours a Retry-After that fits inside the remaining deadline", async () => {
    const fetchFn = vi
      .fn()
      .mockImplementationOnce(rateLimited("0"))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await expect(
      intercomRequest("POST", "/contacts", {
        token: "t",
        fetchFn,
        maxAttempts: 3,
        baseUrl: "https://api.intercom.io",
      }),
    ).resolves.toEqual({ status: 200, data: { ok: true } });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  // A caller-supplied signal keeps its own deadline, so the guard above cannot
  // see it — an abort can still land inside the wait, and must not escape raw.
  it("restates a caller signal aborting mid-wait as intercom_timeout", async () => {
    const fetchFn = vi.fn().mockImplementation(rateLimited("1"));

    const err = await captureIntercomError(
      intercomRequest("POST", "/contacts", {
        token: "t",
        fetchFn,
        maxAttempts: 3,
        signal: AbortSignal.timeout(30),
        baseUrl: "https://api.intercom.io",
      }),
    );

    expect(err.code).toBe("intercom_timeout");
    expect(err.retryable).toBe(false);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe("intercomRequest shouldRetry option", () => {
  it("lets a caller policy veto a retry the default would make", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse(503, { errors: [{ message: "busy" }] }));

    const err = await captureIntercomError(
      intercomRequest("GET", "/contacts/x", {
        token: "t",
        fetchFn,
        maxAttempts: 3,
        baseUrl: "https://api.intercom.io",
        shouldRetry: () => false,
      }),
    );

    expect(err.code).toBe("intercom_upstream_unavailable");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("skips the Retry-After wait for an attempt the policy won't retry", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ message: "busy" }] }), {
        status: 503,
        headers: { "Content-Type": "application/json", "Retry-After": "5" },
      }),
    );
    const startedAt = Date.now();

    const err = await captureIntercomError(
      intercomRequest("GET", "/contacts/x", {
        token: "t",
        fetchFn,
        maxAttempts: 3,
        timeoutMs: 10_000,
        baseUrl: "https://api.intercom.io",
        shouldRetry: () => false,
      }),
    );

    expect(err.code).toBe("intercom_upstream_unavailable");
    expect(Date.now() - startedAt).toBeLessThan(1000);
  });
});

describe("intercomCreateMessage retries", () => {
  const message = {
    message_type: "email",
    subject: "Hello",
    body: "<p>Hi</p>",
    template: "plain",
    from: { type: "admin", id: "99" },
    to: { type: "user", id: "contact-1" },
  } as const;

  it("does not retry a 5xx, which can follow a message Intercom already created", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse(503, { errors: [{ message: "busy" }] }));

    const err = await captureIntercomError(
      intercomCreateMessage(message, {
        token: "t",
        fetchFn,
        baseUrl: "https://api.intercom.io",
      }),
    );

    expect(err.code).toBe("intercom_upstream_unavailable");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("does not retry a network error", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError("fetch failed"));

    const err = await captureIntercomError(
      intercomCreateMessage(message, {
        token: "t",
        fetchFn,
        baseUrl: "https://api.intercom.io",
      }),
    );

    expect(err.code).toBe("intercom_network_error");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("retries a 429, which Intercom rejected before creating anything", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ errors: [{ message: "slow down" }] }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "0" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { id: "msg-1" }));

    const result = await intercomCreateMessage(message, {
      token: "t",
      fetchFn,
      baseUrl: "https://api.intercom.io",
    });

    expect(result.data?.id).toBe("msg-1");
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("keeps its own policy even when the caller passes one", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse(503, { errors: [{ message: "busy" }] }));

    await captureIntercomError(
      intercomCreateMessage(message, {
        token: "t",
        fetchFn,
        baseUrl: "https://api.intercom.io",
        shouldRetry: () => true,
      }),
    );

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe("intercomCreateMessage", () => {
  it("POSTs /messages with the email payload", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { id: "msg-1", type: "admin_message" }),
      );

    const result = await intercomCreateMessage(
      {
        message_type: "email",
        subject: "Hello",
        body: "<p>Hi</p>",
        template: "plain",
        from: { type: "admin", id: "99" },
        to: { type: "user", id: "contact-1" },
      },
      { token: "t", fetchFn, baseUrl: "https://api.intercom.io" },
    );

    expect(result.data?.id).toBe("msg-1");
    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.intercom.io/messages",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("upsertContact", () => {
  it("updates an existing contact via search when create conflicts", async () => {
    const fetchFn = vi
      .fn()
      // create — Intercom already holds this email
      .mockResolvedValueOnce(
        jsonResponse(409, { errors: [{ message: "already exists" }] }),
      )
      // search resolves the id
      .mockResolvedValueOnce(
        jsonResponse(200, { data: [{ id: "c1", email: "a@b.com" }] }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { id: "c1" }));

    await expect(
      upsertContact(
        { email: "a@b.com", externalId: "provider:p1", name: "A" },
        { token: "t", fetchFn, baseUrl: "https://api.intercom.io" },
      ),
    ).resolves.toEqual({ status: "updated", contactId: "c1" });
  });

  it("creates in a single call when no existing contact", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(
      // create — no preceding search
      jsonResponse(200, { id: "new-1" }),
    );

    await expect(
      upsertContact(
        { email: "a@b.com", externalId: "provider:p1" },
        { token: "t", fetchFn, baseUrl: "https://api.intercom.io" },
      ),
    ).resolves.toEqual({ status: "created", contactId: "new-1" });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("createContact throws when response has no id", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, {}));

    await expect(
      createContact(
        { email: "a@b.com", externalId: "provider:p1" },
        { token: "t", fetchFn, baseUrl: "https://api.intercom.io" },
      ),
    ).rejects.toBeInstanceOf(IntercomApiError);
  });
});

describe("intercomErrorCode", () => {
  it("reports the code carried by an IntercomApiError", () => {
    const err = new IntercomApiError("boom", {
      status: 429,
      code: "intercom_rate_limited",
      retryable: true,
    });

    expect(intercomErrorCode(err)).toBe("intercom_rate_limited");
  });

  it("reports the code carried across a throw by an IntercomCodedError", () => {
    const err = new IntercomCodedError(
      "Could not resolve an Intercom contact (failed)",
      "intercom_upstream_unavailable",
    );

    expect(intercomErrorCode(err)).toBe("intercom_upstream_unavailable");
  });

  it("maps an aborted request deadline to intercom_timeout", async () => {
    const controller = new AbortController();
    controller.abort();
    const aborted = await setTimeout(1, undefined, {
      signal: controller.signal,
    }).catch((err: unknown) => err);

    expect(intercomErrorCode(aborted)).toBe("intercom_timeout");
  });

  it("maps an AbortSignal.timeout rejection to intercom_timeout", async () => {
    const timedOut = await setTimeout(50, undefined, {
      signal: AbortSignal.timeout(1),
    }).catch((err: unknown) => err);

    expect(intercomErrorCode(timedOut)).toBe("intercom_timeout");
  });

  it("refuses to read a code off an arbitrary error", () => {
    const impostor = Object.assign(new Error("third-party prose"), {
      code: "intercom_rate_limited",
    });

    expect(intercomErrorCode(impostor)).toBe("unknown_error");
    expect(intercomErrorCode(new Error("plain"))).toBe("unknown_error");
    expect(intercomErrorCode("not an error")).toBe("unknown_error");
  });
});
