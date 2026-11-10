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

import {
  checkRecidivizRoleChoiceRateLimiter,
  signInEmailRateLimiter,
} from "~@idaho-th/trpc/auth/rateLimit";
import type { createContext } from "~@idaho-th/trpc/context";
import { createHousingProviderUser } from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

const staffGrant = vi.hoisted(() => ({
  isRecidivizStaffAuthorized: vi.fn(),
  actual: ((): boolean => {
    throw new Error("isRecidivizStaffAuthorized was never captured");
  }) as (email: string) => boolean,
}));

vi.mock(
  "~@idaho-th/trpc/auth/isRecidivizStaffAuthorized",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("~@idaho-th/trpc/auth/isRecidivizStaffAuthorized")
      >();
    staffGrant.actual = actual.isRecidivizStaffAuthorized;
    return {
      isRecidivizStaffAuthorized: staffGrant.isRecidivizStaffAuthorized,
    };
  },
);

import { authRouter } from "../auth.route";

type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * The sign-in rate limiter is an in-memory, per-IP bucket whose window outlives
 * a single test, so every caller here gets its own IP.
 */
function createTestCaller(ip: string) {
  return authRouter.createCaller({
    isAuthorized: false,
    prisma: testPrismaClient,
    providerPseudonymizedId: undefined,
    // unexpectedErrorLogger logs every rejected request, expected or not, so
    // req.log must always be present — matches the real Fastify request
    // logger, which is never missing warn/error.
    req: { headers: {}, ip, log: { error: vi.fn(), warn: vi.fn() } },
    role: undefined,
    staffPseudonymizedId: undefined,
  } as unknown as Context);
}

