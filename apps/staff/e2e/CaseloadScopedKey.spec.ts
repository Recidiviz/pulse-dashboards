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

// Scope permutations for the caseload scoped-key endpoint, asserted twice over:
// the filter_by staff-server compiles, and the documents Typesense actually
// returns when that key is used.
//
// The second half is what unit tests cannot reach: a filter can be a correct
// string and still be rejected, because Typesense validates filter fields
// against the collection being searched.
//
// No browser is started here; these drive staff-server and Typesense directly.

import { APIRequestContext, expect, request, test } from "@playwright/test";

import {
  API_BASE_URL,
  mintCaseloadKeys,
  type OfflineUserSpec,
  postScopedKey,
  searchIds,
  TYPESENSE_URL,
} from "./utils";

let api: APIRequestContext;

test.beforeAll(async () => {
  api = await request.newContext({ baseURL: API_BASE_URL });
});

test.afterAll(async () => {
  await api.dispose();
});

// Staff fixtures this spec joins against. See the "Typesense scope
// permutations" block in libs/datatypes/.../Supervision/Workflows/fixture.ts.
const TN_OFFICER: OfflineUserSpec = {
  stateCode: "us_tn",
  externalId: "E2E_TN_OFFICER",
};
const TN_OVERRIDE: OfflineUserSpec = {
  stateCode: "us_tn",
  externalId: "E2E_TN_OVERRIDE",
};
const TN_SUPERVISOR: OfflineUserSpec = {
  stateCode: "us_tn",
  externalId: "E2E_TN_SUPERVISOR",
};
// Deliberately has no staff record at all; only the reports pointing at them
// exist. That is currently the ONLY way to reach a `none` base scope, because
// UserScopeContext derives `hasCaseload` as `staff !== null` — the existence of
// a record, not the record's own `hasCaseload` field. A staff record carrying
// `hasCaseload: false` (which the US_TX supervisor approval flow now produces)
// resolves to byEmail instead. Tracked as a separate bug; when it is fixed this
// fixture can become a record with `hasCaseload: false`.
const TN_LEAD: OfflineUserSpec = {
  stateCode: "us_tn",
  externalId: "E2E_TN_LEAD",
};
const ID_OFFICER: OfflineUserSpec = {
  stateCode: "us_id",
  externalId: "E2E_ID_OFFICER",
};
const MI_OFFICER: OfflineUserSpec = {
  stateCode: "us_mi",
  externalId: "E2E_MI_OFFICER",
};
const CA_OFFICER: OfflineUserSpec = {
  stateCode: "us_ca",
  externalId: "E2E_CA_OFFICER",
};
const CA_SUPERVISOR: OfflineUserSpec = {
  stateCode: "us_ca",
  externalId: "E2E_CA_SUPERVISOR",
};
// No externalId, so staff-server resolves its default Recidiviz identity.
const RECIDIVIZ: OfflineUserSpec = { stateCode: "recidiviz" };

const SUPERVISOR_SEARCH = { workflowsSupervisorSearch: {} };
const UNRESTRICTED_SEARCH = { supervisionUnrestrictedSearch: {} };

const NEVER_MATCH = "id:=`__no_match__`";

