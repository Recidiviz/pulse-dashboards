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

// Only fetchImpersonatedUserRestrictions is used from routes/api in the mint
// path; stub it so impersonation tests don't hit the recidiviz-data auth API.
const mockFetchImpersonatedUserRestrictions = vi.fn();
vi.mock("../../routes/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../routes/api")>();
  return {
    ...actual,
    fetchImpersonatedUserRestrictions: (...args: unknown[]) =>
      mockFetchImpersonatedUserRestrictions(...args),
  };
});

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
          // Supervisor lookups only match supervisionStaff in healthy states —
          // the parallel incarcerationStaff query is a Sentry canary in
          // fetchSupervisedStaffExternalIds. `incarcerationSupervisors` lets a
          // test force the violation to exercise the alert path.
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

// Returns the filter_by baked into each collection's key.
//
// The handler mints one key per collection, so the filters are read back off the
// response rather than off the mint call order: the key-generation mock echoes
// its filter_by (see beforeEach), and the response maps collection -> key, which
// correlates the two without depending on which order the keys were minted in.
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
  // Non-offline path: initTypesenseScopedKeys reads TYPESENSE_API_SEARCH_KEY
  // directly.
  process.env["TYPESENSE_API_SEARCH_KEY"] = "test-parent-key";
  mockGenerateScopedSearchKey.mockImplementation(
    (_parent: unknown, opts: { filter_by: string }) =>
      `scoped:${opts.filter_by}`,
  );
  vi.mocked(isOfflineMode).mockReturnValue(false);
  // Mirrors the server bootstrap in index.js — populates the module-level
  // searchOnlyParentKey before any request is served.
  await initTypesenseScopedKeys();
});

// --------------------------------------------------------------------------
// Validation
// --------------------------------------------------------------------------

