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
import { makeAutoObservable, reaction } from "mobx";

import {
  createScopedTypesenseClient,
  type ScopedTypesenseClient,
} from "~@typesense/client";
import { SystemId } from "~datatypes";
import { pluralizeWord } from "~utils";

import {
  collectionsBySearchType,
  locationIdsBySearchType,
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
      mintEndpoint: `${import.meta.env.VITE_API_URL}/workflows/typesense-scoped-key`,
      getMintRequestBody: () => ({
        currentTenantId: this.workflowsStore.rootStore.currentTenantId,
        system: this.workflowsStore.activeSystem,
      }),
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
  }

  private get workflowsStore(): WorkflowsStore {
    return this.searchStore.workflowsStore;
  }

  setSearchInput(value: string): void {
    this.searchInput = value;
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
