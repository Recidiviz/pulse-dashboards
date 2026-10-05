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

// Runs the homepage's opportunity searches and exposes what they returned.
//
// Sibling of PersonSearchManager, deliberately the same shape: owns a scoped
// client, re-mints on a tenant or system change, and guards races with a search
// token. The query construction and the arithmetic live in pure modules.

import * as Sentry from "@sentry/react";
import {
  comparer,
  makeAutoObservable,
  observable,
  reaction,
  runInAction,
} from "mobx";

import {
  createScopedTypesenseClient,
  type ScopedTypesenseClient,
} from "~@typesense/client";
import type { OpportunityType } from "~datatypes";
import type { Hydratable, HydrationState } from "~hydration-utils";

import type { SearchStore } from "../SearchStore";
import type { WorkflowsStore } from "../WorkflowsStore";
import {
  ACTED_ON_PAGE_SIZE,
  buildOpportunitySearchPlan,
  CENSUS_MAX_GROUPS,
  type OpportunitySystem,
  type PlannedOpportunitySearch,
} from "./buildOpportunitySearchPlan";
import {
  personShellFromHit,
  type PersonWithOpportunities,
  recordIdOf,
} from "./personShells";
import {
  type ActedOnTab,
  type CensusBucket,
  reconstructTabCounts,
  type TabCounts,
} from "./reconstructTabCounts";
import { type BucketKey, tabTitleForBucket } from "./tabTitleForBucket";

/** A document the page will render, with its joined person and overlay. */
export type FetchedOpportunity = Record<string, unknown>;

/**
 * The two `OutstandingItemsAlerts` rows, per opportunity type.
 *
 * Counts of records the page never fetches, so range facets rather than a
 * filter over a list. Only types whose config sets a threshold appear.
 */
export type OpportunityAlertCounts = {
  /** Eligible, viewed or not, past the `eligibleNotViewedDays` threshold. */
  eligibleStale: number;
  /** Submitted for longer than the `pendingOverdueDays` threshold. */
  pendingOverdue: number;
};

type TypesenseResult = {
  found?: number;
  hits?: Array<{ document: Record<string, unknown> }>;
  /** Present only on a grouped search. `found` then counts GROUPS, not docs. */
  grouped_hits?: Array<{
    group_key: unknown[];
    found?: number;
    hits: Array<{ document: Record<string, unknown> }>;
  }>;
  facet_counts?: Array<{
    field_name: string;
    counts: Array<{ value: string; count: number }>;
  }>;
  error?: string;
};

const SYSTEMS: OpportunitySystem[] = ["SUPERVISION", "INCARCERATION"];

/**
 * Typesense caps a `multi_search` at 50 and reports overflow as an opaque
 * server error, so warn well before it.
 */
const SEARCH_COUNT_WARN_THRESHOLD = 40;

/**
 * The count in a range facet's `stale` bucket. The name is an agreement with
 * `staleRangeFacet`: a rename there returns zero here, with no error.
 */
function staleBucketCount(result: TypesenseResult): number {
  for (const facet of result.facet_counts ?? []) {
    const bucket = facet.counts.find((c) => c.value === "stale");
    if (bucket) return bucket.count;
  }
  return 0;
}

export class OpportunitySearchManager implements Hydratable {
  /** Per opportunity type, the count for each tab that has one. */
  countsByType: Record<string, TabCounts> = {};

  /**
   * Types whose counts did not reconcile, so the page must say so rather than
   * render a number.
   */
  unreconstructableTypes: string[] = [];

  /** The two alert rows per type, for the types that configure a threshold. */
  alertsByType: Record<string, OpportunityAlertCounts> = {};

  records: FetchedOpportunity[] = [];

  searchPending = false;

  /** Set when a search failed, so the caller can fall back rather than render zeros. */
  lastError: string | undefined = undefined;

  /**
   * Whether a search has been asked for yet.
   */
  private hydrationStarted = false;

  typesenseClient: ScopedTypesenseClient;

  private currentSearchToken = 0;

