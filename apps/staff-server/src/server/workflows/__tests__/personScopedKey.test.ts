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

// Supervisor lookups only match supervisionStaff in healthy states — the
// parallel incarcerationStaff query is a Sentry canary in
// fetchSupervisedStaffExternalIds. `incarcerationSupervisors` lets a test
// force the violation to exercise the alert path. Single-field-only, so this
// stays separate from the generic multi-where matcher below (which scans doc
// bodies rather than a side-table of supervised ids).
const mapsByCollectionAndField: Record<
  string,
  Map<string, string[]> | undefined
> = {
  "supervisionStaff:supervisorExternalIds":
    fakeFirestore.supervisionSupervisors,
  "incarcerationStaff:supervisorExternalId":
    fakeFirestore.incarcerationSupervisors,
};

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: (name: keyof typeof fakeFirestore) => {
      // Chainable query builder: fetchStaffRecordByEmail chains
      // `.where("email", ...).where("stateCode", ...).limit(1).get()`, while
      // fetchSupervisedStaffExternalIds does a single `.where(...).get()`
      // against the supervisor side-tables above.
      const makeQuery = (filters: [string, string][]) => ({
        where: (field: string, _op: string, value: string) =>
          makeQuery([...filters, [field, value]]),
        limit: () => makeQuery(filters),
        get: () => {
          if (filters.length === 1) {
            const [field, value] = filters[0];
            const key = `${name}:${field}`;
            if (key in mapsByCollectionAndField) {
              const supervisedIds =
                mapsByCollectionAndField[key]?.get(value) ?? [];
              return Promise.resolve({
                empty: supervisedIds.length === 0,
                docs: supervisedIds.map((staffExternalId, i) => ({
                  id: `${name}_${field}_${value}_${i}`,
                  data: () => ({ staffExternalId }),
                })),
              });
            }
          }
          // Generic path: scan doc bodies for equality on every filter —
          // used by the email + stateCode staff-record lookup.
          const matches = [
            ...(fakeFirestore[name] as Map<string, Doc>).entries(),
          ].filter(([, doc]) =>
            filters.every(([field, value]) => doc[field] === value),
          );
          return Promise.resolve({
            empty: matches.length === 0,
            docs: matches.map(([id, doc]) => ({ id, data: () => doc })),
          });
        },
      });
      return {
        doc: (id: string) => ({
          get: () =>
            Promise.resolve({
              exists: (fakeFirestore[name] as Map<string, Doc>).has(id),
              data: () => (fakeFirestore[name] as Map<string, Doc>).get(id),
            }),
        }),
        where: (field: string, op: string, value: string) =>
          makeQuery([[field, value]]),
      };
    },
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
    district?: string;
    featureVariants?: Record<string, boolean>;
    routes?: Record<string, boolean>;
  } = {},
) {
  return {
    email: overrides.email ?? "user@example.com",
    undefinedapp_metadata: {
      ...(overrides.externalId === null
        ? {}
        : { externalId: overrides.externalId ?? "OFFICER123" }),
      ...(overrides.district !== undefined && { district: overrides.district }),
      stateCode: overrides.stateCode ?? "US_TN",
      featureVariants: overrides.featureVariants ?? {},
      // Permissioned for both systems by default: these tests are about what
      // scope gets compiled, not about who may ask for it. Pass `routes`
      // explicitly to exercise the authorization check.
      routes: overrides.routes ?? {
        workflowsSupervision: true,
        workflowsFacilities: true,
      },
    },
  };
}

// Returns the filter_by baked into each collection's key. See the identical
// helper in caseloadScopedKey.test.ts for why this reads the response rather
// than the mint call order.
// Named rather than an index signature so assertions can use dot access.
type MintedFilters = Partial<
  Record<
    | "supervisionStaff"
    | "incarcerationStaff"
    | "locations"
    | "clients"
    | "residents",
    string
  >
>;

function mintedFilters(res: ReturnType<typeof makeRes>): MintedFilters {
  const lastCall = res.json.mock.calls.at(-1);
  if (!lastCall) throw new Error("res.json was not called");
  const { keys } = lastCall[0] as { keys?: Record<string, string> };
  if (!keys)
    throw new Error(`response carried no keys: ${JSON.stringify(lastCall[0])}`);
  return Object.fromEntries(
    Object.entries(keys).map(([collection, key]) => [
      collection,
      key.replace(/^scoped:/, ""),
    ]),
  );
}

beforeEach(async () => {
  vi.clearAllMocks();
  fakeFirestore.supervisionStaff.clear();
  fakeFirestore.incarcerationStaff.clear();
  fakeFirestore.userUpdates.clear();
  fakeFirestore.supervisionSupervisors.clear();
  fakeFirestore.incarcerationSupervisors.clear();
  process.env["TYPESENSE_API_SEARCH_KEY"] = "test-parent-key";
  mockGenerateScopedSearchKey.mockImplementation(
    (_parent: unknown, opts: { filter_by: string }) =>
      `scoped:${opts.filter_by}`,
  );
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

  // A missing externalId alone doesn't 422 — see the "no externalId
  // fallback" describe block below. 422 requires no identity at all (no
  // externalId and no email).
  test("returns 422 when user has neither externalId nor email", async () => {
    const res = makeRes();
    await mintPersonScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "SUPERVISION" },
        makeUser({ externalId: null, email: "" }),
      ),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(422);
  });
});

// --------------------------------------------------------------------------
// No externalId fallback
// --------------------------------------------------------------------------

