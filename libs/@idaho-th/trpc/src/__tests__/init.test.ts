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

import { getErrorShape, TRPCError } from "@trpc/server";

import {
  HOUSING_PROVIDER_ACCESS_DENIED_MESSAGE,
  HOUSING_PROVIDER_REQUIRED_MESSAGE,
} from "~@idaho-th/shared";
import { USER_ROLE } from "~@idaho-th/trpc/auth/constants";
import type { createContext } from "~@idaho-th/trpc/context";
import {
  createHousingProvider,
  seedProviderUserWithHousingProviders,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  providerProcedure,
  publicProcedure,
  router,
  staffProcedure,
  t,
} from "../init";

const testRouter = router({
  providerOnly: providerProcedure.query(() => "provider data"),
  staffOnly: staffProcedure.query(() => "staff data"),
});

type Context = Awaited<ReturnType<typeof createContext>>;

function createTestContext(overrides: Partial<Context>): Context {
  return {
    isAuthorized: true,
    providerPseudonymizedId: undefined,
    role: undefined,
    staffPseudonymizedId: undefined,
    // unexpectedErrorLogger logs every rejected request, expected or not, so
    // req.log must always be present — matches the real Fastify request
    // logger, which is never missing warn/error.
    req: { log: { error: vi.fn(), warn: vi.fn() } },
    ...overrides,
  } as Context;
}

describe("staffProcedure", () => {
  test("allows staff users with a staff ID to access staff-only APIs", async () => {
    const staffContext = createTestContext({
      role: USER_ROLE.STAFF,
      staffPseudonymizedId: "staff-123",
    });

    await expect(
      testRouter.createCaller(staffContext).staffOnly(),
    ).resolves.toBe("staff data");
  });

  test("rejects unauthenticated users from staff-only APIs", async () => {
    const unauthenticatedContext = createTestContext({
      isAuthorized: false,
    });

    await expect(
      testRouter.createCaller(unauthenticatedContext).staffOnly(),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("Provider user cannot access staff-only APIs", async () => {
    const providerContext = createTestContext({
      providerPseudonymizedId: "provider-123",
      role: USER_ROLE.PROVIDER,
    });

    await expect(
      testRouter.createCaller(providerContext).staffOnly(),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Staff access required",
    });
  });

  test("rejects staff users without a staff ID from staff-only APIs", async () => {
    const staffContext = createTestContext({
      role: USER_ROLE.STAFF,
      staffPseudonymizedId: undefined,
    });

    await expect(
      testRouter.createCaller(staffContext).staffOnly(),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Staff pseudonymized ID not found",
    });
  });
});

describe("providerProcedure", () => {
  test("allows provider users with a provider ID to access provider-only APIs", async () => {
    // Unlike the rejection cases below, the happy path reaches the
    // active-organization lookup, so it needs a real client and a person with
    // an assignment to resolve against.
    const { user, housingProviders } =
      await seedProviderUserWithHousingProviders(testPrismaClient);

    const providerContext = createTestContext({
      providerPseudonymizedId: user.pseudonymizedId ?? undefined,
      requestedProviderId: housingProviders[0].id,
      role: USER_ROLE.PROVIDER,
      prisma: testPrismaClient,
    });

    await expect(
      testRouter.createCaller(providerContext).providerOnly(),
    ).resolves.toBe("provider data");
  });

  test("derives the lone assigned housing provider when none is named", async () => {
    const { user } =
      await seedProviderUserWithHousingProviders(testPrismaClient);

    const providerContext = createTestContext({
      providerPseudonymizedId: user.pseudonymizedId ?? undefined,
      requestedProviderId: undefined,
      role: USER_ROLE.PROVIDER,
      prisma: testPrismaClient,
    });

    await expect(
      testRouter.createCaller(providerContext).providerOnly(),
    ).resolves.toBe("provider data");
  });

  test("falls back to the stored last active housing provider when several are assigned", async () => {
    const { user, housingProviders } =
      await seedProviderUserWithHousingProviders(testPrismaClient, {
        housingProviders: [{}, {}],
      });
    await testPrismaClient.housingProviderUser.update({
      where: { id: user.id },
      data: { lastActiveProviderId: housingProviders[0].id },
    });

    const providerContext = createTestContext({
      providerPseudonymizedId: user.pseudonymizedId ?? undefined,
      requestedProviderId: undefined,
      role: USER_ROLE.PROVIDER,
      prisma: testPrismaClient,
    });

    await expect(
      testRouter.createCaller(providerContext).providerOnly(),
    ).resolves.toBe("provider data");
  });

  test("rejects a request that names no housing provider when several are assigned and none is stored", async () => {
    const { user } = await seedProviderUserWithHousingProviders(
      testPrismaClient,
      { housingProviders: [{}, {}] },
    );

    const providerContext = createTestContext({
      providerPseudonymizedId: user.pseudonymizedId ?? undefined,
      requestedProviderId: undefined,
      role: USER_ROLE.PROVIDER,
      prisma: testPrismaClient,
    });

    await expect(
      testRouter.createCaller(providerContext).providerOnly(),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: HOUSING_PROVIDER_REQUIRED_MESSAGE,
    });
  });

  test("rejects a request that names a housing provider the caller is not assigned to", async () => {
    const { user } =
      await seedProviderUserWithHousingProviders(testPrismaClient);
    const someoneElses = await createHousingProvider(testPrismaClient);

    const providerContext = createTestContext({
      providerPseudonymizedId: user.pseudonymizedId ?? undefined,
      requestedProviderId: someoneElses.id,
      role: USER_ROLE.PROVIDER,
      prisma: testPrismaClient,
    });

    await expect(
      testRouter.createCaller(providerContext).providerOnly(),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: HOUSING_PROVIDER_ACCESS_DENIED_MESSAGE,
    });
  });

  test("rejects unauthenticated users from provider-only APIs", async () => {
    const unauthenticatedContext = createTestContext({
      isAuthorized: false,
    });

    await expect(
      testRouter.createCaller(unauthenticatedContext).providerOnly(),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("Staff user cannot access provider-only APIs", async () => {
    const staffContext = createTestContext({
      role: USER_ROLE.STAFF,
      staffPseudonymizedId: "staff-123",
    });

    await expect(
      testRouter.createCaller(staffContext).providerOnly(),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Provider access required",
    });
  });

  test("rejects provider users without a provider ID from provider-only APIs", async () => {
    const providerContext = createTestContext({
      providerPseudonymizedId: undefined,
      role: USER_ROLE.PROVIDER,
    });

    await expect(
      testRouter.createCaller(providerContext).providerOnly(),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Provider pseudonymized ID not found",
    });
  });
});

