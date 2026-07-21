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

import type { Request, Response } from "express";

import { fetchOfflineUser } from "../../core";
import { isOfflineMode } from "../../utils/isOfflineMode";
import { mintCaseloadScopedKey } from "../typesense/caseloadScopedKey";
import { initTypesenseScopedKeys } from "../typesense/init";

vi.mock("../../utils/isOfflineMode");
vi.mock("../../core");

const mockSentryCaptureMessage = vi.fn();
vi.mock("@sentry/node", () => ({
  captureMessage: (...args: unknown[]) => mockSentryCaptureMessage(...args),
}));

type Doc = Record<string, unknown>;
const fakeFirestore = {
  supervisionStaff: new Map<string, Doc>(),
  incarcerationStaff: new Map<string, Doc>(),
  userUpdates: new Map<string, Doc>(),
  // user IDs that supervise >= 1 staff on supervisionStaff (powers fetchIsSupervisor)
  supervisors: new Set<string>(),
  // user IDs (impossibly) matched as supervisor on incarcerationStaff — used
  // by the canary test to force the invariant violation.
  incarcerationSupervisors: new Set<string>(),
};

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: (name: keyof typeof fakeFirestore) => ({
      doc: (id: string) => ({
        get: () =>
          Promise.resolve({
            exists: (fakeFirestore[name] as Map<string, Doc>).has(id),
            data: () => (fakeFirestore[name] as Map<string, Doc>).get(id),
          }),
      }),
      where: (_field: string, _op: string, value: string) => ({
        limit: () => ({
          get: () => {
            // Supervisor lookups only match supervisionStaff in healthy states —
            // the parallel incarcerationStaff query is a Sentry canary in
            // fetchIsSupervisor. `incarcerationSupervisors` lets a test force
            // the violation to exercise the alert path.
            const setsByCollection: Record<string, Set<string> | undefined> = {
              supervisionStaff: fakeFirestore.supervisors,
              incarcerationStaff: fakeFirestore.incarcerationSupervisors,
            };
            const set = setsByCollection[name];
            const empty = !set || !set.has(value);
            return Promise.resolve({
              empty,
              docs: empty ? [] : [{ id: `${name}_${value}` }],
            });
          },
        }),
      }),
    }),
  }),
}));

const mockGenerateScopedSearchKey = vi.fn();

vi.mock("~@typesense/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~@typesense/client")>();
  return {
    ...actual,
    createLocalTypesenseClient: () => ({
      keys: () => ({
        generateScopedSearchKey: mockGenerateScopedSearchKey,
        // Returns a value so the offline lazy-create path resolves; the
        // non-offline tests short-circuit on TYPESENSE_API_SEARCH_KEY and
        // never call this.
        create: vi.fn().mockResolvedValue({ value: "lazy-created-parent-key" }),
      }),
    }),
  };
});

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeReq(body: Record<string, unknown>, user?: object): Request {
  return { body, user } as unknown as Request;
}

function makeRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return {
    json,
    status,
  } as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
}

function makeUser(
  overrides: {
    externalId?: string | null;
    stateCode?: string;
    email?: string;
    featureVariants?: Record<string, boolean>;
  } = {},
) {
  return {
    email: overrides.email ?? "user@example.com",
    // process.env.METADATA_NAMESPACE is undefined in tests, so the prefix is "undefined"
    undefinedapp_metadata: {
      ...(overrides.externalId === null
        ? {}
        : { externalId: overrides.externalId ?? "OFFICER123" }),
      stateCode: overrides.stateCode ?? "US_TN",
      featureVariants: overrides.featureVariants ?? {},
    },
  };
}

// Returns the filter_by string that the handler passed to generateScopedSearchKey.
function lastFilterBy(): string {
  const lastCall = mockGenerateScopedSearchKey.mock.calls.at(-1);
  if (!lastCall) throw new Error("generateScopedSearchKey was not called");
  return (lastCall[1] as { filter_by: string }).filter_by;
}

