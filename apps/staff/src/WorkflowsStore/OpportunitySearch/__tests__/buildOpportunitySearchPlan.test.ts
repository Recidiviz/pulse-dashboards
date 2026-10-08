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
  ACTED_ON_PAGE_SIZE,
  buildOpportunitySearchPlan,
  CENSUS_MAX_GROUPS,
  type OpportunitySearchPlanInput,
} from "../buildOpportunitySearchPlan";

const BASE: OpportunitySearchPlanInput = {
  searchFieldPaths: [["officerId"]],
  selectedSearchIds: ["OFFICER_1"],
  opportunityTypes: [{ type: "usTnLSU", system: "SUPERVISION" }],
};

function build(overrides: Partial<OpportunitySearchPlanInput> = {}) {
  return buildOpportunitySearchPlan({ ...BASE, ...overrides });
}

function filtersOf(plan: ReturnType<typeof build>) {
  return plan.map((p) => p.descriptor["filter_by"] as string);
}

describe("an empty selection", () => {
  // A plan that matches everything is the dangerous failure here, so the
  // absence of a selection must produce no searches at all.
  test.each([
    ["no selected ids", { selectedSearchIds: [] }],
    ["no search fields", { searchFieldPaths: [] }],
    ["no opportunity types", { opportunityTypes: [] }],
  ])("%s produces no searches", (_label, overrides) => {
    expect(build(overrides as Partial<OpportunitySearchPlanInput>)).toEqual([]);
  });
});

describe("the emitted filters", () => {
  test("every join sits inside an AND, never a top-level OR", () => {
    // THE invariant. `join || plain` is the shape that discards a scoped key's
    // join clause, and the failure returns extra documents without raising.
    const plan = build({
      opportunityTypes: [
        { type: "usTnLSU", system: "SUPERVISION" },
        { type: "usNeGoodTime", system: "INCARCERATION" },
      ],
      searchFieldPaths: [["officerId"], ["district"]],
      hydrateIneligibleTypes: ["usNeGoodTime"],
    });

    expect(plan.length).toBeGreaterThan(0);

    for (const filter of filtersOf(plan)) {
      // Strip every parenthesised group, leaving only the top level.
      let topLevel = filter;
      let previous: string;
      do {
        previous = topLevel;
        topLevel = topLevel.replace(/\([^()]*\)/g, "");
      } while (topLevel !== previous);

      // Reported as an object so a failure names the offending filter, since
      // this project's vitest config rejects the two-argument `expect`.
      const joinInTopLevelOr =
        topLevel.includes("||") && /\$\w+/.test(topLevel);
      expect({ filter, joinInTopLevelOr }).toEqual({
        filter,
        joinInTopLevelOr: false,
      });
    }
  });

  test("ORs several search fields inside the join, not outside it", () => {
    const [first] = filtersOf(
      build({ searchFieldPaths: [["officerId"], ["district"]] }),
    );

    expect(first).toContain(
      "$clients(officerId:=[`OFFICER_1`] || district:=[`OFFICER_1`])",
    );
  });

  test("joins a nested search field by its full path", () => {
    const [first] = filtersOf(
      build({ searchFieldPaths: [["metadata", "facilityUnitId"]] }),
    );

    expect(first).toContain("$clients(metadata.facilityUnitId:=");
  });

  test("escapes a backtick in a selected id", () => {
    const [first] = filtersOf(build({ selectedSearchIds: ["a`b"] }));

    expect(first).toContain("\\`");
  });
});