describe("errorFormatter", () => {
  function formatError(error: TRPCError) {
    return getErrorShape({
      config: t._config,
      error,
      type: "query",
      path: undefined,
      input: undefined,
      ctx: undefined,
    });
  }

  test("masks raw internal error messages and strips their stack trace", () => {
    const error = new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unknown argument `secretColumn`. Available options are...",
    });

    const formatted = formatError(error);

    expect(formatted.message).toBe("Internal server error");
    expect(
      (formatted.data as Record<string, unknown>)["stack"],
    ).toBeUndefined();
  });

  test("leaves expected TRPCError messages untouched", () => {
    const error = new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid input",
    });

    expect(formatError(error)).toMatchObject({
      code: -32600,
      message: "Invalid input",
    });
  });
});

describe("unexpectedErrorLogger", () => {
  function createLoggingContext(
    logError: (...args: unknown[]) => void,
    logWarn: (...args: unknown[]) => void,
  ) {
    return createTestContext({
      req: { log: { error: logError, warn: logWarn } },
    } as unknown as Partial<Context>);
  }

  test("logs INTERNAL_SERVER_ERROR TRPCErrors at error level, since errorFormatter masks their message for the client", async () => {
    const logError = vi.fn();
    const logWarn = vi.fn();
    const throwingRouter = router({
      boom: publicProcedure.query(() => {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          cause: new Error("Unknown argument `secretColumn`"),
        });
      }),
    });

    await expect(
      throwingRouter
        .createCaller(createLoggingContext(logError, logWarn))
        .boom(),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });

    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        errorName: "TRPCError",
        trpcCode: "INTERNAL_SERVER_ERROR",
      }),
      "Unhandled tRPC procedure error",
    );
  });

  test("never logs the raw error object, only its scrubbed name/message", async () => {
    const logError = vi.fn();
    const logWarn = vi.fn();
    const throwingRouter = router({
      boom: publicProcedure.query(() => {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "contact jane@example.com for details",
        });
      }),
    });

    await expect(
      throwingRouter
        .createCaller(createLoggingContext(logError, logWarn))
        .boom(),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });

    expect(logError).toHaveBeenCalledWith(
      {
        errorName: "TRPCError",
        errorMessage: "contact [redacted] for details",
        trpcCode: "INTERNAL_SERVER_ERROR",
      },
      "Unhandled tRPC procedure error",
    );
    expect(logWarn).not.toHaveBeenCalled();
  });

  test("logs expected TRPCErrors (e.g. BAD_REQUEST) at warn level, not error", async () => {
    const logError = vi.fn();
    const logWarn = vi.fn();
    const throwingRouter = router({
      boom: publicProcedure.query(() => {
        throw new TRPCError({ code: "BAD_REQUEST", message: "nope" });
      }),
    });

    await expect(
      throwingRouter
        .createCaller(createLoggingContext(logError, logWarn))
        .boom(),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(logError).not.toHaveBeenCalled();
    expect(logWarn).toHaveBeenCalledWith(
      expect.objectContaining({ trpcCode: "BAD_REQUEST", httpStatus: 400 }),
      "Expected tRPC error",
    );
  });
});