describe("mintCaseloadScopedKey — validation", () => {
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
    // One key per collection a SUPERVISION request covers.
    expect(mockGenerateScopedSearchKey).toHaveBeenCalledTimes(2);
    expect(mintedFilters(res).supervisionStaff).toBe("stateCode:=`US_TN`");
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
    expect(mintedFilters(res)).toEqual({
      supervisionStaff: "stateCode:=`US_MI`",
      incarcerationStaff: "stateCode:=`US_MI`",
      locations:
        "stateCode:=`US_MI` && (system:=`SUPERVISION` || system:=`INCARCERATION`)",
    });
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

    expect(mintedFilters(res).supervisionStaff).toBe(
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

    // An INCARCERATION request mints no supervision-staff key at all.
    expect(mintedFilters(res)).toEqual({
      incarcerationStaff: "stateCode:=`US_TN`",
      locations: "stateCode:=`US_TN` && system:=`INCARCERATION`",
    });
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
    expect(mintedFilters(res).supervisionStaff).toBe(
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

    expect(mintedFilters(res).supervisionStaff).toBe(
      "stateCode:=`US_TN` && (id:=`__no_match__`)",
    );
  });

  test("workflowsSupervisorSearch FV + user is supervisor → district OR supervisor expansion", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });
    fakeFirestore.supervisionSupervisors.set("OFFICER123", ["OFFICER123"]);

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

    expect(mintedFilters(res).supervisionStaff).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 1`] || supervisorExternalId:=`OFFICER123` || supervisorExternalIds:=[`OFFICER123`])",
    );
  });

  test("supervisionUnrestrictedSearch FV → unrestricted, supervisor expansion dropped even when isSupervisor=true", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });
    fakeFirestore.supervisionSupervisors.set("OFFICER123", ["OFFICER123"]);

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

    expect(mintedFilters(res).supervisionStaff).toBe("stateCode:=`US_TN`");
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

    expect(mintedFilters(res).supervisionStaff).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 2`, `Region 3`])",
    );
  });

  test("fetchSupervisedStaffExternalIds canary: incarcerationStaff match fires Sentry, does NOT flip isSupervisor", async () => {
    // Healthy invariant: only supervisionStaff docs carry supervisorExternalId.
    // Simulate ETL drift by matching the officer on incarcerationStaff but NOT
    // supervisionStaff. Expectation: Sentry.captureMessage is called; the
    // supervision-side answer (empty) stays authoritative, so the filter does
    // NOT include the supervisor expansion.
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });
    fakeFirestore.incarcerationSupervisors.set("OFFICER123", ["OFFICER123"]);

    const res = makeRes();
    await mintCaseloadScopedKey(
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
    // No supervisor expansion — supervision-side lookup returned empty.
    expect(mintedFilters(res).supervisionStaff).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 1`])",
    );
  });
});

// --------------------------------------------------------------------------
// Impersonation
// --------------------------------------------------------------------------

// A Recidiviz admin impersonating a state user mints with the admin's own JWT
// (stateCode "recidiviz"), which would otherwise short-circuit to unrestricted
// and leak the whole state. When the body carries `impersonatedEmail`, the
// scope is resolved for the impersonated user instead — reproducing the scope
// that user would get logging in themselves.
describe("mintCaseloadScopedKey — impersonation", () => {
  test("resolves the impersonated user's district scope, not the admin's unrestricted scope", async () => {
    mockFetchImpersonatedUserRestrictions.mockResolvedValue({
      externalId: "IMP123",
      featureVariants: {},
    });
    fakeFirestore.supervisionStaff.set("us_tn_IMP123", {
      district: "Region 5",
      email: "impersonated@example.com",
    });

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq(
        {
          currentTenantId: "US_TN",
          system: "SUPERVISION",
          impersonatedEmail: "impersonated@example.com",
        },
        makeUser({ stateCode: "recidiviz", externalId: null }),
      ),
      res,
    );

    expect(mockFetchImpersonatedUserRestrictions).toHaveBeenCalledWith(
      "impersonated@example.com",
    );
    // District scope from the impersonated user's staff record — NOT the
    // admin's `stateCode:=\`US_TN\`` unrestricted filter.
    expect(mintedFilters(res).supervisionStaff).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 5`])",
    );
  });

  test("honors the impersonated user's feature variants (supervisionUnrestrictedSearch)", async () => {
    mockFetchImpersonatedUserRestrictions.mockResolvedValue({
      externalId: "IMP123",
      featureVariants: { supervisionUnrestrictedSearch: true },
    });
    fakeFirestore.supervisionStaff.set("us_tn_IMP123", {
      district: "Region 5",
      email: "impersonated@example.com",
    });

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq(
        {
          currentTenantId: "US_TN",
          system: "SUPERVISION",
          impersonatedEmail: "impersonated@example.com",
        },
        makeUser({ stateCode: "recidiviz", externalId: null }),
      ),
      res,
    );

    expect(mintedFilters(res).supervisionStaff).toBe("stateCode:=`US_TN`");
  });

  test("returns 422 when the impersonated user has no externalId", async () => {
    mockFetchImpersonatedUserRestrictions.mockResolvedValue({
      featureVariants: {},
    });

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq(
        {
          currentTenantId: "US_TN",
          system: "SUPERVISION",
          impersonatedEmail: "impersonated@example.com",
        },
        makeUser({ stateCode: "recidiviz", externalId: null }),
      ),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(422);
  });

  test("ignores impersonatedEmail from a non-Recidiviz caller (no escalation)", async () => {
    // A scoped state user cannot widen their scope by passing an email — the
    // impersonation branch is gated on the caller genuinely being Recidiviz.
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq(
        {
          currentTenantId: "US_TN",
          system: "SUPERVISION",
          impersonatedEmail: "someone-elses-unrestricted-account@example.com",
        },
        makeUser(),
      ),
      res,
    );

    expect(mockFetchImpersonatedUserRestrictions).not.toHaveBeenCalled();
    // Resolved as the caller themselves — their own district, not the
    // impersonated target's scope.
    expect(mintedFilters(res).supervisionStaff).toBe(
      "stateCode:=`US_TN` && (district:=[`Region 1`])",
    );
  });

  test("does not attempt impersonation in offline mode", async () => {
    vi.mocked(isOfflineMode).mockReturnValue(true);
    vi.mocked(fetchOfflineUser).mockReturnValue(
      makeUser({
        stateCode: "recidiviz",
        externalId: null,
      }) as unknown as ReturnType<typeof fetchOfflineUser>,
    );

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq({
        currentTenantId: "US_TN",
        system: "SUPERVISION",
        impersonatedEmail: "impersonated@example.com",
      }),
      res,
    );

    expect(mockFetchImpersonatedUserRestrictions).not.toHaveBeenCalled();
    // Falls through to the Recidiviz unrestricted path.
    expect(mintedFilters(res).supervisionStaff).toBe("stateCode:=`US_TN`");
  });
});

// --------------------------------------------------------------------------
// Offline user override
// --------------------------------------------------------------------------

// The offline bridge that lets an e2e spec choose which synthetic user the mint
// endpoint resolves. Without it every offline mint resolves the same fixed
// Recidiviz identity, so no scope permutation is reachable from a test.
describe("mintCaseloadScopedKey — offline user override", () => {
  beforeEach(() => {
    vi.mocked(isOfflineMode).mockReturnValue(true);
    vi.mocked(fetchOfflineUser).mockReturnValue(
      makeUser() as unknown as ReturnType<typeof fetchOfflineUser>,
    );
  });

  test("passes the allowlisted fields through to the offline user", async () => {
    await mintCaseloadScopedKey(
      makeReq({
        currentTenantId: "US_TN",
        system: "SUPERVISION",
        offlineUser: {
          stateCode: "us_tn",
          externalId: "OFFICER1",
          email: "officer@example.com",
          featureVariants: { workflowsSupervisorSearch: {} },
        },
      }),
      makeRes(),
    );

    expect(vi.mocked(fetchOfflineUser)).toHaveBeenCalledWith({
      stateCode: "us_tn",
      externalId: "OFFICER1",
      email: "officer@example.com",
      featureVariants: { workflowsSupervisorSearch: {} },
    });
  });

  test("drops fields outside the allowlist", async () => {
    await mintCaseloadScopedKey(
      makeReq({
        currentTenantId: "US_TN",
        system: "SUPERVISION",
        offlineUser: {
          externalId: "OFFICER1",
          // Not overridable: these come from the Firestore staff fixture.
          district: "Region 9",
          hasCaseload: false,
          isSupervisor: true,
          allowedStates: ["US_XX"],
        },
      }),
      makeRes(),
    );

    expect(vi.mocked(fetchOfflineUser)).toHaveBeenCalledWith({
      externalId: "OFFICER1",
    });
  });

  test("ignores values of the wrong type", async () => {
    await mintCaseloadScopedKey(
      makeReq({
        currentTenantId: "US_TN",
        system: "SUPERVISION",
        offlineUser: { stateCode: 42, externalId: null, featureVariants: "on" },
      }),
      makeRes(),
    );

    expect(vi.mocked(fetchOfflineUser)).toHaveBeenCalledWith({});
  });

  test("no override in the body resolves the default offline user", async () => {
    await mintCaseloadScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }),
      makeRes(),
    );

    expect(vi.mocked(fetchOfflineUser)).toHaveBeenCalledWith({});
  });

  // An override arriving on a deployed server must not choose an identity.
  test("is inert outside offline mode", async () => {
    vi.mocked(isOfflineMode).mockReturnValue(false);
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq(
        {
          currentTenantId: "US_TN",
          system: "SUPERVISION",
          offlineUser: { stateCode: "recidiviz", externalId: "SOMEONE_ELSE" },
        },
        makeUser(),
      ),
      res,
    );

    expect(vi.mocked(fetchOfflineUser)).not.toHaveBeenCalled();
    // Scope still comes from the JWT identity, not the override.
    expect(mintedFilters(res).supervisionStaff).toBe(
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

    // On locations the district predicate matches `locationId`, because that is
    // where a district's name lives on districtId docs.
    expect(mintedFilters(res)).toEqual({
      supervisionStaff: "stateCode:=`US_MI` && (district:=[`Region 3`])",
      incarcerationStaff: "stateCode:=`US_MI`",
      locations:
        "stateCode:=`US_MI` && ((system:=`SUPERVISION` && (locationId:=[`Region 3`])) || system:=`INCARCERATION`)",
    });
  });
});

// --------------------------------------------------------------------------
// Response shape
// --------------------------------------------------------------------------

describe("mintCaseloadScopedKey — response shape", () => {
  test("returns a key per collection, ISO expiresAt, and typesenseHost", async () => {
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
        keys: {
          supervisionStaff: expect.any(String),
          locations: expect.any(String),
        },
        expiresAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        typesenseHost: "https://typesense-test.example.com",
      }),
    );
  });

  test("every collection's key shares one expiry", async () => {
    fakeFirestore.supervisionStaff.set("us_tn_OFFICER123", {
      district: "Region 1",
      email: "officer@example.com",
    });

    const res = makeRes();
    await mintCaseloadScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "ALL" }, makeUser()),
      res,
    );

    const expiries = mockGenerateScopedSearchKey.mock.calls.map(
      (call) => (call[1] as { expires_at: number }).expires_at,
    );
    expect(expiries.length).toBe(3);
    expect(new Set(expiries).size).toBe(1);
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
    await mintCaseloadScopedKey(
      makeReq({ currentTenantId: "US_TN", system: "SUPERVISION" }, makeUser()),
      res,
    );

    const arg = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>;
    expect(arg).not.toHaveProperty("_debug");
  });
});
