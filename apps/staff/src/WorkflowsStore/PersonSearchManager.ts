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

import * as Sentry from "@sentry/react";
import { debounce } from "lodash";
import { makeAutoObservable, observable, reaction, runInAction } from "mobx";

import {
  createScopedTypesenseClient,
  type ScopedTypesenseClient,
} from "~@typesense/client";

import { SearchStore } from "./SearchStore";
import { PersonSearchResult, PlannedPersonSearch } from "./types";
import { TypesenseSearchResult } from "./types";
import { WorkflowsStore } from "./WorkflowsStore";

// Owns the Typesense-backed nav-bar person (client/resident) search.
// Typeahead input is debounced and passed to Typesense via a scoped-key client.
export class PersonSearchManager {
  searchStore: SearchStore;

  searchInput = "";

  results: PersonSearchResult[] = [];

  searchPending = false;

  typesenseClient: ScopedTypesenseClient;

  // bumped on every search() call to avoid race conditions
  private currentSearchToken = 0;

  // Caches composed PersonSearchResults across searches, keyed by
  // pseudonymizedId. A hit is served as-is without checking whether the
  // person's underlying data has changed. Person name and ID will be fresh
  // because of daily ETL, and`preferredName` staleness is an acceptable tradeoff.
  private resultsCache = new Map<string, PersonSearchResult>();

  private debouncedSearch = debounce((query: string) => {
    void this.search(query);
  }, 200);

  constructor(searchStore: SearchStore) {
    this.searchStore = searchStore;

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

    makeAutoObservable<
      this,
      "debouncedSearch" | "currentSearchToken" | "resultsCache"
    >(
      this,
      {
        typesenseClient: false,
        debouncedSearch: false,
        currentSearchToken: false,
        resultsCache: false,
        // Elements are plain, immutable PersonSearchResults reused from
        // resultsCache; shallow keeps their identity
        results: observable.shallow,
      },
      { autoBind: true },
    );

    // On every tenant/system change: invalidate the cached scoped Typesense
    // key and the composed-results cache (keyed by pseudonymizedId, which is
    // only unique within a tenant).
    reaction(
      () => [
        this.workflowsStore.activeSystem,
        this.workflowsStore.rootStore.currentTenantId,
      ],
      () => {
        this.typesenseClient.reset();
        this.resultsCache.clear();
      },
    );
  }

  private get workflowsStore(): WorkflowsStore {
    return this.searchStore.workflowsStore;
  }

  setSearchInput(value: string): void {
    this.searchInput = value;
  }

  // Called by the search bar on every input change (no-ops on empty input)
  handleSearchInput(query: string): void {
    if (!query) return;
    this.setSearchInput(query);
    this.debouncedSearch(query);
  }

  /**
   * Runs a Typesense `multi_search` against the clients + residents
   * collections (plus, for unrestricted callers, clientUpdatesV2 for a
   * preferredName cross-reference) and exposes the results for the nav-bar
   * person search to render.
   */
  async search(query: string): Promise<void> {
    const token = ++this.currentSearchToken;
    const isCurrent = () => this.currentSearchToken === token;

    this.setSearchInput(query);
    this.searchPending = true;

    try {
      const q = query.trim();
      const stateCode = this.workflowsStore.rootStore.currentTenantId;

      if (!q || !stateCode) {
        if (isCurrent()) this.results = [];
        return;
      }

      const plan = buildPersonSearchPlan(
        q,
        stateCode,
        this.workflowsStore.rootStore.userStore.isRecidivizUser,
      );

      const response = await this.typesenseClient.multiSearch({
        searches: plan.map((p) => p.descriptor),
      });

      if (!isCurrent()) return;

      runInAction(() => {
        this.results = composePersonSearchResults(
          response.results,
          plan,
          this.resultsCache,
        );
      });
    } catch (err) {
      console.error("Typesense person search failed:", err);
      Sentry.captureException(err);
      if (isCurrent()) runInAction(() => (this.results = []));
    } finally {
      if (isCurrent()) runInAction(() => (this.searchPending = false));
    }
  }
}

// Builds the Typesense multi_search plan for a person-name query.
export function buildPersonSearchPlan(
  q: string,
  stateCode: string,
  includeClientUpdates: boolean,
): PlannedPersonSearch[] {
  const sharedSearchParams = {
    infix: "always" as const,
    num_typos: 2,
    filter_by: `stateCode:=\`${stateCode}\``,
  };

  const plan: PlannedPersonSearch[] = [
    {
      descriptor: {
        collection: "clients",
        q,
        query_by: "personName.givenNames,personName.surname,personExternalId",
        ...sharedSearchParams,
      },
      collection: "clients",
    },
    {
      descriptor: {
        collection: "residents",
        q,
        query_by: "personName.givenNames,personName.surname,personExternalId",
        ...sharedSearchParams,
      },
      collection: "residents",
    },
  ];

  // Add clientUpdatesV2 to the plan (for preferredName)
  // TODO (#OBT-42690) Make second request, extend to restricted users
  if (includeClientUpdates) {
    plan.push({
      descriptor: {
        collection: "clientUpdatesV2",
        q,
        query_by: "preferredName",
        ...sharedSearchParams,
      },
      collection: "clientUpdatesV2",
    });
  }

  return plan;
}

// Consumes the multi_search response results (parallel to `plan`) and
// composes them into PersonSearchResult[]. When `cache` is given, a hit's
// prior result is reused as-is (by pseudonymizedId) rather than rebuilt —
// accepting staleness in exchange for skipping the rebuild and giving
// observers a stable object identity across searches.
export function composePersonSearchResults(
  results: TypesenseSearchResult[],
  plan: PlannedPersonSearch[],
  cache?: Map<string, PersonSearchResult>,
): PersonSearchResult[] {
  // compose the `clientUpdatesV2` results into a map of preferredName by id
  const clientUpdatesIndex = plan.findIndex(
    (p) => p.collection === "clientUpdatesV2",
  );
  const preferredNameById = new Map<string, string>();
  results[clientUpdatesIndex]?.hits?.forEach((h) => {
    const { id, preferredName } = h.document;
    if (typeof id === "string" && typeof preferredName === "string") {
      preferredNameById.set(id, preferredName);
    }
  });

  // compose the `clients` and `residents` results
  const personResults: PersonSearchResult[] = [];
  results.forEach((r, i) => {
    const p = plan[i];
    if (p.collection === "clientUpdatesV2") return;
    const personType = p.collection === "clients" ? "CLIENT" : "RESIDENT";

    r.hits?.forEach((h) => {
      const doc = h.document;
      const pseudonymizedId = doc.pseudonymizedId as string;

      const cached = cache?.get(pseudonymizedId);
      if (cached) {
        personResults.push(cached);
        return;
      }

      const id = doc.id;
      const built: PersonSearchResult = {
        personType,
        personExternalId: doc.personExternalId as string,
        pseudonymizedId,
        givenNames: (doc.personName as { givenNames?: string } | undefined)
          ?.givenNames,
        surname: (doc.personName as { surname?: string } | undefined)?.surname,
        preferredName:
          typeof id === "string" ? preferredNameById.get(id) : undefined,
      };
      cache?.set(pseudonymizedId, built);
      personResults.push(built);
    });
  });

  return personResults;
}
