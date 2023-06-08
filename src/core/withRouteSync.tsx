// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import { action } from "mobx";
import { observer } from "mobx-react-lite";
import React, { ComponentType, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQueryParams } from "use-query-params";

import { decrypt } from "../utils";
import {
  filterQueryParams,
  metricQueryParams,
  removeUndefinedValuesFromObject,
} from "../utils/navigation";
import { useCoreStore } from "./CoreStoreProvider";
import { TenantId } from "./models/types";
import { DEFAULT_ENTITY_ID, METRIC_TYPES } from "./PageVitals/types";
import { PopulationFilterLabels } from "./types/filters";
import { convertLabelsToValues } from "./utils/filterOptions";
import {
  DASHBOARD_VIEWS,
  getDefaultPathwaysSectionByPage,
  PathwaysPage,
  PathwaysSection,
} from "./views";

type RouteParams = {
  sectionId?: string;
  entityId?: string;
  pageId?: string;
};

type NormalizedParams = {
  sectionId: PathwaysSection;
  entityId: string;
};

const normalizeRouteParams = (
  rawParams: RouteParams,
  currentTenantId?: TenantId
): NormalizedParams => {
  const {
    entityId: rawEntityId,
    sectionId: rawSectionId,
    pageId: rawPageId,
  } = rawParams;
  const entityId =
    !rawEntityId || rawEntityId === "STATE_DOC"
      ? rawEntityId
      : decrypt(rawEntityId);
  const sectionId = rawSectionId as PathwaysSection;
  const pageId = rawPageId as PathwaysPage;
  return {
    entityId: entityId || DEFAULT_ENTITY_ID,
    sectionId: sectionId || (pageId && getDefaultPathwaysSectionByPage(pageId)),
  };
};

/**
 * A high-order component responsible for syncing relevant route parameters
 * to the appropriate store, so it can react to navigation.
 * Passes all props through `RouteComponent`, with route parameters normalized.
 */
const withRouteSync = <Props extends RouteParams>(
  RouteComponent: ComponentType<Props>
): ComponentType<Props> => {
  const WrappedRouteComponent: React.FC<Props> = (props) => {
    const { pathname } = useLocation();
    const {
      vitalsStore,
      setPage,
      setSection,
      filtersStore,
      metricsStore,
      currentTenantId,
    } = useCoreStore();

    // prepare URI params to sync with store
    const [viewId, pageId] = pathname.split("/").slice(1, 3);
    const { entityId, sectionId } = normalizeRouteParams(
      useParams(),
      currentTenantId
    );

    // prepare query params to sync with store
    const queryParams =
      viewId === DASHBOARD_VIEWS.operations
        ? metricQueryParams
        : filterQueryParams;
    const [query, setQuery] = useQueryParams(queryParams);
    const cleanQuery = removeUndefinedValuesFromObject(query);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(
      action("sync route params to store on initial load", () => {
        vitalsStore.setCurrentEntityId(entityId);
        setSection(sectionId);
        setPage(pageId as PathwaysPage);

        if (viewId === DASHBOARD_VIEWS.operations) {
          const metricId =
            vitalsStore.metrics.find((m) => {
              return m.name === cleanQuery.selectedMetric;
            })?.id || METRIC_TYPES.OVERALL;
          vitalsStore.setSelectedMetricId(metricId);
        } else {
          filtersStore.setFilters(
            convertLabelsToValues(
              cleanQuery as PopulationFilterLabels,
              filtersStore.filterOptions
            )
          );
        }
      }),
      []
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(
      action("sync params from store to query params", () => {
        vitalsStore.setCurrentEntityId(entityId);
        setSection(sectionId);
        setPage(pageId as PathwaysPage);
        if (viewId === DASHBOARD_VIEWS.operations) {
          const metricName =
            vitalsStore.metrics.find((m) => {
              return m.id === vitalsStore.selectedMetricId;
            })?.name || "Overall";
          setQuery({ selectedMetric: metricName });
        } else {
          const { current: metric } = metricsStore;
          if (metric) {
            const updatedQuery = [
              ...metric.filters.enabledFilters,
              ...(metric.filters.enabledMoreFilters || []),
            ].reduce(
              (acc, filter) => ({
                ...acc,
                // @ts-ignore
                [filter]: filtersStore.filtersLabels[filter],
              }),
              {}
            );
            setQuery(updatedQuery);
          }
        }
      }),
      [
        entityId,
        filtersStore.filtersLabels,
        pageId,
        sectionId,
        vitalsStore.selectedMetricId,
      ]
    );

    return <RouteComponent {...props} />;
  };

  return observer(WrappedRouteComponent);
};

export default withRouteSync;