// A user can lack an externalId in Auth0 app_metadata while still having a
// real Firestore staff record (the two are independently synced) or a real
// `district` straight in app_metadata. See the identical block in
// caseloadScopedKey.test.ts — these mirror it, but assert against the
// person-side (officerId/district) grant instead of the staff-side one.
describe("mintPersonScopedKey — no externalId fallback", () => {
  test("no externalId, but email matches a real staff record → scopes by that record's district", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_officer_by_email", {
      email: "user@example.com",
      stateCode: "US_TN",
      district: "Region 9",
      staffExternalId: "OFFICER-BY-EMAIL",
    });

    const res = makeRes();
    await mintPersonScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "SUPERVISION" },
        makeUser({ externalId: null }),
      ),
      res,
    );

    expect(mintedFilters(res).clients).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 9`])",
    );
  });

  test("no externalId, email match with no district → own-caseload officerId grant keyed to the found record's staffExternalId", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_officer_by_email", {
      email: "user@example.com",
      stateCode: "US_TN",
      staffExternalId: "OFFICER-BY-EMAIL",
    });

    const res = makeRes();
    await mintPersonScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "SUPERVISION" },
        makeUser({ externalId: null }),
      ),
      res,
    );

    expect(mintedFilters(res).clients).toBe(
      "stateCode:=`US_TN` && (officerId:=[`OFFICER-BY-EMAIL`])",
    );
  });

  test("no externalId, email match found but that record has no district → falls back to app_metadata's district", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_officer_by_email", {
      email: "user@example.com",
      stateCode: "US_TN",
      staffExternalId: "OFFICER-BY-EMAIL",
    });

    const res = makeRes();
    await mintPersonScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "SUPERVISION" },
        // app_metadata carries a district the real record doesn't have.
        makeUser({ externalId: null, district: "Region 3" }),
      ),
      res,
    );

    expect(mintedFilters(res).clients).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 3`])",
    );
  });

  test("no externalId, no matching staff record, but app_metadata carries a district → district scope", async () => {
    const res = makeRes();
    await mintPersonScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "SUPERVISION" },
        makeUser({ externalId: null, district: "Region 3" }),
      ),
      res,
    );

    expect(mintedFilters(res).clients).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 3`])",
    );
  });

  test("no externalId, no matching staff record, no district → none base (never-match), not a 422", async () => {
    const res = makeRes();
    await mintPersonScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "SUPERVISION" },
        makeUser({ externalId: null }),
      ),
      res,
    );

    expect(res.status).not.toHaveBeenCalled();
    expect(mintedFilters(res).clients).toBe(
      "stateCode:=`US_TN` && (id:=`__no_match__`)",
    );
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
    expect(mintedFilters(res).clients).toBe("stateCode:=`US_TN`");
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

    expect(mintedFilters(res).clients).toBe(
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

    // An INCARCERATION request mints only the residents key.
    expect(mintedFilters(res)).toEqual({ residents: "stateCode:=`US_TN`" });
  });

  test("no staff record + no district → none base compiles to never-match sentinel", async () => {
    // hasCaseload=false → base falls back to `none`, which carries no grant.
    const res = makeRes();
    await mintPersonScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }, makeUser()),
      res,
    );

    expect(mintedFilters(res).clients).toBe(
      "stateCode:=`US_TN` && (id:=`__no_match__`)",
    );
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

    expect(mintedFilters(res).clients).toBe(
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

    expect(mintedFilters(res).clients).toBe(
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

    expect(mintedFilters(res).clients).toBe(
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

    expect(mintedFilters(res).clients).toBe("stateCode:=`US_TN`");
  });

  test("user-updates overrideDistrictIds wins over staff record district", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });
    fakeFirestore.userUpdates.set("user@example.com", {
      overrideDistrictIds: ["Region 2", "Region 3"],
    });

    const res = makeRes();
    await mintPersonScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }, makeUser()),
      res,
    );

    expect(mintedFilters(res).clients).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 2`, `Region 3`])",
    );
  });

  test("fetchSupervisedStaffExternalIds canary: incarcerationStaff match fires Sentry, does NOT expand scope", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });
    fakeFirestore.incarcerationSupervisors.set("OFFICER123", ["STAFF456"]);

    const res = makeRes();
    await mintPersonScopedKey(
      makeReq(
        { currentTenantId: "US_TN", system: "SUPERVISION" },
        makeUser({ featureVariants: { workflowsSupervisorSearch: true } }),
      ),
      res,
    );

    expect(mockSentryCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockSentryCaptureMessage).toHaveBeenCalledWith(
      expect.stringContaining("cross-system supervisor invariant violated"),
      expect.objectContaining({
        level: "warning",
        extra: expect.objectContaining({ externalId: "OFFICER123" }),
      }),
    );
    expect(mintedFilters(res).clients).toBe(
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

    // Residents take no district grant, because a resident carries no district.
    expect(mintedFilters(res)).toEqual({
      clients: "stateCode:=`US_MI` && (district:=[`Region 3`])",
      residents: "stateCode:=`US_MI`",
    });
  });
});

// --------------------------------------------------------------------------
// Response shape
// --------------------------------------------------------------------------

describe("mintPersonScopedKey — response shape", () => {
  test("returns a key per collection, ISO expiresAt, and typesenseHost", async () => {
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
        keys: { clients: expect.any(String) },
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
        filtersByCollection: expect.any(Object),
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