describe("the ELIGIBILITY shape", () => {
  test("filters to one type and both eligibility flags", () => {
    const [search] = build();

    expect(search.kind).toBe("eligibility");
    expect(search.descriptor["filter_by"]).toBe(
      "$clients(officerId:=[`OFFICER_1`]) && opportunityType:=`usTnLSU` && ( isEligible:=true || isAlmostEligible:=true ) && ( $opportunityUpdates(id:*) || id:* )",
    );
  });

  test("left-joins the child so the overlay projects without narrowing", () => {
    const [search] = build();

    // With no join in filter_by the overlay projects nothing and raises no
    // error. With a plain `&& $opportunityUpdates(...)` the join turns INNER
    // and drops every record without an update. This form does neither.
    expect(search.descriptor["filter_by"]).toContain(
      "( $opportunityUpdates(id:*) || id:* )",
    );
  });

  test("drops the eligibility clause for a hydrate-ineligible type", () => {
    const [search] = build({ hydrateIneligibleTypes: ["usTnLSU"] });

    expect(search.descriptor["filter_by"]).not.toContain("isEligible");
    expect(search.descriptor["filter_by"]).toContain("opportunityType:=");
  });

  test("does not facet — the census counts these same records", () => {
    // Two producers for one number is how they drift. This search fetches the
    // rendered documents and nothing else.
    const [search] = build();

    expect(search.descriptor["facet_by"]).toBeUndefined();
  });

  test("allowlists both joined projections and never uses (*)", () => {
    const [search] = build();
    const include = search.descriptor["include_fields"] as string;

    expect(include).toContain("$clients(personName.givenNames");
    expect(include).toContain("$opportunityUpdates(updateStatus");
    // `*` alone is the parent's own fields. `$x(*)` would project a joined
    // collection wholesale, and the child passes through no key of its own.
    expect(include).not.toMatch(/\$\w+\(\*\)/);
  });

  test("routes each type to the one collection its people live in", () => {
    const plan = build({
      opportunityTypes: [
        { type: "a", system: "SUPERVISION" },
        { type: "b", system: "INCARCERATION" },
      ],
    });

    const byType = Object.fromEntries(
      plan
        .filter((p) => p.kind === "eligibility")
        .map((p) => [p.opportunityType, p.personCollection]),
    );

    expect(byType).toEqual({ a: "clients", b: "residents" });
  });

  test("emits one search per type, not one per type per collection", () => {
    // The naive `2N` fan-out returns nothing for half of them — a supervision
    // opportunity leaves `residentDocId` dangling — and 20 types would put 40
    // searches against Typesense's cap of 50.
    const plan = build({
      opportunityTypes: [
        { type: "a", system: "SUPERVISION" },
        { type: "b", system: "SUPERVISION" },
        { type: "c", system: "INCARCERATION" },
      ],
    });

    expect(plan.filter((p) => p.kind === "eligibility")).toHaveLength(3);
    // Both collections are reached, so both need an acted-on search.
    expect(plan.filter((p) => p.kind === "actedOn")).toHaveLength(2);
  });

  test("pays for only one acted-on search when one system is in play", () => {
    const plan = build({
      opportunityTypes: [
        { type: "a", system: "SUPERVISION" },
        { type: "b", system: "SUPERVISION" },
      ],
    });

    expect(plan.filter((p) => p.kind === "actedOn")).toHaveLength(1);
    expect(plan.at(-1)?.personCollection).toBe("clients");
  });
});

describe("the ACTED ON shape", () => {
  test("filters on hasOfficerAction, not on updateStatus", () => {
    const search = build().find((p) => p.kind === "actedOn");

    // `updateStatus` covers the approval flow only, so a snooze, a completion
    // and a stale action all yield NONE while still moving a record out of the
    // eligible tab. Filtering on status undercounts silently.
    expect(search?.descriptor["filter_by"]).toContain(
      "$opportunityUpdates(hasOfficerAction:=true)",
    );
    expect(search?.descriptor["filter_by"]).not.toContain("updateStatus");
  });

  test("projects the whole overlay, not updateStatus alone", () => {
    const search = build().find((p) => p.kind === "actedOn");
    const include = search?.descriptor["include_fields"] as string;

    // A snoozed record arrives with `updateStatus: NONE`, so the snooze fields
    // are the only thing that can place it.
    for (const field of ["manualSnooze", "autoSnooze", "omsSnooze", "denial"]) {
      expect(include).toContain(field);
    }
  });

  test("requests a page big enough to subtract from", () => {
    const search = build().find((p) => p.kind === "actedOn");

    expect(search?.descriptor["per_page"]).toBe(ACTED_ON_PAGE_SIZE);
  });
});

