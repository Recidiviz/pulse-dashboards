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

// Builds the `multi_search` plan the Workflows homepage issues, as pure data,
// so these filter strings can be asserted without a store or a network.
//
// The homepage never fetches the full set. Counts come from facets; only the
// documents it renders are fetched.

import { startOfToday } from "date-fns";

import { quote, quoteList } from "~@typesense/client";
import { SystemId } from "~datatypes";

import { staleRangeFacet } from "./staleCutoff";

export type PersonCollection = "clients" | "residents";

export type OpportunitySearchKind =
  | "eligibility"
  | "census"
  | "actedOn"
  | "staleUnviewed"
  | "staleViewed"
  | "pendingOverdue";

export type PlannedOpportunitySearch = {
  descriptor: Record<string, unknown>;
  kind: OpportunitySearchKind;
  personCollection: PersonCollection;
  opportunityType?: string;
};

/** An opportunity belongs to exactly one system, never both. */
export type OpportunitySystem = Exclude<SystemId, "ALL">;

export type PlannedOpportunityType = {
  type: string;
  system: OpportunitySystem;
};

/**
 * Which person collection holds the people a system's opportunities belong to.
 * A supervision opportunity leaves `residentDocId` dangling, so `$residents(...)`
 * against it matches nothing — not sometimes, ever.
 */
const PERSON_COLLECTION: Record<OpportunitySystem, PersonCollection> = {
  SUPERVISION: "clients",
  INCARCERATION: "residents",
};

export type OpportunitySearchPlanInput = {
  /**
   * One entry per search config, each a Firestore field path. They are OR'd
   * INSIDE the join, which is safe — the rule is about a join inside an OR, not
   * an OR inside a join.
   */
  searchFieldPaths: string[][];
  selectedSearchIds: string[];
  /** Active opportunity types with their system, in render order. */
  opportunityTypes: PlannedOpportunityType[];
  /**
   * Types whose config sets `hydrateIneligibleRecordsInOpportunityManager`.
   * Their search drops the eligibility clause rather than widening it.
   */
  hydrateIneligibleTypes?: readonly string[];
  /**
   * Alert thresholds in DAYS, per type. Code-only getters, absent from the API
   * config schema. Omitting a type costs two searches, not a wrong count.
   */
  alertThresholds?: Record<
    string,
    { eligibleNotViewedDays?: number; pendingOverdueDays?: number }
  >;
  /** Injected so a test can pin the cutoff. Defaults to local `startOfToday`. */
  today?: Date;
};

// Person identity for the few documents the page renders. Allowlisted, never
// `(*)`: this projection passes through no key of its own.
const CLIENT_FIELDS = [
  "personName.givenNames",
  "personName.surname",
  "preferredName",
  "displayId",
  "pseudonymizedId",
] as const;

// The officer-written overlay. Every field a tab branch reads, and nothing else.
const UPDATE_FIELDS = [
  "updateStatus",
  "denial",
  "manualSnooze",
  "autoSnooze",
  "omsSnooze",
  "submitted",
  "actionHistory",
  "lastViewed",
  "completed",
  "adjudicationStatus",
] as const;

/** Serves the <=4 avatars a type's card shows. */
const RENDERED_PER_TYPE = 5;

/**
 * The acted-on fetch is compared against a facet total, so an under-fetch
 * inflates the NONE buckets by exactly the number missed. The caller must read
 * `found` and paginate past this rather than truncate.
 */
export const ACTED_ON_PAGE_SIZE = 250;

/** Typesense defaults this to 10 and truncates the rest in silence. */
const MAX_FACET_VALUES = 50;

/**
 * Groups the census may return in one page. Typesense pages GROUPS by
 * `per_page` and reports the total in `found`, so an overflow is detectable
 * rather than silent.
 */
export const CENSUS_MAX_GROUPS = 250;

/**
 * The fields whose combination decides an untouched record's tab.
 *
 * TODO(OBT-53660): Derive tabTitleForBucket exclusions instead of listing
 */
const CENSUS_GROUP_BY = [
  "opportunityType",
  "isEligible",
  "isAlmostEligible",
  "tabName",
  "tabDescription",
  "hasGrantedDate",
] as const;

function selectionPredicate(
  searchFieldPaths: string[][],
  selectedSearchIds: string[],
): string {
  const ids = quoteList(selectedSearchIds);
  return searchFieldPaths
    .map((path) => `${path.join(".")}:=${ids}`)
    .join(" || ");
}

/**
 * ELIGIBILITY shape — one search per (type × person collection), for the DOCUMENTS the
 * page renders. It does not facet: the census counts these same records, and
 * two sources for one number is how they drift apart.
 */