test.describe("caseload scoped key — state baselines", () => {
  test("US_TN district scope excludes staff in other districts", async () => {
    const { filters, keys } = await mintCaseloadKeys(api, {
      stateCode: "US_TN",
      system: "SUPERVISION",
      offlineUser: TN_OFFICER,
    });

    expect(filters.supervisionStaff).toBe(
      "stateCode:=`US_TN` && (district:=[`E2E DISTRICT 1`])",
    );

    const staff = await searchIds(keys, "supervisionStaff", "staffExternalId");
    expect(staff).toContain("E2E_TN_OFFICER");
    expect(staff).not.toContain("E2E_TN_PEER");
  });

  test("US_TN district scope narrows locations to that district", async () => {
    const { filters, keys } = await mintCaseloadKeys(api, {
      stateCode: "US_TN",
      system: "SUPERVISION",
      offlineUser: TN_OFFICER,
    });

    // Districts match `locationId`, since that is where a district's name lives
    // on districtId docs.
    expect(filters.locations).toBe(
      "stateCode:=`US_TN` && (system:=`SUPERVISION` && (locationId:=[`E2E DISTRICT 1`]))",
    );

    const districts = await searchIds(keys, "locations", "locationId");
    expect(districts).toEqual(["E2E DISTRICT 1"]);
  });

  test("overrideDistrictIds beats the staff record's own district", async () => {
    const { filters, keys } = await mintCaseloadKeys(api, {
      stateCode: "US_TN",
      system: "SUPERVISION",
      offlineUser: TN_OVERRIDE,
    });

    expect(filters.supervisionStaff).toBe(
      "stateCode:=`US_TN` && (district:=[`E2E DISTRICT 2`, `E2E DISTRICT 3`])",
    );

    // The user's own record sits in DISTRICT 1, which the override drops.
    const staff = await searchIds(keys, "supervisionStaff", "staffExternalId");
    expect(staff).not.toContain("E2E_TN_OVERRIDE");
    expect(staff).toContain("E2E_TN_PEER");
  });

  test("US_ID with no district falls back to own caseload by email", async () => {
    const { filters, keys } = await mintCaseloadKeys(api, {
      stateCode: "US_ID",
      system: "SUPERVISION",
      offlineUser: ID_OFFICER,
    });

    expect(filters.supervisionStaff).toBe(
      "stateCode:=`US_ID` && (email:=`e2e-id-officer@example.com`)",
    );

    const staff = await searchIds(keys, "supervisionStaff", "staffExternalId");
    expect(staff).toEqual(["E2E_ID_OFFICER"]);
  });

  // A byEmail scope has no district to project onto a location, so the filter
  // fails closed rather than widening.
  test("an own-caseload scope sees no districts at all", async () => {
    const { filters, keys } = await mintCaseloadKeys(api, {
      stateCode: "US_ID",
      system: "SUPERVISION",
      offlineUser: ID_OFFICER,
    });

    expect(filters.locations).toBe(
      `stateCode:=\`US_ID\` && (system:=\`SUPERVISION\` && (${NEVER_MATCH}))`,
    );
    expect(await searchIds(keys, "locations", "locationId")).toEqual([]);
  });

  test("US_MI district 10 expands to its prefixed districts", async () => {
    const { filters, keys } = await mintCaseloadKeys(api, {
      stateCode: "US_MI",
      system: "SUPERVISION",
      offlineUser: MI_OFFICER,
    });

    expect(filters.supervisionStaff).toBe(
      "stateCode:=`US_MI` && (district:=[`10 - WEST`, `10 - CENTRAL`, `10 - NORTHEAST`, `10 - NORTHWEST`])",
    );

    const districts = await searchIds(keys, "locations", "locationId");
    expect(districts.sort()).toEqual(["10 - CENTRAL", "10 - WEST"]);
    expect(districts).not.toContain("11 - SOUTH");
  });

  test("US_CA branches on roleSubtype: an officer gets own caseload", async () => {
    const { filters } = await mintCaseloadKeys(api, {
      stateCode: "US_CA",
      system: "SUPERVISION",
      offlineUser: CA_OFFICER,
    });

    // Own-caseload even though this officer has a district, because US_CA
    // resolves on roleSubtype rather than district.
    expect(filters.supervisionStaff).toBe(
      "stateCode:=`US_CA` && (email:=`e2e-ca-officer@example.com`)",
    );
  });

  test("US_CA branches on roleSubtype: a supervisor is unrestricted", async () => {
    const { filters, keys } = await mintCaseloadKeys(api, {
      stateCode: "US_CA",
      system: "SUPERVISION",
      offlineUser: CA_SUPERVISOR,
    });

    expect(filters.supervisionStaff).toBe("stateCode:=`US_CA`");

    const staff = await searchIds(keys, "supervisionStaff", "staffExternalId");
    expect(staff).toContain("E2E_CA_OFFICER");
    expect(staff).toContain("E2E_CA_SUPERVISOR");
  });
});