beforeEach(async () => {
  vi.clearAllMocks();
  fakeFirestore.supervisionStaff.clear();
  fakeFirestore.incarcerationStaff.clear();
  fakeFirestore.userUpdates.clear();
  fakeFirestore.supervisors.clear();
  fakeFirestore.incarcerationSupervisors.clear();
  // Non-offline path: initTypesenseScopedKeys reads TYPESENSE_API_SEARCH_KEY
  // directly.
  process.env["TYPESENSE_API_SEARCH_KEY"] = "test-parent-key";
  mockGenerateScopedSearchKey.mockReturnValue("test-scoped-key");
  vi.mocked(isOfflineMode).mockReturnValue(false);
  // Mirrors the server bootstrap in index.js — populates the module-level
  // searchOnlyParentKey before any request is served.
  await initTypesenseScopedKeys();
});

// --------------------------------------------------------------------------
// Validation
// --------------------------------------------------------------------------

describe("mintCaseloadScopedKey — validation", () => {
  test("returns 400 when currentTenantId is missing", async () => {
    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq({ system: "SUPERVISION" }, makeUser()),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.stringContaining("currentTenantId"),
    });
  });

  test("returns 400 when system is missing", async () => {
    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq({ currentTenantId: "US_TN" }, makeUser()),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.stringContaining("system"),
    });
  });

  test("returns 400 when system is invalid", async () => {
    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "BOGUS" }, makeUser()),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 422 when user has no externalId", async () => {
    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "SUPERVISION" },
        makeUser({ externalId: null }),
      ),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(422);
  });
});

// --------------------------------------------------------------------------
// Recidiviz user (cross-state)
// --------------------------------------------------------------------------

// Recidiviz users have stateCode "recidiviz" in their app_metadata and no
// externalId — they aren't in any tenant's staff collection. The mint endpoint
// skips the Firestore lookup and grants unrestricted scope within whatever
// tenant they're currently viewing.
describe("mintCaseloadScopedKey — Recidiviz user (cross-state)", () => {
  test("skips Firestore lookups and returns unrestricted filter for system=SUPERVISION", async () => {
    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "SUPERVISION" },
        makeUser({ stateCode: "recidiviz", externalId: null }),
      ),
      res,
    );
    expect(mockGenerateScopedSearchKey).toHaveBeenCalledTimes(1);
    expect(lastFilterBy()).toBe("stateCode:=`US_TN`");
  });

  test("returns unrestricted filter for system=ALL (no system discriminator since unrestricted covers all)", async () => {
    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq(
        { currentTenantId: "US_MI", system: "ALL" },
        makeUser({ stateCode: "RECIDIVIZ", externalId: null }),
      ),
      res,
    );
    expect(lastFilterBy()).toBe("stateCode:=`US_MI`");
  });
});

// --------------------------------------------------------------------------
// Single-system state user paths
// --------------------------------------------------------------------------