describe("authRouter.checkSignInEmail", () => {
  // mockReset clears the implementation before every test (vite.config.mts), so
  // the real function has to be reinstalled as the default rather than set once.
  beforeEach(() => {
    staffGrant.isRecidivizStaffAuthorized.mockImplementation((email: string) =>
      staffGrant.actual(email),
    );
  });

  test("routes a DB-seeded provider with a @recidiviz.org email to the provider flow outside staging", async () => {
    // A provisioned provider on @recidiviz.org must still resolve via the
    // provider table outside staging.
    vi.stubEnv("APP_ENV", "");
    await createHousingProviderUser(testPrismaClient, {
      email: "provider@recidiviz.org",
    });

    await expect(
      createTestCaller("203.0.113.4").checkSignInEmail({
        email: "provider@recidiviz.org",
      }),
    ).resolves.toEqual({ flow: "provider", ok: true });
  });

  test("routes a plain @recidiviz.org email to the staff database flow when APP_ENV is staging", async () => {
    vi.stubEnv("APP_ENV", "staging");
    // Seeded as a provider too, to prove plain staging Recidiviz addresses
    // still route as staff rather than provider.
    await createHousingProviderUser(testPrismaClient, {
      email: "staffer@recidiviz.org",
    });

    await expect(
      createTestCaller("203.0.113.5").checkSignInEmail({
        email: "staffer@recidiviz.org",
      }),
    ).resolves.toEqual({ flow: "staff-database", ok: true });
  });

  test("routes a @recidiviz.org alias with no requestedFlow to the staff flow, same as a plain address", async () => {
    vi.stubEnv("APP_ENV", "staging");
    // A "+" in the local part carries no meaning of its own — only an explicit
    // requestedFlow selects the provider flow for a @recidiviz.org address.
    await createHousingProviderUser(testPrismaClient, {
      email: "test+provider@recidiviz.org",
    });

    await expect(
      createTestCaller("203.0.113.7").checkSignInEmail({
        email: "Staffer+Provider@Recidiviz.ORG",
      }),
    ).resolves.toEqual({ flow: "staff-database", ok: true });
  });

  test("routes a @recidiviz.org alias to the provider flow only when explicitly requested", async () => {
    vi.stubEnv("APP_ENV", "staging");
    await createHousingProviderUser(testPrismaClient, {
      email: "test+provider@recidiviz.org",
    });

    await expect(
      createTestCaller("203.0.113.8").checkSignInEmail({
        email: "Test+Provider@Recidiviz.ORG",
        requestedFlow: "provider",
      }),
    ).resolves.toEqual({ flow: "provider", ok: true });
  });

  test("routes a @recidiviz.org email requesting the provider flow to the provider lookup, even in staging", async () => {
    vi.stubEnv("APP_ENV", "staging");
    await createHousingProviderUser(testPrismaClient, {
      email: "staffer@recidiviz.org",
    });

    await expect(
      createTestCaller("203.0.113.12").checkSignInEmail({
        email: "staffer@recidiviz.org",
        requestedFlow: "provider",
      }),
    ).resolves.toEqual({ flow: "provider", ok: true });
  });

  test("routes a @recidiviz.org email requesting the staff flow to the one-time code in staging", async () => {
    vi.stubEnv("APP_ENV", "staging");

    await expect(
      createTestCaller("203.0.113.13").checkSignInEmail({
        email: "staffer@recidiviz.org",
        requestedFlow: "staff-sso",
      }),
    ).resolves.toEqual({ flow: "recidiviz-staff-passwordless", ok: true });
  });

  test("ignores requestedFlow: provider for a non-recidiviz.org email", async () => {
    await expect(
      createTestCaller("203.0.113.14").checkSignInEmail({
        email: "staff.user@idoc.idaho.gov",
        requestedFlow: "provider",
      }),
    ).resolves.toEqual({ flow: "staff-database", ok: true });
  });

  test("keeps ignoring it when the IDOC email routes to SSO in production", async () => {
    vi.stubEnv("APP_ENV", "production");

    await expect(
      createTestCaller("203.0.113.19").checkSignInEmail({
        email: "mock.staff@idoc.idaho.gov",
        requestedFlow: "provider",
      }),
    ).resolves.toEqual({ flow: "staff-sso", ok: true });
  });

  test("honours an explicit staff choice from a @recidiviz.org address that also holds a provider row", async () => {
    // The chooser exists because a Recidiviz address can be either. Resolving
    // it from the provider table would discard the answer the caller just
    // gave.
    vi.stubEnv("APP_ENV", "");
    await createHousingProviderUser(testPrismaClient, {
      email: "staffer2@recidiviz.org",
    });

    await expect(
      createTestCaller("203.0.113.15").checkSignInEmail({
        email: "staffer2@recidiviz.org",
        requestedFlow: "staff-sso",
      }),
    ).resolves.toEqual({ flow: "recidiviz-staff-passwordless", ok: true });
  });

  test("keeps that choice on the staff database connection in production", async () => {
    // The production Actions do not handle staff on the passwordless
    // connection yet.
    vi.stubEnv("APP_ENV", "production");
    await createHousingProviderUser(testPrismaClient, {
      email: "staffer5@recidiviz.org",
    });

    await expect(
      createTestCaller("203.0.113.18").checkSignInEmail({
        email: "staffer5@recidiviz.org",
        requestedFlow: "staff-sso",
      }),
    ).resolves.toEqual({ flow: "staff-database", ok: true });
  });

  test("still routes that address to the provider flow when it makes no choice", async () => {
    vi.stubEnv("APP_ENV", "");
    await createHousingProviderUser(testPrismaClient, {
      email: "staffer3@recidiviz.org",
    });

    await expect(
      createTestCaller("203.0.113.16").checkSignInEmail({
        email: "staffer3@recidiviz.org",
      }),
    ).resolves.toEqual({ flow: "provider", ok: true });
  });

  test("routes that address to the provider flow when it picks provider", async () => {
    vi.stubEnv("APP_ENV", "");
    await createHousingProviderUser(testPrismaClient, {
      email: "staffer4@recidiviz.org",
    });

    await expect(
      createTestCaller("203.0.113.17").checkSignInEmail({
        email: "staffer4@recidiviz.org",
        requestedFlow: "provider",
      }),
    ).resolves.toEqual({ flow: "provider", ok: true });
  });

  test("routes an allowlisted @recidiviz.org email to the staff flow outside staging", async () => {
    vi.stubEnv("APP_ENV", "");
    vi.stubEnv(
      "IDAHO_TH_RECIDIVIZ_STAFF_ALLOWLIST",
      "granted@recidiviz.org,other@recidiviz.org",
    );

    await expect(
      createTestCaller("203.0.113.20").checkSignInEmail({
        email: "Granted@Recidiviz.ORG",
      }),
    ).resolves.toEqual({ flow: "staff-database", ok: true });
  });

  test("routes a @recidiviz.org address to the staff flow without consulting the grant", async () => {
    vi.stubEnv("APP_ENV", "");
    vi.stubEnv("IDAHO_TH_RECIDIVIZ_STAFF_ALLOWLIST", "");

    await expect(
      createTestCaller("203.0.113.30").checkSignInEmail({
        email: "Delegated@Recidiviz.ORG",
      }),
    ).resolves.toEqual({ flow: "staff-database", ok: true });

    expect(staffGrant.isRecidivizStaffAuthorized).not.toHaveBeenCalled();
  });

  test("answers the same for an allowlisted and a non-allowlisted @recidiviz.org address", async () => {
    // The point of the endpoint is which sign-in to offer, not whether the
    // caller is granted. Answering from the grant would let anyone who can
    // POST an email read the allowlist one address at a time; the Action
    // denies the ones it has no grant for.
    vi.stubEnv("APP_ENV", "");
    vi.stubEnv("IDAHO_TH_RECIDIVIZ_STAFF_ALLOWLIST", "granted@recidiviz.org");

    const granted = await createTestCaller("203.0.113.31").checkSignInEmail({
      email: "granted@recidiviz.org",
    });
    const denied = await createTestCaller("203.0.113.32").checkSignInEmail({
      email: "denied@recidiviz.org",
    });

    expect(denied).toEqual(granted);
    expect(denied).toEqual({ flow: "staff-database", ok: true });
    expect(staffGrant.isRecidivizStaffAuthorized).not.toHaveBeenCalled();
  });

  test("routes an @iddoc.onmicrosoft.com email to the staff SSO flow", async () => {
    // The Entra form of an IDOC address reaches SSO like any other.
    vi.stubEnv("APP_ENV", "production");

    await expect(
      createTestCaller("203.0.113.22").checkSignInEmail({
        email: "mock.staff@iddoc.onmicrosoft.com",
      }),
    ).resolves.toEqual({ flow: "staff-sso", ok: true });
  });

  test("routes an IDOC email to the staff SSO flow in production", async () => {
    vi.stubEnv("APP_ENV", "production");

    await expect(
      createTestCaller("203.0.113.1").checkSignInEmail({
        email: "mock.staff@idoc.idaho.gov",
      }),
    ).resolves.toEqual({ flow: "staff-sso", ok: true });
  });

  test("keeps an IDOC email on the staff database flow outside production", async () => {
    vi.stubEnv("APP_ENV", "");

    await expect(
      createTestCaller("203.0.113.42").checkSignInEmail({
        email: "mock.staff@idoc.idaho.gov",
      }),
    ).resolves.toEqual({ flow: "staff-database", ok: true });
  });

  test("keeps an IDOC email on the staff database flow in staging", async () => {
    // Staging is a separate Auth0 tenant with no IDOC connection, so routing
    // there would lock every staging tester out.
    vi.stubEnv("APP_ENV", "staging");

    await expect(
      createTestCaller("203.0.113.40").checkSignInEmail({
        email: "mock.staff@idoc.idaho.gov",
      }),
    ).resolves.toEqual({ flow: "staff-database", ok: true });
  });

  test("keeps an allowlisted @recidiviz.org email on the staff database flow in production", async () => {
    vi.stubEnv("APP_ENV", "production");
    staffGrant.isRecidivizStaffAuthorized.mockReturnValue(true);

    await expect(
      createTestCaller("203.0.113.41").checkSignInEmail({
        email: "granted@recidiviz.org",
      }),
    ).resolves.toEqual({ flow: "staff-database", ok: true });
  });

  test("matches a provisioned provider regardless of email casing", async () => {
    await createHousingProviderUser(testPrismaClient, {
      email: "provider@example.com",
    });

    await expect(
      createTestCaller("203.0.113.2").checkSignInEmail({
        email: "Provider@Example.COM",
      }),
    ).resolves.toEqual({ flow: "provider", ok: true });
  });

  test("reports an email with no provider row as an unregistered provider", async () => {
    await createHousingProviderUser(testPrismaClient, {
      email: "provider@example.com",
    });

    await expect(
      createTestCaller("203.0.113.3").checkSignInEmail({
        email: "missing-provider@example.com",
      }),
    ).resolves.toEqual({ flow: "provider", ok: false });
  });

  test("throws TOO_MANY_REQUESTS once an IP exceeds the sign-in rate limit", async () => {
    // The limiter's own counting is unit-tested in auth/__tests__/rateLimit.test.ts,
    // so this only has to prove the router consults that limiter keyed by client
    // IP. Draining the bucket directly avoids restating the configured ceiling
    // and keeps the test from issuing maxRequests real DB-backed calls.
    const ip = "203.0.113.6";
    for (let i = 0; i < signInEmailRateLimiter.maxRequests; i += 1) {
      signInEmailRateLimiter.consume(ip);
    }

    await expect(
      createTestCaller(ip).checkSignInEmail({
        email: "mock.staff@idoc.idaho.gov",
      }),
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
      message: expect.stringMatching(
        /^Too many sign-in attempts\. Please try again in \d+ seconds\.$/,
      ),
    });
  });
});

