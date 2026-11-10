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

import type { FastifyRequest } from "fastify";

import { getClientIp, InMemoryRateLimiter } from "../rateLimit";

const WINDOW_MS = 60_000;

/** Small on purpose: the limit itself is what's under test, not a real ceiling. */
function createLimiter(maxRequests = 2) {
  return new InMemoryRateLimiter({ windowMs: WINDOW_MS, maxRequests });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("InMemoryRateLimiter", () => {
  test("exposes the configured maxRequests", () => {
    expect(createLimiter(7).maxRequests).toBe(7);
  });

  test("allows maxRequests in a window and rejects the next request", () => {
    const limiter = createLimiter();

    expect(limiter.consume("ip-1")).toEqual({ allowed: true });
    expect(limiter.consume("ip-1")).toEqual({ allowed: true });

    const rejected = limiter.consume("ip-1");
    expect(rejected.allowed).toBe(false);
    expect(rejected.retryAfterMs).toBeGreaterThan(0);
    expect(rejected.retryAfterMs).toBeLessThanOrEqual(WINDOW_MS);
  });

  test("counts each key separately", () => {
    const limiter = createLimiter();

    limiter.consume("ip-1");
    limiter.consume("ip-1");
    expect(limiter.consume("ip-1").allowed).toBe(false);

    expect(limiter.consume("ip-2")).toEqual({ allowed: true });
  });

  test("starts a fresh window once windowMs has elapsed", () => {
    vi.useFakeTimers();
    const limiter = createLimiter();

    limiter.consume("ip-1");
    limiter.consume("ip-1");
    expect(limiter.consume("ip-1").allowed).toBe(false);

    vi.advanceTimersByTime(WINDOW_MS - 1);
    expect(limiter.consume("ip-1").allowed).toBe(false);

    vi.advanceTimersByTime(1);
    expect(limiter.consume("ip-1")).toEqual({ allowed: true });
  });

  test("shrinks retryAfterMs as the window drains", () => {
    vi.useFakeTimers();
    const limiter = createLimiter();

    limiter.consume("ip-1");
    limiter.consume("ip-1");

    vi.advanceTimersByTime(WINDOW_MS - 5_000);
    expect(limiter.consume("ip-1")).toEqual({
      allowed: false,
      retryAfterMs: 5_000,
    });
  });

  test("one client exhausting its limit leaves another allowed", () => {
    // A regression here locks out every caller at once.
    const limiter = createLimiter();

    for (let i = 0; i < 5; i += 1) limiter.consume("ip-1");

    expect(limiter.consume("ip-1").allowed).toBe(false);
    expect(limiter.consume("ip-2")).toEqual({ allowed: true });
  });
});

describe("InMemoryRateLimiter key eviction", () => {
  test("drops expired keys once the bucket passes maxKeys", () => {
    vi.useFakeTimers();
    const limiter = new InMemoryRateLimiter({
      windowMs: WINDOW_MS,
      maxRequests: 2,
      maxKeys: 2,
    });

    limiter.consume("expired-1");
    limiter.consume("expired-2");

    vi.advanceTimersByTime(WINDOW_MS);
    limiter.consume("live-1");
    limiter.consume("live-2");

    // The bucket now holds four keys, so the next consume prunes first. The two
    // expired keys go; the live key keeps the count it already accrued.
    limiter.consume("trigger");
    expect(limiter.consume("live-1").allowed).toBe(true);
    expect(limiter.consume("live-1").allowed).toBe(false);
  });

  test("does not prune below the maxKeys threshold", () => {
    vi.useFakeTimers();
    const limiter = new InMemoryRateLimiter({
      windowMs: WINDOW_MS,
      maxRequests: 2,
      maxKeys: 10,
    });

    limiter.consume("ip-1");
    limiter.consume("ip-1");

    limiter.consume("ip-2");
    expect(limiter.consume("ip-1").allowed).toBe(false);
  });
});

describe("getClientIp", () => {
  /** The limiter only reads these two fields, so a minimal cast is enough. */
  function buildRequest(
    headers: FastifyRequest["headers"],
    ip?: string,
  ): FastifyRequest {
    return { headers, ip } as unknown as FastifyRequest;
  }

  test("takes the second-from-right hop, which the balancer appends", () => {
    expect(
      getClientIp(
        buildRequest({ "x-forwarded-for": "192.0.2.1, 192.0.2.2, 192.0.2.3" }),
      ),
    ).toBe("192.0.2.2");
  });

  test("ignores hops the caller prepended", () => {
    const spoofed = getClientIp(
      buildRequest({
        "x-forwarded-for": "evil, 203.0.113.9, 192.0.2.10, 10.0.0.1",
      }),
    );
    const plain = getClientIp(
      buildRequest({ "x-forwarded-for": "192.0.2.10, 10.0.0.1" }),
    );

    expect(spoofed).toBe("192.0.2.10");
    expect(spoofed).toBe(plain);
  });

  test("joins an array-valued header before picking the hop", () => {
    expect(
      getClientIp(
        buildRequest({
          "x-forwarded-for": ["198.51.100.4, 198.51.100.5", "198.51.100.6"],
        }),
      ),
    ).toBe("198.51.100.5");
  });

  test("falls back to req.ip when the header is too short to have come from the balancer", () => {
    expect(
      getClientIp(
        buildRequest({ "x-forwarded-for": "192.0.2.1" }, "203.0.113.7"),
      ),
    ).toBe("203.0.113.7");
    expect(
      getClientIp(
        buildRequest(
          { "x-forwarded-for": ["  ", "203.0.113.8"] },
          "203.0.113.7",
        ),
      ),
    ).toBe("203.0.113.7");
  });

  test("falls back through a blank header instead of returning an empty string", () => {
    expect(
      getClientIp(buildRequest({ "x-forwarded-for": "   " }, "203.0.113.7")),
    ).toBe("203.0.113.7");
    expect(
      getClientIp(buildRequest({ "x-forwarded-for": "" }, "203.0.113.7")),
    ).toBe("203.0.113.7");
  });

  test('falls back to req.ip, then to "unknown"', () => {
    expect(getClientIp(buildRequest({}, "203.0.113.9"))).toBe("203.0.113.9");
    expect(getClientIp(buildRequest({}))).toBe("unknown");
    expect(getClientIp(buildRequest({ "x-forwarded-for": "  " }))).toBe(
      "unknown",
    );
  });
});
