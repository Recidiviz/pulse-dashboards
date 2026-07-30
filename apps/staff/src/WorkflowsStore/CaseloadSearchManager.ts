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

import { debounce } from "lodash";
import { comparer, makeAutoObservable, reaction } from "mobx";

import {
  createScopedTypesenseClient,
  type ScopedTypesenseClient,
} from "~@typesense/client";
import { SystemId } from "~datatypes";
import { pluralizeWord } from "~utils";

import {
  collectionsBySearchType,
  locationIdsBySearchType,
  Searchable,
  SearchableGroup,
} from "../core/models/types";
import { Location } from "./Location";
import { Officer } from "./Officer";
import { SearchStore } from "./SearchStore";
import { PlannedTypesenseSearch, TypesenseSearchResult } from "./types";
import { WorkflowsStore } from "./WorkflowsStore";

// Owns the Typesense-backed caseload search: the scoped-key client lifecycle,
// the plan builder that turns the active tenant's SearchConfig into
// multi_search descriptors, the debounced typeahead entry point, and the
// resulting SearchableGroup[] the CaseloadSelect dropdown renders.
//
// SearchStore delegates its typesense-side surface (availableSearchables when
// the FV is on, handleSearchInput) to this manager. The parallel
// PersonSearchManager (for the nav-bar person search) is a separate class —
// the two share only enough machinery that we don't try to abstract it yet.
export class CaseloadSearchManager {
  searchStore: SearchStore;

  searchInput = "";

  results: SearchableGroup[] = [];

  // Accumulates every searchable this manager has ever returned, keyed by
  // searchId. The typeahead only ever holds the current query's page of
  // results (per_page: 20), so a selected item can drop out of `results` as
  // soon as the input clears and a fresh query reseeds them. Selected pills
  // are resolved against this cache instead so they persist regardless of what
  // the latest query returned. See resolveSelectedSearchables.
  searchableCache: Map<string, Searchable> = new Map();

  searchPending = false;

  // Scoped client owns the mint/cache lifecycle. Constructed once.
  // Marked non-observable so MobX doesn't try to track its internals.
  typesenseClient: ScopedTypesenseClient;

  private debouncedSearch = debounce((query: string) => {
    void this.search(query);
  }, 200);

  constructor(searchStore: SearchStore) {
    this.searchStore = searchStore;

    this.typesenseClient = createScopedTypesenseClient({
      mintEndpoint: () =>
        `${import.meta.env.VITE_API_URL}/api/${this.workflowsStore.rootStore.currentTenantId}/workflows/caseload-scoped-key`,
      getMintRequestBody: () => {
        const { rootStore } = this.workflowsStore;
        return {
          system: this.workflowsStore.activeSystem,
          ...(rootStore.isImpersonating
            ? { impersonatedEmail: rootStore.userStore.userEmail }
            : {}),
        };
      },
      getAuthHeader: async () => {
        const getToken = this.workflowsStore.rootStore.userStore.getToken;
        if (!getToken) return null;
        const token = await getToken();
        return token ? `Bearer ${token}` : null;
      },
    });

    // Second type parameter names private fields so MobX's annotations map
    // accepts them (see mobx docs on makeAutoObservable with private fields).
    makeAutoObservable<this, "debouncedSearch">(
      this,
      { typesenseClient: false, debouncedSearch: false },
      { autoBind: true },
    );

    // On every tenant/system change: invalidate the cached scoped Typesense
    // key (its filter_by is baked at mint time, so it'd return the wrong
    // scope after a switch) and seed the dropdown with an empty-query fetch
    // so it has something to show before the user types.
    //
    // Ordering matters: reset MUST fire before the seed search so the search
    // mints a fresh key rather than reusing the stale one — done here
    // explicitly by putting both effects in one reaction. reset() is a no-op
    // on the initial fireImmediately since the cache starts empty.
    reaction(
      () => [
        this.workflowsStore.activeSystem,
        this.workflowsStore.rootStore.currentTenantId,
      ],
      ([activeSystem, tenantId]) => {
        this.typesenseClient.reset();
        if (
          this.searchStore.isTypesenseSearchEnabled &&
          activeSystem &&
          tenantId
        ) {
          void this.search("");
        }
      },
      { fireImmediately: true },
    );

    // Backfill the searchable cache for selections persisted from a prior
    // session so their value pills render on load
    reaction(
      () => this.searchStore.selectedSearchIds,
      (searchIds) => {
        if (this.searchStore.isTypesenseSearchEnabled && searchIds.length) {
          void this.warmSelectedSearchablesCache(searchIds);
        }
      },
      { fireImmediately: true, equals: comparer.shallow },
    );
  }