describe("authRouter.checkRecidivizRoleChoice", () => {
  beforeEach(() => {
    staffGrant.isRecidivizStaffAuthorized.mockImplementation((email: string) =>
      staffGrant.actual(email),
    );
  });

  test("returns false for a non-recidiviz.org email without consulting the staff grant", async () => {
    await expect(
      createTestCaller("203.0.113.40").checkRecidivizRoleChoice({
        email: "mock.staff@idoc.idaho.gov",
      }),
    ).resolves.toEqual({ showRoleChoice: false });

    expect(staffGrant.isRecidivizStaffAuthorized).not.toHaveBeenCalled();
  });

  test("returns true for a recidiviz.org email without consulting the staff grant", async () => {
    await expect(
      createTestCaller("203.0.113.41").checkRecidivizRoleChoice({
        email: "Granted@Recidiviz.ORG",
      }),
    ).resolves.toEqual({ showRoleChoice: true });

    expect(staffGrant.isRecidivizStaffAuthorized).not.toHaveBeenCalled();
  });

  test("answers the same whether or not the address is allowlisted", async () => {
    vi.stubEnv("IDAHO_TH_RECIDIVIZ_STAFF_ALLOWLIST", "granted@recidiviz.org");

    const granted = await createTestCaller(
      "203.0.113.42",
    ).checkRecidivizRoleChoice({ email: "granted@recidiviz.org" });
    const denied = await createTestCaller(
      "203.0.113.44",
    ).checkRecidivizRoleChoice({ email: "denied@recidiviz.org" });

    expect(denied).toEqual(granted);
    expect(staffGrant.isRecidivizStaffAuthorized).not.toHaveBeenCalled();
  });

  test("throws TOO_MANY_REQUESTS once an IP exceeds the role-choice rate limit", async () => {
    const ip = "203.0.113.43";
    for (
      let i = 0;
      i < checkRecidivizRoleChoiceRateLimiter.maxRequests;
      i += 1
    ) {
      checkRecidivizRoleChoiceRateLimiter.consume(ip);
    }

    await expect(
      createTestCaller(ip).checkRecidivizRoleChoice({
        email: "staff.user@recidiviz.org",
      }),
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
      message: expect.stringMatching(
        /^Too many requests\. Please try again in \d+ seconds\.$/,
      ),
    });
  });
});