describe("the STALE SEARCH shape", () => {
  const ALERTS = {
    alertThresholds: {
      usTnLSU: { eligibleNotViewedDays: 14, pendingOverdueDays: 14 },
    },
    today: new Date(2026, 8, 14),
  };

  test("emits nothing for a type with no threshold", () => {
    const kinds = build().map((p) => p.kind);

    expect(kinds).not.toContain("staleUnviewed");
    expect(kinds).not.toContain("pendingOverdue");
  });

  test("emits both stale branches and the overdue search", () => {
    const kinds = build(ALERTS).map((p) => p.kind);

    expect(kinds).toEqual([
      "eligibility",
      "staleUnviewed",
      "staleViewed",
      "pendingOverdue",
      "census",
      "actedOn",
    ]);
  });

  test("splits the coalesce across the two collections", () => {
    const plan = build(ALERTS);
    const unviewed = plan.find((p) => p.kind === "staleUnviewed");
    const viewed = plan.find((p) => p.kind === "staleViewed");

    // The negation reaches INSIDE the child — see staleSearches.
    expect(unviewed?.descriptor["filter_by"]).toContain(
      "!$opportunityUpdates(lastViewedTimestamp:>=0)",
    );
    expect(viewed?.descriptor["filter_by"]).toContain(
      "$opportunityUpdates(lastViewedTimestamp:>=0)",
    );
  });

  test("excludes a record anyone has acted on, from both branches", () => {
    // `isEligibleStaleViewed` also requires the "Eligible Now" tab, and an
    // action moves the record off it. Filtering on eligibility alone counted
    // submitted records as stale — US_NE reported 3 where the caseload said 1.
    const plan = build(ALERTS);
    const unviewed = plan.find((p) => p.kind === "staleUnviewed");
    const viewed = plan.find((p) => p.kind === "staleViewed");

    for (const search of [unviewed, viewed]) {
      expect(search?.descriptor["filter_by"]).toContain(
        "!$opportunityUpdates(updateStatus:!=`NONE`)",
      );
    }
  });

  test("keeps a record that was only VIEWED", () => {
    // The clause reads `updateStatus`, not the overlay's existence. Viewing
    // writes an overlay reading NONE, and viewing is what the alert measures —
    // excluding those would empty the alert entirely.
    const viewed = build(ALERTS).find((p) => p.kind === "staleViewed");

    expect(viewed?.descriptor["filter_by"]).not.toContain(
      "!$opportunityUpdates(lastViewedTimestamp:>=0)",
    );
  });

  test("uses :>=0, never :>0", () => {
    // They agree on today's data. `:>0` silently drops a genuine epoch-0
    // timestamp, and nothing else in the suite would notice.
    for (const filter of filtersOf(build(ALERTS))) {
      expect(filter).not.toContain(":>0");
    }
  });

  test("carries the join for every joined facet", () => {
    // A joined facet with no matching join in filter_by returns EMPTY with no
    // error — the failure mode that reads as "no alerts" rather than as a bug.
    for (const search of build(ALERTS)) {
      const facet = search.descriptor["facet_by"] as string | undefined;
      const joined = facet?.match(/^\$(\w+)\(/)?.[1];
      if (joined) {
        expect(search.descriptor["filter_by"]).toContain(`$${joined}(`);
      }
    }
  });

  test("counts overdue by status, not by the presence of `submitted`", () => {
    const overdue = build(ALERTS).find((p) => p.kind === "pendingOverdue");

    // A stray `submitted` outlives a denial on most types.
    // `submittedDateTimestamp` is gated on the status, so this keeps them
    // in agreement.
    expect(overdue?.descriptor["filter_by"]).toContain(
      "$opportunityUpdates(updateStatus:=`SUBMITTED`)",
    );
  });

  test("asks for counts only, never documents", () => {
    for (const search of build(ALERTS)) {
      if (search.kind.startsWith("stale") || search.kind === "pendingOverdue") {
        expect(search.descriptor["per_page"]).toBe(0);
      }
    }
  });
});

describe("the CENSUS shape", () => {
  function census(overrides: Partial<OpportunitySearchPlanInput> = {}) {
    return build(overrides).filter((p) => p.kind === "census");
  }

  test("is ONE search per collection, not one per type", () => {
    // Per type it would make the plan 2N+1 and crowd Typesense's cap of 50.
    const searches = census({
      opportunityTypes: [
        { type: "usTnLSU", system: "SUPERVISION" },
        { type: "usTnExpiration", system: "SUPERVISION" },
        { type: "usNeGoodTime", system: "INCARCERATION" },
      ],
    });

    expect(searches.map((p) => p.personCollection)).toEqual([
      "clients",
      "residents",
    ]);
  });

  test("groups on every field that decides an untouched tab", () => {
    // Grouping rather than faceting is the point: several overrides read
    // eligibility AND a discriminator together, which separate facets cannot
    // pair.
    const [search] = census();

    expect(search.descriptor["group_by"]).toBe(
      "opportunityType,isEligible,isAlmostEligible,tabName,tabDescription,hasGrantedDate",
    );
  });

  test("asks for exactly one exemplar per bucket", () => {
    // One real document is all `tabTitle()` needs to name the whole bucket.
    const [search] = census();

    expect(search.descriptor["group_limit"]).toBe(1);
    expect(search.descriptor["per_page"]).toBe(CENSUS_MAX_GROUPS);
  });

  test("never projects the officer overlay", () => {
    // THE mechanism. An exemplar built with no overlay has no denial and no
    // submission, so `tabTitle()` returns the tab an UNTOUCHED record lands
    // on — which is what the count it labels represents.
    const [search] = census();
    const include = search.descriptor["include_fields"] as string;

    expect(include).not.toContain("opportunityUpdates");
    expect(include).toContain("$clients(personName.givenNames");
    expect(include).not.toMatch(/\$\w+\(\*\)/);
  });

  test("keeps the person join out of the eligibility OR", () => {
    // Same defect the ELIGIBILITY shape works around: a join inside a top-level
    // the scoped key's own join clause.
    const [search] = census();
    const filter = search.descriptor["filter_by"] as string;

    expect(filter).toBe(
      "$clients(officerId:=[`OFFICER_1`]) && ( isEligible:=true || isAlmostEligible:=true )",
    );
  });

  test("widens for a hydrate-ineligible type, which has no eligibility flag", () => {
    const [search] = census({
      opportunityTypes: [{ type: "usNeGoodTime", system: "INCARCERATION" }],
      hydrateIneligibleTypes: ["usNeGoodTime"],
    });

    expect(search.descriptor["filter_by"]).toContain(
      "|| opportunityType:=[`usNeGoodTime`]",
    );
  });

  test("does NOT widen one collection for the other's type", () => {
    // A supervision type named in the residents census widens it for records
    // that census can never return.
    const [clients, residents] = census({
      opportunityTypes: [
        { type: "usTnLSU", system: "SUPERVISION" },
        { type: "usNeGoodTime", system: "INCARCERATION" },
      ],
      hydrateIneligibleTypes: ["usTnLSU"],
    });

    expect(clients.descriptor["filter_by"]).toContain("usTnLSU");
    expect(residents.descriptor["filter_by"]).not.toContain("usTnLSU");
  });
});
