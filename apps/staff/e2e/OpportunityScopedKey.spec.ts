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

// The `opportunities` scoped key, asserted against a real Typesense node.
//
// This spec guards against a filter Typesense ACCEPTS AND THEN IGNORES, so
// every assertion is on result sets, never on a thrown error.
//
// Typesense discards a scoped key's JOIN clause whenever the query's filter_by
// puts any join into a top-level OR. Measured on 30.2: 2,520 documents where
// 420 was correct. Plain clauses keep binding, which is why this key names no
// join at all.
//
// No browser is started here; these drive staff-server and Typesense directly.

import { APIRequestContext, expect, request, test } from "@playwright/test";

import {
  API_BASE_URL,
  mintPersonKeys,
  type OfflineUserSpec,
  searchWithFilter,
} from "./utils";

let api: APIRequestContext;

test.beforeAll(async () => {
  api = await request.newContext({ baseURL: API_BASE_URL });
});

test.afterAll(async () => {
  await api.dispose();
});

const BOTH_SYSTEMS = { workflowsSupervision: true, workflowsFacilities: true };

// The tenant these specs mint against. US_TN carries both systems in the
// fixtures, which the system-separation cases need.
const TENANT = "us_tn";

const TN_OFFICER: OfflineUserSpec = {
  stateCode: TENANT,
  externalId: "E2E_TN_OFFICER",
  routes: BOTH_SYSTEMS,
};
const TN_SUPERVISOR: OfflineUserSpec = {
  stateCode: TENANT,
  externalId: "E2E_TN_SUPERVISOR",
  routes: BOTH_SYSTEMS,
};
// No externalId, so staff-server resolves its unrestricted Recidiviz identity.
// That is an IDENTITY, not a tenant: every mint below still names a real one.
const RECIDIVIZ: OfflineUserSpec = { stateCode: "recidiviz" };

/**
 * Every query shape that breaks a JOIN-carrying key.
 *
 * Each names a CONCRETE join predicate: Typesense rejects `officerId:*` inside
 * a join, which under an OR surfaces as an empty result rather than an error.
 *
 * CONTAINMENT first — returning fewer documents is safe, only MORE is a leak.
 * `exact: true` pins the shapes that are tautologies over the key's own scope,
 * so the suite cannot go green by returning nothing.
 */
const BYPASS_SHAPES = [
  {
    label: "join || plain",
    filterBy: "($residents(stateCode:=`US_TN`) || id:*)",
    exact: true,
  },
  {
    label: "id:* || join  (the documented left-join idiom)",
    filterBy: "(id:* || $clients(stateCode:=`US_TN`))",
    exact: true,
  },
  {
    label: "cross-collection OR of joins",
    filterBy:
      "($clients(stateCode:=`US_TN`) || $residents(stateCode:=`US_TN`))",
    exact: true,
  },
  {
    // The join names a state the key does not grant. It must not become a way
    // to reach that state.
    label: "join naming another state",
    filterBy: "(id:* || $residents(stateCode:=`US_ND`))",
    exact: true,
  },
  {
    // ...and the join reaches for people outside the granted facility.
    label: "join reaching outside the granted location",
    filterBy: "(id:* || $residents(facilityId:!=`BLEDSOE_CC`))",
    exact: true,
  },
];
test.describe("the compiled key", () => {
  test("names no join, for any scope", async () => {
    // THE invariant. A key with no join never enters the code path that
    // rewrites — and loses — a key's join clause.
    /* eslint-disable no-await-in-loop -- sequential by design: staff-server
     * rate-limits mints per IP, and concurrent calls trip it. */
    for (const user of [TN_OFFICER, TN_SUPERVISOR, RECIDIVIZ]) {
      const { filters } = await mintPersonKeys(api, {
        stateCode: TENANT,
        system: "ALL",
        offlineUser: user,
      });

      expect(
        filters.opportunities,
        `${user.externalId ?? "recidiviz"} minted a key containing a join`,
      ).not.toContain("$");
    }
    /* eslint-enable no-await-in-loop */
  });

  test("pairs every locationId clause with a system clause", async () => {
    // `locationId` holds a district OR a facility, so the discriminator is what
    // stops two ids from different systems matching each other.
    const { filters } = await mintPersonKeys(api, {
      stateCode: TENANT,
      system: "ALL",
      offlineUser: TN_OFFICER,
    });

    const filterBy = filters.opportunities;
    if (filterBy.includes("locationId:=")) {
      const grouped = [
        ...filterBy.matchAll(/\(system:=[^()]*&&\s*\(([^()]*)\)\)/g),
      ]
        .map((m) => m[1])
        .join(" ");
      expect((grouped.match(/locationId:=/g) ?? []).length).toBe(
        (filterBy.match(/locationId:=/g) ?? []).length,
      );
    }
  });
});