  private get workflowsStore(): WorkflowsStore {
    return this.searchStore.workflowsStore;
  }

  setSearchInput(value: string): void {
    this.searchInput = value;
  }

  // Resolves selected search ids to their Searchables for rendering value
  // pills. Backed by the accumulating cache rather than the current `results`
  // so a selected item's pill doesn't disappear once it drops out of the
  // latest query's page. Ids with no cached searchable are skipped;
  // warmSelectedSearchablesCache backfills them for selections persisted from
  // a prior session.
  resolveSelectedSearchables(searchIds: string[]): Searchable[] {
    return searchIds
      .map((searchId) => this.searchableCache.get(searchId))
      .filter((searchable): searchable is Searchable => Boolean(searchable));
  }

  // Backfills the cache for selected ids that haven't yet surfaced in a
  // typeahead query — e.g. selections persisted to Firestore from a prior
  // session whose items fall outside the seed query's first page. Fetches the
  // matching documents directly by id so their value pills render on load
  // rather than only after the user happens to search for them.
  async warmSelectedSearchablesCache(searchIds: string[]): Promise<void> {
    if (!this.searchStore.isTypesenseSearchEnabled) return;

    const missingIds = searchIds.filter((id) => !this.searchableCache.has(id));
    if (missingIds.length === 0) return;

    const stateCode = this.workflowsStore.rootStore.currentTenantId;
    const activeSystem = this.workflowsStore.activeSystem;
    if (!stateCode || !activeSystem) return;

    const plan = buildTypesenseSearchPlan(
      "*",
      stateCode,
      activeSystem,
      this.workflowsStore,
    );
    if (plan.length === 0) return;

    const idFieldByCollection = {
      locations: "locationId",
      supervisionStaff: "staffExternalId",
      incarcerationStaff: "staffExternalId",
    } as const;
    const idFilter = missingIds.map((id) => `\`${id}\``).join(",");

    const searches = plan.map((p) => ({
      ...p.descriptor,
      filter_by: `${p.descriptor.filter_by} && ${idFieldByCollection[p.collection]}:=[${idFilter}]`,
      // A single collection can hold every selection (capped at
      // SELECTED_SEARCH_LIMIT), so widen past the default per_page of 20.
      per_page: missingIds.length,
    }));

    try {
      const response = await this.typesenseClient.multiSearch({ searches });
      const groups = composeSearchableGroups(response.results, plan);
      for (const group of groups) {
        for (const searchable of group.searchables) {
          this.searchableCache.set(searchable.searchId, searchable);
        }
      }
    } catch (err) {
      console.error("Typesense selected-id cache warm-up failed:", err);
    }
  }

  // Called by the search bar on every input change. Stores the raw input for
  // any observers that care (e.g. shadow-mode diff logging) and debounces the
  // actual Typesense query.
  handleSearchInput(query: string): void {
    if (!this.searchStore.isTypesenseSearchEnabled) return;
    this.setSearchInput(query);
    this.debouncedSearch(query);
  }