  constructor(private readonly searchStore: SearchStore) {
    this.typesenseClient = createScopedTypesenseClient({
      mintEndpoint: () =>
        `${import.meta.env.VITE_API_URL}/api/${this.workflowsStore.rootStore.currentTenantId}/workflows/person-scoped-key`,
      getMintRequestBody: () => ({
        system: this.workflowsStore.activeSystem,
      }),
      getAuthHeader: async () => {
        const getToken = this.workflowsStore.rootStore.userStore.getToken;
        if (!getToken) return null;
        const token = await getToken();
        return token ? `Bearer ${token}` : null;
      },
    });

    makeAutoObservable<this, "currentSearchToken">(
      this,
      {
        typesenseClient: false,
        currentSearchToken: false,
        records: observable.shallow,
      },
      { autoBind: true },
    );

    // Reacts to CHANGES only — the homepage presenter's `hydrate()` kicks the
    // first search, once the page asks rather than during store construction.
    //
    // Ordering matters: reset MUST come before the search, so the search mints
    // a fresh key rather than reusing the stale one.
    reaction(
      () => [
        this.workflowsStore.activeSystem,
        this.workflowsStore.rootStore.currentTenantId,
        // A primitive: `selectedSearchIds` is derived, so a recomputation
        // yields an identical-but-new array that reads as a change.
        this.searchStore.selectedSearchIds.join(","),
      ],
      () => {
        this.typesenseClient.reset();
        void this.search();
      },
      { equals: comparer.shallow },
    );
  }

  private get workflowsStore(): WorkflowsStore {
    return this.searchStore.workflowsStore;
  }

  /**
   * Derived from the fields the search already maintains, so there is one
   * source of truth rather than a status field to keep in step.
   */
  get hydrationState(): HydrationState {
    if (this.lastError)
      return { status: "failed", error: new Error(this.lastError) };
    if (this.searchPending) return { status: "loading" };
    if (!this.hydrationStarted) return { status: "needs hydration" };
    return { status: "hydrated" };
  }

  hydrate(): void {
    void this.search();
  }

  /**
   * Built per system because the search fields differ between them, and
   * because a cross-system request needs one acted-on search per system.
   */
  get plan(): PlannedOpportunitySearch[] {
    const { selectedSearchIds } = this.searchStore;
    if (selectedSearchIds.length === 0) return [];

    const configs =
      this.workflowsStore.opportunityConfigurationStore.opportunities;

    return SYSTEMS.flatMap((system) => {
      const types = this.workflowsStore.opportunityTypes.filter(
        (type) => configs[type]?.systemType === system,
      );
      if (types.length === 0) return [];

      return buildOpportunitySearchPlan({
        searchFieldPaths: this.workflowsStore
          .systemConfigFor(system)
          .search.map((c) => c.searchField),
        selectedSearchIds,
        opportunityTypes: types.map((type) => ({ type, system })),
        hydrateIneligibleTypes: types.filter(
          (type) => configs[type]?.hydrateIneligibleRecordsInOpportunityManager,
        ),
        alertThresholds: Object.fromEntries(
          types.map((type) => [
            type,
            {
              eligibleNotViewedDays:
                configs[type]?.eligibleNotViewedDaysThreshold,
              pendingOverdueDays: configs[type]?.pendingOverdueDaysThreshold,
            },
          ]),
        ),
      });
    });
  }

  /**
   * The avatars each type's card shows, from the FETCHED documents only.
   *
   * Deduplicated by `recordId`: a person with two records of one type is one
   * face. The census supplies the total, so this list is deliberately short.
   */
  get peopleByType(): Record<string, PersonWithOpportunities[]> {
    const { rootStore } = this.workflowsStore;
    const byType: Record<string, PersonWithOpportunities[]> = {};
    const seen = new Set<string>();

    for (const record of this.records) {
      const type = record["opportunityType"];
      if (typeof type !== "string") continue;

      const recordId = recordIdOf(record);
      if (!recordId || seen.has(`${type}:${recordId}`)) continue;
      seen.add(`${type}:${recordId}`);

      const shell = personShellFromHit(
        record,
        [type as OpportunityType],
        rootStore,
      );
      if (!shell) continue;
      (byType[type] ??= []).push(shell);
    }

    return byType;
  }

