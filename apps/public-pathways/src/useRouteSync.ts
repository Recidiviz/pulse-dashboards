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
  DEFAULT_PATHWAYS_PAGE,
  DEFAULT_PATHWAYS_SECTION_BY_PAGE,
  FILTER_TYPES,
  PathwaysSection,
  PopulationFilterLabels,
} from "~shared-pathways";

import { useRootStore } from "./components/StoreProvider";
import {
  DASHBOARDS_WITH_EVENT_TYPE_SELECTOR,
  isPublicPathwaysDashboardPage,
} from "./datastores/dashboards";
import { DEFAULT_EVENT_TYPE, isEventType } from "./datastores/eventTypes";

const filterQueryParams = Object.values(FILTER_TYPES).reduce(
  (acc, filter) => ({ ...acc, [filter]: StringParam }),
  {} as Record<string, typeof StringParam>,
);

const sectionQueryParam = {
  sectionId: StringParam,
  eventType: StringParam,
};

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
      rawPageId && isPublicPathwaysDashboardPage(rawPageId)
        ? rawPageId
        : undefined;

    if (pageId) {
      rootStore.setPage(pageId);
    } else if (rawPageId) {
      // Either not a Pathways page at all, or one only the staff app serves —
      // redirect to default
      navigate(`/${DEFAULT_PATHWAYS_PAGE}`, { replace: true });
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

    // Sync eventType from query param. It only applies to the dashboards that
    // count more than one kind of event, so the rest always reset to default.
    const eventType = query.eventType;
    if (
      eventType &&
      isEventType(eventType) &&
      pageId &&
      DASHBOARDS_WITH_EVENT_TYPE_SELECTOR.includes(pageId)
    ) {
      rootStore.setEventType(eventType);
    } else if (pageId) {
      rootStore.setEventType(DEFAULT_EVENT_TYPE);
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
        page: rootStore.page,
        section: metricsStore.section,
        eventType: rootStore.eventType,
        filtersLabels: filtersStore.filtersLabels,
      }),
      ({ page, section, eventType, filtersLabels }) => {
        const metric = metricsStore.current;
        if (!metric) return;

        const enabledFilters = [
          ...metric.filters.enabledFilters,
          ...(metric.filters.enabledMoreFilters ?? []),
        ];

        const updatedQuery: Record<string, string | undefined> = {
          sectionId: section,
          eventType: DASHBOARDS_WITH_EVENT_TYPE_SELECTOR.includes(page)
            ? eventType
            : undefined,
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
