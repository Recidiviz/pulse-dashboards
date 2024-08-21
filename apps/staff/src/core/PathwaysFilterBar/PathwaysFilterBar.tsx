// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import "./PathwaysFilterBar.scss";

import cn from "classnames";
import { pick } from "lodash/fp";
import { get } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";

import useIsMobile from "../../hooks/useIsMobile";
import useResizeFilterBar from "../../hooks/useResizeFilterBar";
import { sortByLabel } from "../../utils/datasets";
import { CoreSelect } from "../controls/CoreSelect";
import Filter from "../controls/Filter";
import FilterBar from "../controls/FilterBar";
import CoreMultiSelect from "../controls/MultiSelect/CoreMultiSelect";
import TogglePill from "../controls/TogglePill";
import { useCoreStore } from "../CoreStoreProvider";
import DetailsGroup from "../DetailsGroup";
import DownloadDataButton from "../DownloadDataButton";
import MethodologyLink from "../MethodologyLink";
import MoreFilters from "../MoreFilters";
import { EnabledFilters, PopulationFilters } from "../types/filters";
import { FILTER_TYPES } from "../utils/constants";
import { getFilterOptions, metricModeOptions } from "../utils/filterOptions";
import { DASHBOARD_PATHS } from "../views";

const PathwaysFilterBar: React.FC<{
  filterOptions: PopulationFilters;
  handleDownload: () => Promise<void>;
  chartTitle?: string;
  enabledFilters?: EnabledFilters;
  enableMetricModeToggle?: boolean;
}> = ({
  filterOptions,
  handleDownload,
  chartTitle,
  enabledFilters = [],
  enableMetricModeToggle,
}) => {
  const { filtersStore } = useCoreStore();
  const { filters } = filtersStore;

  const isMobile = useIsMobile();

  const filtersRef = React.useRef() as React.MutableRefObject<HTMLElement>;
  const containerRef = React.useRef() as React.MutableRefObject<HTMLElement>;

  const enabledFiltersDisplayCount = useResizeFilterBar(
    filtersRef,
    containerRef,
    enabledFilters,
    enableMetricModeToggle,
  );

  return (
    <div
      className={cn("PathwaysFilterBar", {
        "pt-5": !isMobile,
      })}
    >
      <FilterBar
        filtersRef={filtersRef}
        containerRef={containerRef}
        details={
          isMobile ? (
            <DetailsGroup>
              <MoreFilters
                enabledFilters={enabledFilters.slice(
                  enabledFiltersDisplayCount,
                )}
                filterOptions={pick(
                  enabledFilters.slice(enabledFiltersDisplayCount),
                  filterOptions,
                )}
              />
              <DownloadDataButton handleOnClick={handleDownload} />
              <MethodologyLink
                path={DASHBOARD_PATHS.methodologySystem}
                chartTitle={chartTitle}
              />
            </DetailsGroup>
          ) : (
            <div className="FilterBar__details">
              <MoreFilters
                enabledFilters={enabledFilters.slice(
                  enabledFiltersDisplayCount,
                )}
                filterOptions={pick(
                  enabledFilters.slice(enabledFiltersDisplayCount),
                  filterOptions,
                )}
              />
              <DetailsGroup>
                <DownloadDataButton handleOnClick={handleDownload} />
                <MethodologyLink
                  path={DASHBOARD_PATHS.methodologySystem}
                  chartTitle={chartTitle}
                />
              </DetailsGroup>
            </div>
          )
        }
      >
        {enableMetricModeToggle && (
          <TogglePill
            leftPill={metricModeOptions[0]}
            rightPill={metricModeOptions[1]}
            onChange={(metricMode: string) =>
              filtersStore.setMetricMode(metricMode)
            }
            currentValue={filtersStore.currentMetricMode}
          />
        )}
        {enabledFilters
          .slice(0, enabledFiltersDisplayCount)
          .map((filterType) => {
            const filter = filterOptions[filterType];
            return (
              <Filter key={`${filterType}`} title={filter.title}>
                {filter.isSingleSelect ? (
                  <CoreSelect
                    id={filter.type}
                    value={getFilterOptions(
                      get(filters, filter.type),
                      filter.options,
                    )}
                    options={
                      filter.type === FILTER_TYPES.TIME_PERIOD
                        ? filter.options
                        : sortByLabel(filter.options, "label")
                    }
                    onChange={filter.setFilters(filtersStore)}
                    defaultValue={filter.defaultValue}
                    isChanged={
                      filter.defaultValue !==
                      getFilterOptions(
                        get(filters, filter.type),
                        filter.options,
                      )[0]?.value
                    }
                  />
                ) : (
                  <CoreMultiSelect
                    id={filter.type}
                    summingOption={{ value: "ALL", label: "All" }}
                    value={getFilterOptions(
                      get(filters, filter.type),
                      filter.options,
                    )}
                    options={
                      filter.type === FILTER_TYPES.TIME_PERIOD
                        ? filter.options
                        : sortByLabel(filter.options, "label")
                    }
                    onChange={filter.setFilters(filtersStore)}
                    defaultValue={[filter.defaultOption]}
                    isChanged={
                      filter.defaultValue !==
                      getFilterOptions(
                        get(filters, filter.type),
                        filter.options,
                      )[0]?.value
                    }
                  />
                )}
              </Filter>
            );
          })}
      </FilterBar>
    </div>
  );
};

export default observer(PathwaysFilterBar);