function eligibilitySearch(
  opportunityType: string,
  personCollection: PersonCollection,
  selection: string,
  hydrateIneligible: boolean,
): PlannedOpportunitySearch {
  const clauses = [
    `$${personCollection}(${selection})`,
    `opportunityType:=${quote(opportunityType)}`,
  ];
  // A hydrate-ineligible type wants every record, so the clause is DROPPED
  // rather than widened with an OR — leaving no OR for a later edit to lift.
  if (!hydrateIneligible) {
    clauses.push("( isEligible:=true || isAlmostEligible:=true )");
  }

  clauses.push(`( $opportunityUpdates(id:*) || id:* )`);

  return {
    kind: "eligibility",
    opportunityType,
    personCollection,
    descriptor: {
      collection: "opportunities",
      q: "*",
      filter_by: clauses.join(" && "),
      include_fields: [
        `$${personCollection}(${CLIENT_FIELDS.join(",")})`,
        `$opportunityUpdates(${UPDATE_FIELDS.join(",")})`,
        "*",
      ].join(","),
      // No facets — see above.
      per_page: RENDERED_PER_TYPE,
    },
  };
}

/**
 * CENSUS shape — the tab census. ONE search per person collection, covering every
 * type at once.
 *
 * Returns each distinct bucket with its own count AND one real document from
 * it. The count is what the page renders; the document NAMES the bucket, since
 * the caller builds it into a real opportunity and asks `tabTitle()`. That
 * keeps the tab rules in the opportunity classes rather than in a query.
 *
 * The overlay is deliberately NOT projected, so `tabTitle()` returns the tab an
 * UNTOUCHED record lands on. Acted-on records are fetched separately.
 *
 * Grouping rather than faceting is what makes this work: three overrides read
 * eligibility AND `tabName` together, and separate facets give only marginals.
 */
function censusSearch(
  personCollection: PersonCollection,
  selection: string,
  hydrateIneligibleTypes: readonly string[],
): PlannedOpportunitySearch {
  // No join sits inside this OR, so it does not trip the scoped-key defect
  // that the nested form in the ELIGIBILITY shape works around.
  const eligibility = [
    "isEligible:=true",
    "isAlmostEligible:=true",
    ...(hydrateIneligibleTypes.length
      ? [`opportunityType:=${quoteList([...hydrateIneligibleTypes])}`]
      : []),
  ].join(" || ");

  return {
    kind: "census",
    personCollection,
    descriptor: {
      collection: "opportunities",
      q: "*",
      filter_by: [
        `$${personCollection}(${selection})`,
        `( ${eligibility} )`,
      ].join(" && "),
      include_fields: [
        `$${personCollection}(${CLIENT_FIELDS.join(",")})`,
        "*",
      ].join(","),
      group_by: CENSUS_GROUP_BY.join(","),
      group_limit: 1,
      per_page: CENSUS_MAX_GROUPS,
    },
  };
}

/**
 * ACTED ON shape — the records carrying an officer action, across all types. The
 * caller subtracts these from the census.
 *
 * `hasOfficerAction`, NOT `updateStatus:!=NONE`: a snooze, a completion and a
 * stale action all yield NONE while still moving a record out of the eligible
 * tab. The whole overlay is projected for the same reason.
 */
function actedOnSearch(
  personCollection: PersonCollection,
  selection: string,
): PlannedOpportunitySearch {
  return {
    kind: "actedOn",
    personCollection,
    descriptor: {
      collection: "opportunities",
      q: "*",
      filter_by: [
        `$${personCollection}(${selection})`,
        "$opportunityUpdates(hasOfficerAction:=true)",
      ].join(" && "),
      include_fields: [
        `$opportunityUpdates(${UPDATE_FIELDS.join(",")})`,
        "opportunityType",
        "isEligible",
        "isAlmostEligible",
        "externalId",
        "id",
      ].join(","),
      per_page: ACTED_ON_PAGE_SIZE,
    },
  };
}

/**
 * STALE SEARCH shape — the stale-alert count, as two searches that sum.
 *
 * The clock is `COALESCE(lastViewed, eligibilityDate)` and its halves live in
 * different collections, so no single facet expresses it. The negation reaches
 * INSIDE the child, treating "a child lacking the field" as "no child".
 *
 * `:>=0`, never `:>0`, which would drop a genuine epoch-0 value. A joined facet
 * needs its join in `filter_by` or it returns EMPTY with no error.
 */