  /** Issues the whole plan as one `multi_search` and stores what it returned. */
  async search(): Promise<void> {
    runInAction(() => {
      this.hydrationStarted = true;
      this.lastError = undefined;
    });

    // Gated HERE, not at the reaction: this manager is constructed for every
    // tenant, and only the flagged ones may reach Typesense.
    if (!this.searchStore.isTypesenseHomepageEnabled) return;

    const token = ++this.currentSearchToken;
    const isCurrent = () => this.currentSearchToken === token;

    const { plan } = this;
    if (plan.length === 0) {
      runInAction(() => {
        this.countsByType = {};
        this.unreconstructableTypes = [];
        this.alertsByType = {};
        this.records = [];
      });
      return;
    }

    if (plan.length > SEARCH_COUNT_WARN_THRESHOLD) {
      // A second round trip is a better failure mode than an opaque server
      // limit, so this is the signal to batch rather than to raise the cap.
      console.warn(
        `Opportunity search plan is ${plan.length} searches, approaching Typesense's cap of 50. Batch it.`,
      );
    }

    runInAction(() => {
      this.searchPending = true;
    });

    try {
      const response = await this.typesenseClient.multiSearch({
        searches: plan.map((p) => p.descriptor),
      });
      if (!isCurrent()) return;

      const results = response.results as unknown as TypesenseResult[];
      const rejected = results.find((r) => r.error);
      if (rejected)
        throw new Error(`Typesense rejected a search: ${rejected.error}`);

      const { counts, unreconstructable, alerts, records } = this.collect(
        plan,
        results,
      );
      runInAction(() => {
        this.countsByType = counts;
        this.unreconstructableTypes = unreconstructable;
        this.alertsByType = alerts;
        this.records = records;
      });
    } catch (err) {
      console.error("Opportunity search failed:", err);
      Sentry.captureException(err);
      if (isCurrent()) {
        runInAction(() => {
          // Cleared rather than left stale. A homepage showing the previous
          // selection's counts is worse than one showing none.
          this.countsByType = {};
          this.unreconstructableTypes = [];
          this.alertsByType = {};
          this.records = [];
          this.lastError = err instanceof Error ? err.message : String(err);
        });
      }
    } finally {
      if (isCurrent()) runInAction(() => (this.searchPending = false));
    }
  }

  /** The bucket key a document belongs to. */
  private static keyOf(
    document: Record<string, unknown>,
    opportunityType: string,
  ): BucketKey {
    const tabName = document["tabName"];
    const tabDescription = document["tabDescription"];
    return {
      opportunityType: opportunityType as OpportunityType,
      isEligible: document["isEligible"] === true,
      isAlmostEligible: document["isAlmostEligible"] === true,
      tabName: typeof tabName === "string" ? tabName : undefined,
      tabDescription:
        typeof tabDescription === "string" ? tabDescription : undefined,
      hasGrantedDate: document["hasGrantedDate"] === true,
    };
  }

  /**
   * Whether the census counted this record too. Mirrors the census filter
   * exactly: the ACTED ON shape carries no eligibility clause, so it returns
   * records the census never saw, and subtracting one goes below zero.
   */
  private inCensusScope(
    document: Record<string, unknown>,
    opportunityType: string,
  ): boolean {
    if (document["isEligible"] === true) return true;
    if (document["isAlmostEligible"] === true) return true;
    return Boolean(
      this.workflowsStore.opportunityConfigurationStore.opportunities[
        opportunityType as OpportunityType
      ]?.hydrateIneligibleRecordsInOpportunityManager,
    );
  }