test.describe("caseload scoped key — feature variants", () => {
  // The supervisor clause matches the PLURAL `supervisorExternalIds`.
  test("supervisor search ORs the reports onto the district scope", async () => {
    const { filters, keys } = await mintCaseloadKeys(api, {
      stateCode: "US_TN",
      system: "SUPERVISION",
      offlineUser: { ...TN_SUPERVISOR, featureVariants: SUPERVISOR_SEARCH },
    });

    expect(filters.supervisionStaff).toBe(
      "stateCode:=`US_TN` && (district:=[`E2E DISTRICT 3`] || supervisorExternalId:=`E2E_TN_SUPERVISOR` || supervisorExternalIds:=[`E2E_TN_SUPERVISOR`])",
    );

    // The report sits in a different district, so only the expansion reaches them.
    const staff = await searchIds(keys, "supervisionStaff", "staffExternalId");
    expect(staff).toContain("E2E_TN_SUPERVISOR");
    expect(staff).toContain("E2E_TN_REPORT");
    expect(staff).not.toContain("E2E_TN_OFFICER");
  });

  test("without the variant a supervisor sees only their district", async () => {
    const { keys } = await mintCaseloadKeys(api, {
      stateCode: "US_TN",
      system: "SUPERVISION",
      offlineUser: TN_SUPERVISOR,
    });

    const staff = await searchIds(keys, "supervisionStaff", "staffExternalId");
    expect(staff).toEqual(["E2E_TN_SUPERVISOR"]);
  });

  // With no staff record the base scope is `none`, so the expansion is the
  // entire filter rather than one arm of an OR.
  test("a supervisor with no staff record sees only their reports", async () => {
    const { filters, keys } = await mintCaseloadKeys(api, {
      stateCode: "US_TN",
      system: "SUPERVISION",
      offlineUser: { ...TN_LEAD, featureVariants: SUPERVISOR_SEARCH },
    });

    expect(filters.supervisionStaff).toBe(
      "stateCode:=`US_TN` && (supervisorExternalId:=`E2E_TN_LEAD` || supervisorExternalIds:=[`E2E_TN_LEAD`])",
    );

    const staff = await searchIds(keys, "supervisionStaff", "staffExternalId");
    expect(staff).toEqual(["E2E_TN_REPORT_2"]);
  });

  test("no record and no variant matches nothing", async () => {
    const { filters, keys } = await mintCaseloadKeys(api, {
      stateCode: "US_TN",
      system: "SUPERVISION",
      offlineUser: TN_LEAD,
    });

    expect(filters.supervisionStaff).toBe(
      `stateCode:=\`US_TN\` && (${NEVER_MATCH})`,
    );
    expect(
      await searchIds(keys, "supervisionStaff", "staffExternalId"),
    ).toEqual([]);
  });

  test("unrestricted search drops the district scope entirely", async () => {
    const { filters, keys } = await mintCaseloadKeys(api, {
      stateCode: "US_TN",
      system: "SUPERVISION",
      offlineUser: { ...TN_OFFICER, featureVariants: UNRESTRICTED_SEARCH },
    });

    expect(filters.supervisionStaff).toBe("stateCode:=`US_TN`");

    const staff = await searchIds(keys, "supervisionStaff", "staffExternalId");
    expect(staff).toContain("E2E_TN_OFFICER");
    expect(staff).toContain("E2E_TN_PEER");
  });

  // Per-user the two variants are granted to different roles. If both land on
  // one user the bypass wins, matching production.
  test("unrestricted search beats supervisor search", async () => {
    const { filters } = await mintCaseloadKeys(api, {
      stateCode: "US_TN",
      system: "SUPERVISION",
      offlineUser: {
        ...TN_SUPERVISOR,
        featureVariants: { ...SUPERVISOR_SEARCH, ...UNRESTRICTED_SEARCH },
      },
    });

    expect(filters.supervisionStaff).toBe("stateCode:=`US_TN`");
  });
});