describe("mintCaseloadScopedKey — single-system state user", () => {
  test("US_TN SUPERVISION with district → district filter", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }, makeUser()),
      res,
    );

    expect(lastFilterBy()).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 1`])",
    );
  });

  test("US_TN INCARCERATION → unrestricted within state (per intentional resolver divergence from US_TN tenant config)", async () => {
    fakeFirestore.incarcerationStaff.set("us_tn_OFFICER123", {
      district: "Facility 1",
      email: "officer@example.com",
    });

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "INCARCERATION" },
        makeUser(),
      ),
      res,
    );

    expect(lastFilterBy()).toBe("stateCode:=`US_TN`");
  });

  test("uses system from request, not from staff record location", async () => {
    // User exists ONLY in incarcerationStaff, but request says SUPERVISION —
    // resolver should still use SUPERVISION as the system input.
    fakeFirestore.incarcerationStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }, makeUser()),
      res,
    );

    // SUPERVISION baseline applies → district filter, NOT unrestricted
    expect(lastFilterBy()).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 1`])",
    );
  });

  test("no staff record + no FVs → none base compiles to never-match sentinel", async () => {
    // hasCaseload=false → district base falls back to `none` (not byEmail)
    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }, makeUser()),
      res,
    );

    expect(lastFilterBy()).toBe("stateCode:=`US_TN` && (id:=`__no_match__`)");
  });

  test("workflowsSupervisorSearch FV + user is supervisor → district OR supervisor expansion", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });
    fakeFirestore.supervisors.add("OFFICER123");

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "SUPERVISION" },
        makeUser({
          featureVariants: { workflowsSupervisorSearch: true },
        }),
      ),
      res,
    );

    expect(lastFilterBy()).toBe(
      "stateCode:=`US_TN` && ((district:=[`Region 1`]) || supervisorExternalId:=`OFFICER123` || supervisorExternalIds:=[`OFFICER123`])",
    );
  });

  test("supervisionUnrestrictedSearch FV → unrestricted, supervisor expansion dropped even when isSupervisor=true", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });
    fakeFirestore.supervisors.add("OFFICER123");

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "SUPERVISION" },
        makeUser({
          featureVariants: {
            supervisionUnrestrictedSearch: true,
            workflowsSupervisorSearch: true,
          },
        }),
      ),
      res,
    );

    expect(lastFilterBy()).toBe("stateCode:=`US_TN`");
  });

  test("user-updates overrideDistrictIds wins over staff record district", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });
    fakeFirestore.userUpdates.set("us_tn_OFFICER123", {
      overrideDistrictIds: ["Region 2", "Region 3"],
    });

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }, makeUser()),
      res,
    );

    expect(lastFilterBy()).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 2`, `Region 3`])",
    );
  });

  test("fetchIsSupervisor canary: incarcerationStaff match fires Sentry, does NOT flip isSupervisor", async () => {
    // Healthy invariant: only supervisionStaff docs carry supervisorExternalId.
    // Simulate ETL drift by matching the officer on incarcerationStaff but NOT
    // supervisionStaff. Expectation: Sentry.captureMessage is called; the
    // supervision-side answer (empty) stays authoritative, so the filter does
    // NOT include the supervisor expansion.
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });
    fakeFirestore.incarcerationSupervisors.add("OFFICER123");

    await mintCaseloadScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "SUPERVISION" },
        makeUser({ featureVariants: { workflowsSupervisorSearch: true } }),
      ),
      makeRes(),
    );

    expect(mockSentryCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockSentryCaptureMessage).toHaveBeenCalledWith(
      expect.stringContaining("cross-system supervisor invariant violated"),
      expect.objectContaining({
        level: "warning",
        extra: expect.objectContaining({ externalId: "OFFICER123" }),
      }),
    );
    // No supervisor expansion — supervision-side lookup returned empty.
    expect(lastFilterBy()).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 1`])",
    );
  });
});

// --------------------------------------------------------------------------
// system=ALL cross-system path
// --------------------------------------------------------------------------

describe("mintCaseloadScopedKey — system=ALL (cross-system)", () => {
  test("US_MI ALL: SUPERVISION district-scoped + INCARCERATION unrestricted, combined via cross-system compiler", async () => {
    fakeFirestore.supervisionStaff.set("us_mi_OFFICER123", {
      district: "Region 3",
      email: "officer@example.com",
    });

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq(
        { currentTenantId: "US_MI", system: "ALL" },
        makeUser({ stateCode: "US_MI" }),
      ),
      res,
    );

    // SUPR gets district clause; INC has no user predicate (unrestricted).
    expect(lastFilterBy()).toBe(
      "stateCode:=`US_MI` && ((system:=`SUPERVISION` && (district:=[`Region 3`])) || system:=`INCARCERATION`)",
    );
  });
});

// --------------------------------------------------------------------------
// Response shape
// --------------------------------------------------------------------------

describe("mintCaseloadScopedKey — response shape", () => {
  test("returns scopedKey, ISO expiresAt, and typesenseHost", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });
    process.env["TYPESENSE_HOST"] = "https://typesense-test.example.com";

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }, makeUser()),
      res,
    );

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        scopedKey: "test-scoped-key",
        expiresAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        typesenseHost: "https://typesense-test.example.com",
      }),
    );
  });

  test("includes _debug payload in offline mode only", async () => {
    vi.mocked(isOfflineMode).mockReturnValue(true);
    vi.mocked(fetchOfflineUser).mockReturnValue(
      makeUser() as unknown as ReturnType<typeof fetchOfflineUser>,
    );

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }),
      res,
    );

    const arg = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>;
    expect(arg["_debug"]).toBeDefined();
    expect(arg["_debug"]).toEqual(
      expect.objectContaining({
        filterBy: expect.any(String),
        scope: expect.any(Object),
        system: "SUPERVISION",
      }),
    );
  });

  test("omits _debug payload in production mode", async () => {
    vi.mocked(isOfflineMode).mockReturnValue(false);
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }, makeUser()),
      res,
    );

    const arg = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>;
    expect(arg).not.toHaveProperty("_debug");
  });
});