function staleSearches(
  opportunityType: string,
  personCollection: PersonCollection,
  selection: string,
  thresholdDays: number,
  today: Date,
): PlannedOpportunitySearch[] {
  const base = [
    `$${personCollection}(${selection})`,
    `opportunityType:=${quote(opportunityType)}`,
    "isEligible:=true",
    // On `updateStatus`, not on the overlay existing: a record someone merely
    // VIEWED has an overlay reading NONE, and viewing is what the alert is
    // about. The negation reaches inside the child, so a record with no
    // overlay at all is kept.
    `!$opportunityUpdates(updateStatus:!=${quote("NONE")})`,
  ];
  const shared = {
    collection: "opportunities",
    q: "*",
    facet_strategy: "exhaustive",
    max_facet_values: MAX_FACET_VALUES,
    per_page: 0,
  };

  return [
    {
      kind: "staleUnviewed",
      opportunityType,
      personCollection,
      descriptor: {
        ...shared,
        filter_by: [
          ...base,
          "!$opportunityUpdates(lastViewedTimestamp:>=0)",
        ].join(" && "),
        facet_by: staleRangeFacet(
          "eligibleDateTimestamp",
          thresholdDays,
          today,
        ),
      },
    },
    {
      kind: "staleViewed",
      opportunityType,
      personCollection,
      descriptor: {
        ...shared,
        filter_by: [
          ...base,
          "$opportunityUpdates(lastViewedTimestamp:>=0)",
        ].join(" && "),
        facet_by: `$opportunityUpdates(${staleRangeFacet("lastViewedTimestamp", thresholdDays, today)})`,
      },
    },
  ];
}

/**
 * PENDING OVERDUE shape: submitted records whose submission has gone stale.
 *
 * Filtered to SUBMITTED rather than to the presence of `submitted`: a stray
 * `submitted` outlives a denial where `config.supportsSubmitted` is off.
 */
function pendingOverdueSearch(
  opportunityType: string,
  personCollection: PersonCollection,
  selection: string,
  thresholdDays: number,
  today: Date,
): PlannedOpportunitySearch {
  return {
    kind: "pendingOverdue",
    opportunityType,
    personCollection,
    descriptor: {
      collection: "opportunities",
      q: "*",
      filter_by: [
        `$${personCollection}(${selection})`,
        `opportunityType:=${quote(opportunityType)}`,
        "$opportunityUpdates(updateStatus:=`SUBMITTED`)",
      ].join(" && "),
      facet_by: `$opportunityUpdates(${staleRangeFacet("submittedDateTimestamp", thresholdDays, today)})`,
      facet_strategy: "exhaustive",
      max_facet_values: MAX_FACET_VALUES,
      per_page: 0,
    },
  };
}

/**
 * The homepage's `multi_search` plan. Empty when nothing is selected, rather
 * than a plan that matches everything.
 */
export function buildOpportunitySearchPlan(
  input: OpportunitySearchPlanInput,
): PlannedOpportunitySearch[] {
  const {
    searchFieldPaths,
    selectedSearchIds,
    opportunityTypes,
    hydrateIneligibleTypes = [],
    alertThresholds = {},
    today = startOfToday(),
  } = input;

  if (
    selectedSearchIds.length === 0 ||
    searchFieldPaths.length === 0 ||
    opportunityTypes.length === 0
  ) {
    return [];
  }

  const selection = selectionPredicate(searchFieldPaths, selectedSearchIds);
  const hydrateIneligible = new Set(hydrateIneligibleTypes);
  const plan: PlannedOpportunitySearch[] = [];

  for (const { type, system } of opportunityTypes) {
    const personCollection = PERSON_COLLECTION[system];
    plan.push(
      eligibilitySearch(
        type,
        personCollection,
        selection,
        hydrateIneligible.has(type),
      ),
    );

    const thresholds = alertThresholds[type];
    if (thresholds?.eligibleNotViewedDays !== undefined) {
      plan.push(
        ...staleSearches(
          type,
          personCollection,
          selection,
          thresholds.eligibleNotViewedDays,
          today,
        ),
      );
    }
    if (thresholds?.pendingOverdueDays !== undefined) {
      plan.push(
        pendingOverdueSearch(
          type,
          personCollection,
          selection,
          thresholds.pendingOverdueDays,
          today,
        ),
      );
    }
  }

  // One census and one acted-on search per collection the plan reaches. A
  // single-system request must not pay for a search that can only return
  // nothing.
  const reached = new Set(
    opportunityTypes.map(({ system }) => PERSON_COLLECTION[system]),
  );
  for (const personCollection of reached) {
    plan.push(
      censusSearch(
        personCollection,
        selection,
        // Only the types this collection actually reaches: naming a
        // supervision type in the residents census widens it for nothing.
        opportunityTypes
          .filter(
            ({ type, system }) =>
              PERSON_COLLECTION[system] === personCollection &&
              hydrateIneligible.has(type),
          )
          .map(({ type }) => type),
      ),
    );
    plan.push(actedOnSearch(personCollection, selection));
  }

  return plan;
}
