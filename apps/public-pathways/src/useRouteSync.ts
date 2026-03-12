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

import { reaction } from "mobx";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StringParam, useQueryParams } from "use-query-params";

import {
  convertLabelsToValues,
  DEFAULT_PATHWAYS_SECTION_BY_PAGE,
  FILTER_TYPES,
  PathwaysPage,
  PathwaysPageIdList,
  PathwaysSection,
  PopulationFilterLabels,
} from "~shared-pathways";

import { useRootStore } from "./components/StoreProvider";

const filterQueryParams = Object.values(FILTER_TYPES).reduce(
  (acc, filter) => ({ ...acc, [filter]: StringParam }),
  {} as Record<string, typeof StringParam>,
);

const sectionQueryParam = { sectionId: StringParam };

const allQueryParams = { ...sectionQueryParam, ...filterQueryParams };

/**
 * Bidirectional sync between URL (path + query params) and MobX stores.
 *
 * - On mount: reads pageId from route params and sectionId + filters from
 *   query params, then pushes them into the stores.
 * - On store changes: a MobX reaction updates query params to reflect the
 *   current store state, so the URL is always shareable.
 */
export function useRouteSync(): void {
  const { pageId: rawPageId } = useParams<{ pageId: string }>();
  const rootStore = useRootStore();
  const { filtersStore, metricsStore } = rootStore;
  const navigate = useNavigate();

  const [query, setQuery] = useQueryParams(allQueryParams);

  // --- URL → Store (runs once on mount / URL change) ---
  useEffect(() => {
    // Sync pageId from path
    const pageId =
      rawPageId && PathwaysPageIdList.includes(rawPageId)
        ? (rawPageId as PathwaysPage)
        : undefined;

    if (pageId) {
      rootStore.setPage(pageId);
    } else if (rawPageId) {
      // Invalid pageId in URL — redirect to default
      navigate("/prison", { replace: true });
      return;
    }

    // Sync sectionId from query param
    const sectionId = query.sectionId as PathwaysSection | undefined;
    if (sectionId) {
      rootStore.setSection(sectionId);
    } else if (pageId) {
      rootStore.setSection(
        DEFAULT_PATHWAYS_SECTION_BY_PAGE[pageId] as PathwaysSection,
      );
    }

    // Sync filters from query params
    const queryRecord = query as Record<string, string | null | undefined>;
    const filterLabels = Object.values(FILTER_TYPES).reduce(
      (acc, key) => {
        const val = queryRecord[key];
        if (val) acc[key] = val;
        return acc;
      },
      {} as Record<string, string>,
    );

    if (Object.keys(filterLabels).length > 0) {
      filtersStore.setFilters(
        convertLabelsToValues(
          filterLabels as PopulationFilterLabels,
          filtersStore.filterOptions,
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPageId]);

  // --- Store → URL (MobX reaction keeps URL in sync) ---
  useEffect(() => {
    const dispose = reaction(
      () => ({
        section: metricsStore.section,
        filtersLabels: filtersStore.filtersLabels,
      }),
      ({ section, filtersLabels }) => {
        const metric = metricsStore.current;
        if (!metric) return;

        const enabledFilters = [
          ...metric.filters.enabledFilters,
          ...(metric.filters.enabledMoreFilters ?? []),
        ];

        const updatedQuery: Record<string, string | undefined> = {
          sectionId: section,
        };

        for (const filter of enabledFilters) {
          updatedQuery[filter] = filtersLabels[filter];
        }

        setQuery(updatedQuery, "replaceIn");
      },
      { fireImmediately: true },
    );

    return dispose;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