test.describe("a restricted key binds against hostile queries", () => {
  test("every bypass shape returns exactly the scoped set", async () => {
    const { keys } = await mintPersonKeys(api, {
      stateCode: TENANT,
      system: "ALL",
      offlineUser: TN_OFFICER,
    });

    const scoped = (await searchWithFilter(keys, "opportunities")).sort();
    // A scope that matches nothing would make every comparison below pass
    // vacuously, so refuse to run rather than report a false green.
    expect(
      scoped.length,
      "the fixture scope matched no opportunities — this spec cannot prove anything",
    ).toBeGreaterThan(0);

    // ...and that it actually EXCLUDES something. A scope that happens to admit
    // everything would make a leak indistinguishable from correct behaviour.
    const { keys: unrestricted } = await mintPersonKeys(api, {
      stateCode: TENANT,
      system: "ALL",
      offlineUser: RECIDIVIZ,
    });
    const everything = await searchWithFilter(unrestricted, "opportunities");
    expect(
      everything.length,
      "the restricted scope admits everything the unrestricted one does",
    ).toBeGreaterThan(scoped.length);

    const allowed = new Set(scoped);
    let exactShapes = 0;

    /* eslint-disable no-await-in-loop -- sequential by design: each shape is
     * compared against one scoped set captured before the loop. */
    for (const { label, filterBy, exact } of BYPASS_SHAPES) {
      const returned = (
        await searchWithFilter(keys, "opportunities", filterBy)
      ).sort();

      const leaked = returned.filter((id) => !allowed.has(id));
      expect(leaked, `leaked past the key via: ${label}`).toEqual([]);

      if (exact) {
        exactShapes += 1;
        expect(returned, `narrowed unexpectedly by: ${label}`).toEqual(scoped);
      }
    }
    /* eslint-enable no-await-in-loop */

    // Containment alone is satisfied by returning nothing, so at least one
    // shape has to reach the whole scoped set for this to prove binding.
    expect(exactShapes).toBeGreaterThan(0);
  });

  test("cannot be widened by a plain filter either", async () => {
    const { keys } = await mintPersonKeys(api, {
      stateCode: TENANT,
      system: "ALL",
      offlineUser: TN_OFFICER,
    });

    const scoped = await searchWithFilter(keys, "opportunities");
    const widened = await searchWithFilter(
      keys,
      "opportunities",
      "id:* || stateCode:*",
    );

    expect(widened.sort()).toEqual(scoped.sort());
  });
});

test.describe("system separation", () => {
  test("a supervision-only request reaches no incarceration document", async () => {
    const { keys, filters } = await mintPersonKeys(api, {
      stateCode: TENANT,
      system: "SUPERVISION",
      offlineUser: TN_OFFICER,
    });

    // Expressed by OMITTING the system, not by leaving it unbounded.
    expect(filters.opportunities).toContain("SUPERVISION");
    expect(filters.opportunities).not.toContain("INCARCERATION");

    const reached = await searchWithFilter(
      keys,
      "opportunities",
      "system:=`INCARCERATION`",
    );
    expect(reached).toEqual([]);
  });

  test("an unrestricted user still cannot leave their state", async () => {
    const { keys } = await mintPersonKeys(api, {
      stateCode: TENANT,
      system: "ALL",
      offlineUser: RECIDIVIZ,
    });

    const otherState = await searchWithFilter(
      keys,
      "opportunities",
      "stateCode:=`US_ND`",
    );
    expect(otherState).toEqual([]);
  });
});

