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
import { initTypesenseScopedKeys } from "../typesense/init";
import { mintPersonScopedKey } from "../typesense/personScopedKey";

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
  // user IDs that supervise >= 1 staff on supervisionStaff via the plural
  // `supervisorExternalIds` array, mapped to the staffExternalIds of the
  // staff they supervise.
  supervisionSupervisors: new Map<string, string[]>(),
  // user IDs (impossibly) matched as supervisor on incarcerationStaff — used
  // by the canary test to force the invariant violation.
  incarcerationSupervisors: new Map<string, string[]>(),
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
      where: (field: string, _op: string, value: string) => ({
        get: () => {
          const mapsByCollectionAndField: Record<
            string,
            Map<string, string[]> | undefined
          > = {
            "supervisionStaff:supervisorExternalIds":
              fakeFirestore.supervisionSupervisors,
            "incarcerationStaff:supervisorExternalId":
              fakeFirestore.incarcerationSupervisors,
          };
          const supervisedIds =
            mapsByCollectionAndField[`${name}:${field}`]?.get(value) ?? [];
          const empty = supervisedIds.length === 0;
          return Promise.resolve({
            empty,
            docs: supervisedIds.map((staffExternalId, i) => ({
              id: `${name}_${field}_${value}_${i}`,
              data: () => ({ staffExternalId }),
            })),
          });
        },
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
        create: vi.fn().mockResolvedValue({ value: "lazy-created-parent-key" }),
      }),
    }),
  };
});

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeReq(body: Record<string, unknown>, user?: object): Request {
  const { currentTenantId, ...rest } = body;
  return {
    body: rest,
    params: { stateCode: currentTenantId },
    user,
  } as unknown as Request;
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
    undefinedapp_metadata: {
      ...(overrides.externalId === null
        ? {}
        : { externalId: overrides.externalId ?? "OFFICER123" }),
      stateCode: overrides.stateCode ?? "US_TN",
      featureVariants: overrides.featureVariants ?? {},
    },
  };
}

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
  fakeFirestore.supervisionSupervisors.clear();
  fakeFirestore.incarcerationSupervisors.clear();
  process.env["TYPESENSE_API_SEARCH_KEY"] = "test-parent-key";
  mockGenerateScopedSearchKey.mockReturnValue("test-scoped-key");
  vi.mocked(isOfflineMode).mockReturnValue(false);
  await initTypesenseScopedKeys();
});

// --------------------------------------------------------------------------
// Validation
// --------------------------------------------------------------------------

describe("mintPersonScopedKey — validation", () => {
  test("returns 400 when system is invalid", async () => {
    const res = makeRes();
    await mintPersonScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "BOGUS" }, makeUser()),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 422 when user has no externalId", async () => {
    const res = makeRes();
    await mintPersonScopedKey(
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

describe("mintPersonScopedKey — Recidiviz user (cross-state)", () => {
  test("skips Firestore lookups and returns unrestricted filter", async () => {
    const res = makeRes();
    await mintPersonScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "SUPERVISION" },
        makeUser({ stateCode: "recidiviz", externalId: null }),
      ),
      res,
    );
    expect(mockGenerateScopedSearchKey).toHaveBeenCalledTimes(1);
    expect(lastFilterBy()).toBe("stateCode:=`US_TN`");
  });
});

// --------------------------------------------------------------------------
// Single-system state user paths
// --------------------------------------------------------------------------