  /** Pairs each result with the search that asked for it, then subtracts. */
  private collect(
    plan: PlannedOpportunitySearch[],
    results: TypesenseResult[],
  ): {
    counts: Record<string, TabCounts>;
    unreconstructable: string[];
    alerts: Record<string, OpportunityAlertCounts>;
    records: FetchedOpportunity[];
  } {
    const { rootStore } = this.workflowsStore;
    const buckets: CensusBucket[] = [];
    const actedOn: ActedOnTab[] = [];
    // Types with at least one bucket the classes could not name.
    const unlabelled = new Set<string>();
    const records: FetchedOpportunity[] = [];
    const alerts: Record<string, OpportunityAlertCounts> = {};

    plan.forEach((search, i) => {
      const result = results[i];
      if (!result) return;

      if (search.kind === "eligibility") {
        records.push(...(result.hits ?? []).map((h) => h.document));
      }

      // The STALE SEARCH shape's two alert rows. `staleUnviewed` and
      // two halves of one COALESCE that no single facet expresses, so they sum
      // rather than replace each other.
      if (search.opportunityType) {
        const type = search.opportunityType;
        const bump = (key: keyof OpportunityAlertCounts, by: number) => {
          alerts[type] ??= { eligibleStale: 0, pendingOverdue: 0 };
          alerts[type][key] += by;
        };
        if (search.kind === "staleUnviewed" || search.kind === "staleViewed") {
          bump("eligibleStale", staleBucketCount(result));
        }
        if (search.kind === "pendingOverdue") {
          bump("pendingOverdue", staleBucketCount(result));
        }
      }

      if (search.kind === "census") {
        const groups = result.grouped_hits ?? [];
        // On a grouped search `found` counts GROUPS, so this compares like with
        // like. An overflow drops whole buckets, which reads as a tab that
        // simply is not there rather than as an error.
        if ((result.found ?? 0) > groups.length) {
          throw new Error(
            `The tab census needs pagination: ${result.found} groups found, ${CENSUS_MAX_GROUPS} per page.`,
          );
        }

        for (const group of groups) {
          const exemplar = group.hits[0]?.document;
          const count = group.found ?? 0;
          if (!exemplar || count === 0) continue;

          const opportunityType = exemplar["opportunityType"];
          if (typeof opportunityType !== "string") continue;

          // Named by the REAL `tabTitle()`, with no overlay — so the answer is
          // the tab an untouched record of this bucket lands on.
          const untouchedTab = tabTitleForBucket(
            OpportunitySearchManager.keyOf(exemplar, opportunityType),
            rootStore,
          );
          // A class that cannot answer from the bucket key alone.
          if (!untouchedTab) {
            unlabelled.add(opportunityType);
            continue;
          }

          buckets.push({ opportunityType, untouchedTab, count });
        }
      }

      if (search.kind === "actedOn") {
        const hits = result.hits ?? [];
        // Checked HERE rather than after scoping: `found` counts the whole
        // acted-on set, and a missed record stays in the bucket it has left.
        if ((result.found ?? 0) > hits.length) {
          throw new Error(
            `The acted-on set needs pagination: ${result.found} found, ${ACTED_ON_PAGE_SIZE} per page.`,
          );
        }

        for (const hit of hits) {
          records.push(hit.document);

          const opportunityType = hit.document["opportunityType"];
          if (typeof opportunityType !== "string") continue;
          if (!this.inCensusScope(hit.document, opportunityType)) continue;

          const key = OpportunitySearchManager.keyOf(
            hit.document,
            opportunityType,
          );
          // Twice: where it belongs now, and the bucket the census counted it
          // in. Both from the same class, one with the overlay and one without.
          const tab = tabTitleForBucket(
            key,
            rootStore,
            hit.document["opportunityUpdates"],
          );
          const untouchedTab = tabTitleForBucket(key, rootStore);
          if (!tab || !untouchedTab) {
            unlabelled.add(opportunityType);
            continue;
          }

          actedOn.push({ opportunityType, tab, untouchedTab });
        }
      }
    });

    const { countsByType, unreconstructable } = reconstructTabCounts({
      buckets,
      actedOn,
    });

    // A type with even one unnamed bucket has a PARTIAL histogram, and a
    // partial one is worse than none — it renders as a smaller caseload.
    for (const opportunityType of unlabelled) {
      delete countsByType[opportunityType];
    }

    return {
      counts: countsByType,
      unreconstructable: [
        ...new Set([...unreconstructable, ...unlabelled]),
      ].sort(),
      alerts,
      records,
    };
  }
}