  /**
   * Runs a Typesense `multi_search` against the searchTypes that are active
   * for the current tenant's search config and exposes the results for
   * the existing CaseloadSelect to render.
   *
   * Empty query string returns all docs (subject to the scoped key's filter).
   */
  async search(query: string): Promise<void> {
    this.setSearchInput(query);
    this.searchPending = true;

    try {
      const q = query.trim() || "*";
      const stateCode = this.workflowsStore.rootStore.currentTenantId;
      const activeSystem = this.workflowsStore.activeSystem;

      if (!stateCode || !activeSystem) {
        this.results = [];
        return;
      }

      const plan = buildTypesenseSearchPlan(
        q,
        stateCode,
        activeSystem,
        this.workflowsStore,
      );
      if (plan.length === 0) {
        this.results = [];
        return;
      }

      const response = await this.typesenseClient.multiSearch({
        searches: plan.map((p) => p.descriptor),
      });

      this.results = composeSearchableGroups(response.results, plan);
      for (const group of this.results) {
        for (const searchable of group.searchables) {
          this.searchableCache.set(searchable.searchId, searchable);
        }
      }
    } catch (err) {
      console.error("Typesense search failed:", err);
      this.results = [];
    } finally {
      this.searchPending = false;
    }
  }
}

// Builds the Typesense multi_search plan for the given tenant + active
// system, respecting each SearchConfig's `restrictedToFeatureVariant` gate
// and skipping searchTypes that aren't wired for Typesense (CASELOAD, ALL).
// Exported for testing.
export function buildTypesenseSearchPlan(
  q: string,
  stateCode: string,
  activeSystem: SystemId,
  workflowsStore: WorkflowsStore,
): PlannedTypesenseSearch[] {
  const sharedSearchParams = {
    infix: "always" as const,
    num_typos: 2,
    drop_tokens_threshold: 1,
    filter_by: `stateCode:=\`${stateCode}\``,
    per_page: 20,
  };

  const systemsToQuery: Array<Exclude<SystemId, "ALL">> =
    activeSystem === "ALL" ? ["SUPERVISION", "INCARCERATION"] : [activeSystem];

  const plan: PlannedTypesenseSearch[] = [];

  for (const system of systemsToQuery) {
    const systemConfig = workflowsStore.systemConfigFor(system);
    for (const sc of systemConfig.search) {
      if (
        sc.restrictedToFeatureVariant &&
        !workflowsStore.featureVariants[sc.restrictedToFeatureVariant]
      ) {
        continue;
      }

      const collection =
        collectionsBySearchType[
          sc.searchType as keyof typeof collectionsBySearchType
        ];
      if (!collection) continue;

      const groupLabel = pluralizeWord({
        term: sc.searchTitle,
        justAppendS: sc.searchTitleIgnoreCase,
      });

      if (collection === "locations") {
        const idType =
          locationIdsBySearchType[
            sc.searchType as keyof typeof locationIdsBySearchType
          ];
        if (!idType) continue;
        plan.push({
          descriptor: {
            collection: "locations",
            q,
            query_by: "name",
            ...sharedSearchParams,
            filter_by: `${sharedSearchParams.filter_by} && idType:=\`${idType}\``,
          },
          collection: "locations",
          groupLabel,
        });
      } else {
        plan.push({
          descriptor: {
            collection,
            q,
            query_by: "givenNames,surname,email",
            ...sharedSearchParams,
          },
          collection,
          groupLabel,
        });
      }
    }
  }

  return plan;
}

// Consumes the multi_search response results (parallel to `plan`) and
// composes them into SearchableGroup[]. Locations first — matching the
// Firestore path's ALL-mode ordering — then staff, each preserved in
// tenant-config order. Exported for testing.
export function composeSearchableGroups(
  results: TypesenseSearchResult[],
  plan: PlannedTypesenseSearch[],
): SearchableGroup[] {
  const locationGroups: SearchableGroup[] = [];
  const staffGroups: SearchableGroup[] = [];

  results.forEach((r, i) => {
    if (!r?.hits?.length) return;
    const p = plan[i];
    if (p.collection === "locations") {
      locationGroups.push({
        groupLabel: p.groupLabel,
        searchables: r.hits.map((h) => new Location(h.document as never)),
      });
    } else {
      const recordType = p.collection;
      staffGroups.push({
        groupLabel: p.groupLabel,
        searchables: r.hits.map(
          (h) => new Officer({ ...h.document, recordType } as never),
        ),
      });
    }
  });

  return [...locationGroups, ...staffGroups];
}