describe("mintPersonScopedKey — single-system state user", () => {
  test("US_TN SUPERVISION with district → district filter", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });

    const res = makeRes();
    await mintPersonScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }, makeUser()),
      res,
    );

    expect(lastFilterBy()).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 1`])",
    );
  });

  test("US_TN INCARCERATION → unrestricted within state", async () => {
    fakeFirestore.incarcerationStaff.set("us_tn_OFFICER123", {
      district: "Facility 1",
      email: "officer@example.com",
    });

    const res = makeRes();
    await mintPersonScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "INCARCERATION" },
        makeUser(),
      ),
      res,
    );

    expect(lastFilterBy()).toBe("stateCode:=`US_TN`");
  });

  test("no staff record + no district → none base compiles to never-match sentinel", async () => {
    // hasCaseload=false → base falls back to `none`, which carries no grant.
    const res = makeRes();
    await mintPersonScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }, makeUser()),
      res,
    );

    expect(lastFilterBy()).toBe("stateCode:=`US_TN` && (id:=`__no_match__`)");
  });

  test("staff record with no district (hasCaseload=true) → own-caseload officerId grant", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      email: "officer@example.com",
    });

    const res = makeRes();
    await mintPersonScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }, makeUser()),
      res,
    );

    expect(lastFilterBy()).toBe(
      "stateCode:=`US_TN` && (officerId:=[`OFFICER123`])",
    );
  });

  test("workflowsSupervisorSearch FV + user is supervisor → district OR supervised-staff officerId grant", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });
    fakeFirestore.supervisionSupervisors.set("OFFICER123", ["STAFF456"]);

    const res = makeRes();
    await mintPersonScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "SUPERVISION" },
        makeUser({
          featureVariants: { workflowsSupervisorSearch: true },
        }),
      ),
      res,
    );

    expect(lastFilterBy()).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 1`] || officerId:=[`STAFF456`])",
    );
  });

  test("workflowsSupervisorSearch FV + user is one of several supervisors (multiple staff via supervisorExternalIds) → district OR supervised-staff officerId grant", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });
    fakeFirestore.supervisionSupervisors.set("OFFICER123", [
      "STAFF456",
      "STAFF789",
    ]);

    const res = makeRes();
    await mintPersonScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "SUPERVISION" },
        makeUser({
          featureVariants: { workflowsSupervisorSearch: true },
        }),
      ),
      res,
    );

    expect(lastFilterBy()).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 1`] || officerId:=[`STAFF456`, `STAFF789`])",
    );
  });

  test("supervisionUnrestrictedSearch FV → unrestricted, supervisor expansion dropped even when isSupervisor=true", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });
    fakeFirestore.supervisionSupervisors.set("OFFICER123", ["STAFF456"]);

    const res = makeRes();
    await mintPersonScopedKey(
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
    await mintPersonScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }, makeUser()),
      res,
    );

    expect(lastFilterBy()).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 2`, `Region 3`])",
    );
  });

  test("fetchSupervisedStaffExternalIds canary: incarcerationStaff match fires Sentry, does NOT expand scope", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });
    fakeFirestore.incarcerationSupervisors.set("OFFICER123", ["STAFF456"]);

    await mintPersonScopedKey(
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
    expect(lastFilterBy()).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 1`])",
    );
  });
});

// --------------------------------------------------------------------------
// system=ALL cross-system path
// --------------------------------------------------------------------------

describe("mintPersonScopedKey — system=ALL (cross-system)", () => {
  test("US_MI ALL: SUPERVISION district-scoped + INCARCERATION unrestricted, combined via cross-system compiler", async () => {
    fakeFirestore.supervisionStaff.set("us_mi_OFFICER123", {
      district: "Region 3",
      email: "officer@example.com",
    });

    const res = makeRes();
    await mintPersonScopedKey(
      makeReq(
        { currentTenantId: "US_MI", system: "ALL" },
        makeUser({ stateCode: "US_MI" }),
      ),
      res,
    );

    expect(lastFilterBy()).toBe(
      "stateCode:=`US_MI` && ((system:=`SUPERVISION` && (district:=[`Region 3`])) || system:=`INCARCERATION`)",
    );
  });
});

// --------------------------------------------------------------------------
// Response shape
// --------------------------------------------------------------------------

describe("mintPersonScopedKey — response shape", () => {
  test("returns scopedKey, ISO expiresAt, and typesenseHost", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });
    process.env["TYPESENSE_HOST"] = "https://typesense-test.example.com";

    const res = makeRes();
    await mintPersonScopedKey(
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
    await mintPersonScopedKey(
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
    await mintPersonScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }, makeUser()),
      res,
    );

    const arg = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>;
    expect(arg).not.toHaveProperty("_debug");
  });
});
