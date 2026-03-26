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

import { get } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";

import { FILTER_TYPES } from "../../constants";
import { getFilterOptions } from "../../filterOptions";
import { FilterOption, PopulationFilters } from "../../filters";
import { FiltersStoreBase } from "../../FiltersStoreBase";
import CheckboxGroupWithSelectAllTitle from "../CheckboxGroup/CheckboxGroupWithSelectAllTitle";
import FilterSectionLayout from "../FilterSectionLayout/FilterSectionLayout";
import PathwaysModal from "../PathwaysModal/PathwaysModal";
import RadioGroup from "../RadioGroup/RadioGroup";
import {
  ApplyButton,
  FilterSection,
  FilterSectionContent,
  ResetButton,
} from "./FiltersPanel.styles";
import PathwaysDropdownFilter from "./PathwaysDropdownFilter";

type FiltersPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  filtersStore: FiltersStoreBase;
};

const FiltersPanel: React.FC<FiltersPanelProps> = observer(
  function FiltersPanel({ isOpen, onClose, filtersStore }) {
    const { filters, filterOptions } = filtersStore;
    const enabledFilters = filtersStore.metric.filters.enabledFilters;

    const [pendingFilters, setPendingFilters] = useState<
      Record<string, string[]>
    >({});

    useEffect(() => {
      if (!isOpen) {
        setPendingFilters({});
      }
    }, [isOpen, enabledFilters]);

    const timePeriodFilter = enabledFilters.includes(FILTER_TYPES.TIME_PERIOD)
      ? filterOptions[FILTER_TYPES.TIME_PERIOD]
      : null;

    const dateInPopulationFilter = enabledFilters.includes(
      FILTER_TYPES.DATE_IN_POPULATION,
    )
      ? filterOptions[FILTER_TYPES.DATE_IN_POPULATION]
      : null;

    // TODO(#2583) Remove these dropdown/singleSelect filter types once staff
    // app is moved over to new layout.
    // Then remove TIME_PERIOD and DATE_IN_POPULATION as isSingleSelect
    const dropdownFilterTypes: string[] = [
      FILTER_TYPES.TIME_PERIOD,
      FILTER_TYPES.DATE_IN_POPULATION,
    ];

    const singleSelectRadioFilters = enabledFilters.filter(
      (filterType) =>
        filterOptions[filterType]?.isSingleSelect &&
        !dropdownFilterTypes.includes(filterType),
    );

    const multiSelectFilters = enabledFilters.filter(
      (filterType) => !filterOptions[filterType]?.isSingleSelect,
    );

    const getSelectedOptions = (
      filterType: keyof PopulationFilters,
    ): FilterOption[] => {
      const filter = filterOptions[filterType];
      const pending = pendingFilters[filterType];
      const currentValues = pending ?? (get(filters, filterType) as string[]);
      // "ALL" means all options are selected — return all non-ALL options
      if (currentValues.length === 1 && currentValues[0] === "ALL") {
        return filter.options.slice(1);
      }
      return getFilterOptions(currentValues, filter.options);
    };

    const getSelectedValue = (filterType: keyof PopulationFilters): string => {
      const pending = pendingFilters[filterType];
      const currentValues = pending ?? (get(filters, filterType) as string[]);
      return currentValues[0] ?? "";
    };

    const onUpdateFilters = (
      newOptions: FilterOption[],
      filterType: string,
    ) => {
      setPendingFilters({
        ...pendingFilters,
        [filterType]: newOptions.map((o) => o.value),
      });
    };

    const onDropdownChange = (filterType: string, value: string) => {
      setPendingFilters({
        ...pendingFilters,
        [filterType]: [value],
      });
    };

    const onApply = () => {
      filtersStore.setFilters(pendingFilters);
      onClose();
    };

    const onReset = () => {
      filtersStore.resetFilters();
      onClose();
    };

    return (
      <PathwaysModal
        isShowing={isOpen}
        hide={onClose}
        title="Select Filters"
        footer={
          <>
            <ResetButton type="button" onClick={onReset}>
              Reset filters
            </ResetButton>
            <ApplyButton onClick={onApply}>Apply</ApplyButton>
          </>
        }
      >
        {timePeriodFilter && (
          <FilterSection>
            <FilterSectionContent>
              <PathwaysDropdownFilter
                label={timePeriodFilter.title}
                options={timePeriodFilter.options}
                defaultValue={timePeriodFilter.defaultValue}
                selectedValue={getSelectedValue(FILTER_TYPES.TIME_PERIOD)}
                onChange={(value) =>
                  onDropdownChange(FILTER_TYPES.TIME_PERIOD, value)
                }
              />
            </FilterSectionContent>
          </FilterSection>
        )}
        {dateInPopulationFilter && (
          <FilterSection>
            <FilterSectionContent>
              <PathwaysDropdownFilter
                label={dateInPopulationFilter.title}
                options={dateInPopulationFilter.options}
                defaultValue={dateInPopulationFilter.options[0]?.value}
                selectedValue={getSelectedValue(
                  FILTER_TYPES.DATE_IN_POPULATION,
                )}
                onChange={(value) =>
                  onDropdownChange(FILTER_TYPES.DATE_IN_POPULATION, value)
                }
              />
            </FilterSectionContent>
          </FilterSection>
        )}
        {singleSelectRadioFilters.map((filterType) => {
          const filter = filterOptions[filterType];
          if (!filter) return null;

          return (
            <FilterSection key={filterType}>
              <FilterSectionContent>
                <FilterSectionLayout title={filter.title}>
                  <RadioGroup
                    filter={filter}
                    defaultValue={getSelectedValue(filterType)}
                    onChange={onUpdateFilters}
                  />
                </FilterSectionLayout>
              </FilterSectionContent>
            </FilterSection>
          );
        })}
        {multiSelectFilters.map((filterType) => {
          const filter = filterOptions[filterType];
          if (!filter) return null;

          return (
            <FilterSection key={filterType}>
              <FilterSectionContent>
                <CheckboxGroupWithSelectAllTitle
                  filter={filter}
                  selectedOptions={getSelectedOptions(filterType)}
                  onChange={onUpdateFilters}
                />
              </FilterSectionContent>
            </FilterSection>
          );
        })}
      </PathwaysModal>
    );
  },
);

export default FiltersPanel;
