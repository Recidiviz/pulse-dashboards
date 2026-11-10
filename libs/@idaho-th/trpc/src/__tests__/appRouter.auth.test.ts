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

import { USER_ROLE } from "~@idaho-th/trpc/auth/constants";
import { appRouter } from "~@idaho-th/trpc/router";
import type { TestContext } from "~@idaho-th/trpc/test/caller";
import {
  createAnonymousContext,
  createProviderContext,
  createStaffContext,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/caller";

/**
 * Server-side authorization is the only authorization that counts — the client
 * role checks are cosmetic. This table is the contract: every procedure on
 * appRouter must declare which gate it sits behind, and the tests below prove
 * the gate actually rejects the other roles.
 *
 * Adding a procedure fails the "declares a gate" test until it is listed here,
 * so opening one up is always a deliberate, reviewable edit.
 *
 * - STAFF    — staffProcedure: authenticated, role STAFF, staffPseudonymizedId present
 * - PROVIDER — providerProcedure: authenticated, role PROVIDER, providerPseudonymizedId
 *              present, and an active organization resolved
 * - PROVIDER_NO_ORG — providerProcedureBase: the same role checks,
 *              but no active organization required. Only the endpoints that let a
 *              caller discover and choose one may sit here, since a procedure
 *              behind this gate sees no verified organization to scope by.
 * - AUTHED   — baseProcedure: authenticated, any role
 * - PUBLIC   — publicProcedure: no authentication at all
 */
const PROCEDURE_GATES = {
  "aiExtractionMetrics.getOverrides": "STAFF",

  "auth.getSession": "AUTHED",
  "auth.checkSignInEmail": "PUBLIC",
  "auth.checkRecidivizRoleChoice": "PUBLIC",

  "documents.listForStaff": "STAFF",
  "documents.listForProvider": "PROVIDER",
  "documents.requestUploadForStaff": "STAFF",
  "documents.requestUploadForProvider": "PROVIDER",
  "documents.confirmUploadForStaff": "STAFF",
  "documents.confirmUploadForProvider": "PROVIDER",
  "documents.getDownloadUrlForStaff": "STAFF",
  "documents.getDownloadUrlForProvider": "PROVIDER",
  "documents.getPreviewUrlForStaff": "STAFF",
  "documents.getScanStatusForStaff": "STAFF",
  "documents.getScanStatusForProvider": "PROVIDER",
  "documents.deleteForStaff": "STAFF",
  "documents.deleteForProvider": "PROVIDER",
  "documents.requestDigitizedUploadForStaff": "STAFF",

  "housingApplication.getByStaff": "STAFF",
  "housingApplication.getProviderApplications": "PROVIDER",
  "housingApplication.getStaffApplicationById": "STAFF",
  "housingApplication.getProviderApplicationById": "PROVIDER",
  "housingApplication.dismissProviderAlert": "PROVIDER",
  "housingApplication.dismissStaffAlert": "STAFF",
  "housingApplication.submitDraft": "STAFF",
  "housingApplication.create": "STAFF",
  "housingApplication.update": "STAFF",
  "housingApplication.advanceStage": "STAFF",
  "housingApplication.delete": "STAFF",
  "housingApplication.duplicate": "STAFF",
  "housingApplication.toggleEligibleProviderSelection": "STAFF",
  "housingApplication.getProviders": "STAFF",
  "housingApplication.getProvidersWithEligibility": "STAFF",
  "housingApplication.sendToProviders": "STAFF",
  "housingApplication.getStaffApplicationProviders": "STAFF",
  "housingApplication.getCurrentProvider": "PROVIDER",
  "housingApplication.getProviderDetails": "PROVIDER",
  "housingApplication.updateHousingProvider": "PROVIDER",
  "housingApplication.updateProviderProfile": "PROVIDER",
  "housingApplication.updateProviderLocation": "PROVIDER",
  "housingApplication.submitProviderResponse": "PROVIDER",
  "housingApplication.getProviderInfoRequest": "PROVIDER",
  "housingApplication.editProviderInfoRequestMessage": "PROVIDER",
  "housingApplication.getStaffInfoRequest": "STAFF",
  "housingApplication.postStaffInfoReply": "STAFF",
  "housingApplication.markStaffInfoMessagesRead": "STAFF",
  "housingApplication.acknowledgeApprovalRevoked": "STAFF",
  "housingApplication.getStaffHomePlan": "STAFF",
  "housingApplication.getProviderHomePlan": "PROVIDER",
  "housingApplication.acceptProviderAsHomePlan": "STAFF",
  "housingApplication.setManualAddressHomePlan": "STAFF",
  "housingApplication.setHomePlanApprovals": "STAFF",
  "housingApplication.setParoleCommissionDecision": "STAFF",
  "housingApplication.toggleStaffHomePlanReleaseTask": "STAFF",
  "housingApplication.toggleProviderHomePlanReleaseTask": "PROVIDER",
  "housingApplication.updateHomePlanReleaseTaskDetail": "STAFF",
  "housingApplication.updateProviderHomePlanReleaseTaskDetail": "PROVIDER",

  "intercom.getMessengerAuthForStaff": "STAFF",
  "intercom.getMessengerAuthForProvider": "PROVIDER",

  "places.autocompleteAddresses": "STAFF",
  "places.getPlaceDetails": "STAFF",

  "housingProvider.resolve": "PROVIDER_NO_ORG",
  "housingProvider.setActive": "PROVIDER_NO_ORG",

  "timeline.getForStaff": "STAFF",
  "timeline.getForProvider": "PROVIDER",
  "timeline.markViewedForStaff": "STAFF",
  "timeline.markViewedForProvider": "PROVIDER",
  "timeline.markModalOpenedForStaff": "STAFF",
  "timeline.markModalOpenedForProvider": "PROVIDER",

  "vertex.extractWithVertexAI": "STAFF",
  "vertex.extractWithVertexAIFromDocument": "STAFF",

  "vertexUpload.requestUpload": "STAFF",
  "vertexUpload.confirmUpload": "STAFF",
  "vertexUpload.getScanStatus": "STAFF",
  "vertexUpload.cancelUpload": "STAFF",
} as const satisfies Record<
  string,
  "STAFF" | "PROVIDER" | "PROVIDER_NO_ORG" | "AUTHED" | "PUBLIC"
>;

type ProcedurePath = keyof typeof PROCEDURE_GATES;

const registeredPaths = Object.keys(
  appRouter._def.procedures as Record<string, unknown>,
);

const pathsWithGate = (gate: string) =>
  (Object.keys(PROCEDURE_GATES) as ProcedurePath[]).filter(
    (path) => PROCEDURE_GATES[path] === gate,
  );

/**
 * Both provider gates share the same role checks — only the active-organization
 * requirement differs — so the role-rejection tests below must cover both. A
 * new gate that only appeared in the table would otherwise be exempt from them.
 */
const providerGatedPaths = [
  ...pathsWithGate("PROVIDER"),
  ...pathsWithGate("PROVIDER_NO_ORG"),
];

/**
 * Invokes a procedure by dotted path and returns the thrown error, or null if
 * it resolved. Input is intentionally `undefined`: the auth middlewares run
 * ahead of the Zod input parser, so a rejected call proves the gate fired
 * rather than the schema.
 */
async function callAndCatch(
  path: string,
  context: TestContext,
): Promise<{ code?: string; message?: string } | null> {
  const [namespace, procedure] = path.split(".");
  const caller = appRouter.createCaller(context) as unknown as Record<
    string,
    Record<string, (input?: unknown) => Promise<unknown>>
  >;

  try {
    await caller[namespace][procedure](undefined);
    return null;
  } catch (error) {
    return error as { code?: string; message?: string };
  }
}

/**
 * Runs `check` against every path and reports all offenders at once. Each case
 * would otherwise be its own `it`, and the global `beforeEach` truncates the
 * whole database per test — 60+ truncations to assert one middleware.
 */
async function findViolations(
  paths: readonly ProcedurePath[],
  check: (path: ProcedurePath) => Promise<string | null>,
): Promise<string[]> {
  const results = await Promise.all(
    paths.map(async (path) => {
      const failure = await check(path);
      return failure === null ? null : `${path}: ${failure}`;
    }),
  );
  return results.filter((entry): entry is string => entry !== null);
}

function expectTrpcError(
  error: { code?: string; message?: string } | null,
  code: string,
  message?: string,
): string | null {
  if (error === null) return `resolved, expected ${code}`;
  if (error.code !== code) return `got ${error.code}, expected ${code}`;
  if (message !== undefined && error.message !== message) {
    return `got message "${error.message}", expected "${message}"`;
  }
  return null;
}

describe("appRouter authorization", () => {
  it("every registered procedure declares a gate", () => {
    expect([...registeredPaths].sort()).toEqual(
      Object.keys(PROCEDURE_GATES).sort(),
    );
  });

  it("rejects unauthenticated callers on every guarded procedure", async () => {
    const guarded = (Object.keys(PROCEDURE_GATES) as ProcedurePath[]).filter(
      (path) => PROCEDURE_GATES[path] !== "PUBLIC",
    );

    const violations = await findViolations(guarded, async (path) =>
      expectTrpcError(
        await callAndCatch(path, createAnonymousContext()),
        "UNAUTHORIZED",
      ),
    );

    expect(violations).toEqual([]);
  });

  it("lets public procedures through without authentication", async () => {
    const violations = await findViolations(
      pathsWithGate("PUBLIC"),
      async (path) => {
        const error = await callAndCatch(path, createAnonymousContext());
        return error?.code === "UNAUTHORIZED"
          ? "rejected as UNAUTHORIZED, expected no auth requirement"
          : null;
      },
    );

    expect(violations).toEqual([]);
  });

  it("rejects providers on every staff-only procedure", async () => {
    const violations = await findViolations(
      pathsWithGate("STAFF"),
      async (path) =>
        expectTrpcError(
          await callAndCatch(path, createProviderContext()),
          "FORBIDDEN",
          "Staff access required",
        ),
    );

    expect(violations).toEqual([]);
  });

  it("rejects staff tokens carrying no pseudonymized id", async () => {
    const violations = await findViolations(
      pathsWithGate("STAFF"),
      async (path) =>
        expectTrpcError(
          await callAndCatch(
            path,
            createStaffContext({ staffPseudonymizedId: undefined }),
          ),
          "UNAUTHORIZED",
          "Staff pseudonymized ID not found",
        ),
    );

    expect(violations).toEqual([]);
  });

  it("rejects staff on every provider-only procedure", async () => {
    const violations = await findViolations(providerGatedPaths, async (path) =>
      expectTrpcError(
        await callAndCatch(path, createStaffContext()),
        "FORBIDDEN",
        "Provider access required",
      ),
    );

    expect(violations).toEqual([]);
  });

  it("rejects provider tokens carrying no pseudonymized id", async () => {
    const violations = await findViolations(providerGatedPaths, async (path) =>
      expectTrpcError(
        await callAndCatch(
          path,
          createProviderContext({ providerPseudonymizedId: undefined }),
        ),
        "UNAUTHORIZED",
        "Provider pseudonymized ID not found",
      ),
    );

    expect(violations).toEqual([]);
  });

  it("accepts either role on role-agnostic authenticated procedures", async () => {
    const authedPaths = pathsWithGate("AUTHED");

    const violations = await findViolations(authedPaths, async (path) => {
      const contexts = [createStaffContext(), createProviderContext()];
      const errors = await Promise.all(
        contexts.map((context) => callAndCatch(path, context)),
      );

      const blockedIndex = errors.findIndex(
        (error) =>
          error?.code === "FORBIDDEN" || error?.code === "UNAUTHORIZED",
      );

      return blockedIndex === -1
        ? null
        : `blocked ${contexts[blockedIndex].role} with ${errors[blockedIndex]?.code}`;
    });

    expect(violations).toEqual([]);
  });

  it("getSession reflects the staff identity on the context", async () => {
    const caller = appRouter.createCaller(createStaffContext());

    await expect(caller.auth.getSession()).resolves.toEqual({
      role: USER_ROLE.STAFF,
      staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      providerPseudonymizedId: null,
    });
  });

  it("getSession reflects the provider identity on the context", async () => {
    const caller = appRouter.createCaller(createProviderContext());

    await expect(caller.auth.getSession()).resolves.toEqual({
      role: USER_ROLE.PROVIDER,
      staffPseudonymizedId: null,
      providerPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
    });
  });
});