test.describe("caseload scoped key — systems", () => {
  test("a SUPERVISION request mints no incarceration key", async () => {
    const { filters } = await mintCaseloadKeys(api, {
      stateCode: "US_TN",
      system: "SUPERVISION",
      offlineUser: TN_OFFICER,
    });

    expect(Object.keys(filters).sort()).toEqual([
      "locations",
      "supervisionStaff",
    ]);
  });

  test("US_TN INCARCERATION is unrestricted within the state", async () => {
    const { filters } = await mintCaseloadKeys(api, {
      stateCode: "US_TN",
      system: "INCARCERATION",
      offlineUser: TN_OFFICER,
    });

    expect(filters).toEqual({
      incarcerationStaff: "stateCode:=`US_TN`",
      locations: "stateCode:=`US_TN` && system:=`INCARCERATION`",
    });
  });

  // US_MI is district-scoped for supervision and unrestricted for
  // incarceration, so one ALL request has to carry both rules at once.
  test("ALL applies each system's own rules under one locations key", async () => {
    const { filters } = await mintCaseloadKeys(api, {
      stateCode: "US_MI",
      system: "ALL",
      offlineUser: MI_OFFICER,
    });

    expect(filters.supervisionStaff).toBe(
      "stateCode:=`US_MI` && (district:=[`10 - WEST`, `10 - CENTRAL`, `10 - NORTHEAST`, `10 - NORTHWEST`])",
    );
    expect(filters.incarcerationStaff).toBe("stateCode:=`US_MI`");
    expect(filters.locations).toBe(
      "stateCode:=`US_MI` && ((system:=`SUPERVISION` && (locationId:=[`10 - WEST`, `10 - CENTRAL`, `10 - NORTHEAST`, `10 - NORTHWEST`])) || system:=`INCARCERATION`)",
    );
  });

  test("a Recidiviz user is unrestricted in whichever tenant they view", async () => {
    const { filters, keys } = await mintCaseloadKeys(api, {
      stateCode: "US_TN",
      system: "SUPERVISION",
      offlineUser: RECIDIVIZ,
    });

    expect(filters.supervisionStaff).toBe("stateCode:=`US_TN`");

    // Still bounded by the tenant, which is the one restriction that survives.
    const staff = await searchIds(keys, "supervisionStaff", "staffExternalId");
    expect(staff).toContain("E2E_TN_OFFICER");
    expect(staff).not.toContain("E2E_ID_OFFICER");
  });
});

test.describe("caseload scoped key — validation", () => {
  test("rejects a missing system", async () => {
    const response = await postScopedKey(
      api,
      "/api/US_TN/workflows/caseload-scoped-key",
      {},
    );
    expect(response.status()).toBe(400);
  });

  test("rejects an unknown system", async () => {
    const response = await postScopedKey(
      api,
      "/api/US_TN/workflows/caseload-scoped-key",
      { system: "EVERYTHING" },
    );
    expect(response.status()).toBe(400);
  });

  // A key is only usable against Typesense for as long as it is valid, and the
  // client's refresh logic assumes one shared deadline across collections.
  test("every collection's key shares one expiry", async () => {
    const response = await postScopedKey(
      api,
      "/api/US_MI/workflows/caseload-scoped-key",
      { system: "ALL", offlineUser: MI_OFFICER },
    );
    const body = await response.json();

    expect(Object.keys(body.keys).length).toBe(3);
    expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(body.typesenseHost).toBe(TYPESENSE_URL);
  });
});