test.describe("when client and a resident had the same ids", () => {
  // A TN client of TN_OFFICER in E2E DISTRICT 1 and a TN resident at
  // BLEDSOE_CC, under one external id, with one supervisionLevelDowngrade
  // opportunity. The two person collections share an id space, so an
  // opportunity cannot tell which of them it belongs to from the id alone.
  const PERSON_FILTER = "externalId:=`E2E_TN_BOTH`";

  async function allOpportunitiesOfPerson(): Promise<string[]> {
    const { keys } = await mintPersonKeys(api, {
      stateCode: TENANT,
      system: "ALL",
      offlineUser: RECIDIVIZ,
    });
    return (
      await searchWithFilter(keys, "opportunities", PERSON_FILTER)
    ).sort();
  }

  test("has its opportunity indexed", async () => {
    // Every case below compares against this set, so an empty one would let
    // them pass without proving anything.
    expect(await allOpportunitiesOfPerson()).toHaveLength(1);
  });

  // FIXME: the backfill and the offline seed merge scope from clients and then
  // residents, and the residents match overwrites system, officerId and
  // locationId. This opportunity is indexed as INCARCERATION at BLEDSOE_CC.
  test.fixme(
    "indexes a supervision opportunity under SUPERVISION",
    async () => {
      const all = await allOpportunitiesOfPerson();

      const { keys } = await mintPersonKeys(api, {
        stateCode: TENANT,
        system: "ALL",
        offlineUser: RECIDIVIZ,
      });
      const supervision = await searchWithFilter(
        keys,
        "opportunities",
        `${PERSON_FILTER} && system:=\`SUPERVISION\``,
      );

      expect(supervision.sort()).toEqual(all);
    },
  );

  // FIXME: same cause as above. The supervising officer's supervision-only key
  // cannot reach the opportunity, because it is indexed under the other system.
  test.fixme(
    "reaches the supervising officer's supervision-only key",
    async () => {
      const all = await allOpportunitiesOfPerson();

      const { keys } = await mintPersonKeys(api, {
        stateCode: TENANT,
        system: "SUPERVISION",
        offlineUser: TN_OFFICER,
      });
      const reached = await searchWithFilter(
        keys,
        "opportunities",
        PERSON_FILTER,
      );

      expect(reached.sort()).toEqual(all);
    },
  );
});

test.describe("the child collection", () => {
  test("is not minted a key of its own", async () => {
    // `opportunityUpdates` is reached only through a join, so nothing mints for
    // it. If that changes, PersonFilterCompiler's note stops being true.
    const { keys } = await mintPersonKeys(api, {
      stateCode: TENANT,
      system: "ALL",
      offlineUser: TN_OFFICER,
    });

    expect(Object.keys(keys)).not.toContain("opportunityUpdates");
  });

  test("is not reachable by pointing an opportunities key at it", async () => {
    // Rejected on the FILTER: an opportunities key names `system` and
    // `locationId`, which this collection does not declare. A different guard
    // from the key-scope one below, and it would still hold if the parent key
    // were widened by mistake.
    const { keys } = await mintPersonKeys(api, {
      stateCode: TENANT,
      system: "ALL",
      offlineUser: TN_OFFICER,
    });

    await expect(
      searchWithFilter(
        { opportunityUpdates: keys.opportunities },
        "opportunityUpdates",
      ),
    ).rejects.toThrow(/rejected the search/);
  });

  test("is not reachable by an UNRESTRICTED person key either", async () => {
    // THE authorization boundary, and the one a filter cannot provide.
    //
    // An unrestricted grant compiles to a bare `stateCode:=` clause — see
    // PersonFilterCompiler.predicateFor returning null — and this collection
    // DECLARES `stateCode`, so that filter is perfectly valid against it.
    // Nothing about the query is malformed; only the key's scope stops it.
    //
    // Measured before the parent key was narrowed: this returned every
    // document in the collection — denial reasons, action history carrying
    // officer and supervisor emails, adjudications — for the whole state.
    //
    // The opportunities key above is rejected for an unrelated reason, so it
    // would keep passing even if this boundary were removed.
    const { keys, filters } = await mintPersonKeys(api, {
      stateCode: TENANT,
      system: "ALL",
      offlineUser: RECIDIVIZ,
    });

    // Pin the premise: if this stops being a bare state clause, the test is no
    // longer exercising the case it was written for.
    expect(filters.clients).toBe("stateCode:=`US_TN`");

    await expect(
      searchWithFilter(
        { opportunityUpdates: keys.clients },
        "opportunityUpdates",
      ),
    ).rejects.toThrow();
  });
});
