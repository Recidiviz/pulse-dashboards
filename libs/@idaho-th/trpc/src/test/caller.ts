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

import { vi } from "vitest";

import { USER_ROLE } from "~@idaho-th/trpc/auth/constants";
import type { createContext } from "~@idaho-th/trpc/context";
import { appRouter } from "~@idaho-th/trpc/router";
import {
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

export type TestContext = Awaited<ReturnType<typeof createContext>>;

// Same ids the factories seed rows with, so a caller built here matches data
// built there without every test threading an override through.
export { TEST_PROVIDER_PSEUDONYMIZED_ID, TEST_STAFF_PSEUDONYMIZED_ID };

/**
 * Fastify request stand-in. `req.log` is required: the unexpectedErrorLogger
 * middleware in init.ts calls `ctx.req.log.error` for non-TRPCError failures.
 */
export function createTestRequestLog() {
  return {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };
}

/**
 * Builds the context object `createContext` would have returned, without going
 * through Auth0 token verification. `appRouter.createCaller` takes the context
 * directly, so procedures run against exactly the shape they see in production.
 */
export function createTestContext(
  overrides: Partial<TestContext> = {},
): TestContext {
  return {
    req: { id: "test-request-id", log: createTestRequestLog() },
    res: {},
    isAuthorized: true,
    prisma: testPrismaClient,
    role: USER_ROLE.STAFF,
    staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
    providerPseudonymizedId: undefined,
    requestedProviderId: undefined,
    ...overrides,
  } as unknown as TestContext;
}

export function createStaffContext(overrides: Partial<TestContext> = {}) {
  return createTestContext({
    role: USER_ROLE.STAFF,
    staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
    providerPseudonymizedId: undefined,
    ...overrides,
  });
}

/**
 * A provider caller. Name the organization it acts as — the same thing the
 * active-organization header carries in production — with
 * `createProviderContext({ requestedProviderId: organization.id })`.
 *
 * Left out, the provider middleware resolves the organization exactly as it
 * does for a real request: stored preference, then a single assignment, then
 * refusal. `seedProviderUserWithHousingProviders()` with no options seeds the
 * single-assignment world, so a route test needs no override.
 */
export function createProviderContext(overrides: Partial<TestContext> = {}) {
  return createTestContext({
    role: USER_ROLE.PROVIDER,
    staffPseudonymizedId: undefined,
    providerPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
    ...overrides,
  });
}

export function createAnonymousContext(overrides: Partial<TestContext> = {}) {
  return createTestContext({
    isAuthorized: false,
    role: undefined,
    staffPseudonymizedId: undefined,
    providerPseudonymizedId: undefined,
    ...overrides,
  });
}

export const staffCaller = (overrides?: Partial<TestContext>) =>
  appRouter.createCaller(createStaffContext(overrides));

export const providerCaller = (overrides?: Partial<TestContext>) =>
  appRouter.createCaller(createProviderContext(overrides));

export const anonymousCaller = (overrides?: Partial<TestContext>) =>
  appRouter.createCaller(createAnonymousContext(overrides));
