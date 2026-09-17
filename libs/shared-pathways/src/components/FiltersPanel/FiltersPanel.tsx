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
import {
  FilterOption,
  PopulationFilters,
  PopulationFilterValues,
} from "../../filters";
import { FiltersStoreBase } from "../../FiltersStoreBase";
import CheckboxGroupWithSelectAllTitle from "../CheckboxGroup/CheckboxGroupWithSelectAllTitle";
import FilterSectionLayout from "../FilterSectionLayout/FilterSectionLayout";
import PathwaysModal from "../PathwaysModal/PathwaysModal";
import RadioGroup from "../RadioGroup/RadioGroup";
import { TogglePill } from "../TogglePill";
import { PillOption } from "../TogglePill/TogglePill";
import {
  ApplyButton,
  DisableableFieldset,
  FilterSection,
  FilterSectionContent,
  FilterSectionRow,
  ResetButton,
} from "./FiltersPanel.styles";
import PathwaysDropdownFilter from "./PathwaysDropdownFilter";

type FiltersPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  filtersStore: FiltersStoreBase;
  trackApplyFilters?: (filters: PopulationFilterValues) => void;
  enableMetricModeToggle?: boolean;
  metricModeOptions?: PillOption[];
  disabledFilters?: Record<string, string>;
  renderInDeclaredOrder?: boolean;
};

const FiltersPanel: React.FC<FiltersPanelProps> = observer(
  function FiltersPanel({
    isOpen,
    onClose,
    filtersStore,
    trackApplyFilters,
    enableMetricModeToggle,
    metricModeOptions,
    disabledFilters = {},
    renderInDeclaredOrder = false,
  }) {
    const { filters, filterOptions } = filtersStore;
    const enabledFilters = filtersStore.metric.filters.enabledFilters;

    const [pendingFilters, setPendingFilters] = useState<
      Record<string, string[]>
    >({});
    const [pendingMetricMode, setPendingMetricMode] = useState<string | null>(
      null,
    );

    useEffect(() => {
      if (!isOpen) {
        setPendingFilters({});
        setPendingMetricMode(null);
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

    // A metric can need several values of a filter that is single-select for
    // every other chart, so its own list wins over the filter's default.
    const isSingleSelect = (filterType: string) =>
      filterOptions[filterType as keyof PopulationFilters]?.isSingleSelect &&
      !filtersStore.metric.multiSelectFilters?.includes(filterType);

    const singleSelectRadioFilters = enabledFilters.filter(
      (filterType) =>
        isSingleSelect(filterType) && !dropdownFilterTypes.includes(filterType),
    );

    const multiSelectFilters = enabledFilters.filter(
      (filterType) => !isSingleSelect(filterType),
    );

    /**
     * Grouping every radio ahead of every checkbox is how this panel has
     * always laid out, so it stays the default. A caller whose design fixes
     * the order — a filter that has to sit last, say — asks for the order it
     * declared instead.
     */
    const orderedFilters = renderInDeclaredOrder
      ? enabledFilters.filter(
          (filterType) => !dropdownFilterTypes.includes(filterType),
        )
      : [...singleSelectRadioFilters, ...multiSelectFilters];

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

    /**
     * Returns the labelled groups a filter's options divide into, or undefined
     * where they are one flat list. The leading "All" option belongs to the
     * filter as a whole, so it is not part of any group.
     */
    const optionGroups = (
      filter: PopulationFilters[keyof PopulationFilters],
    ) => {
      const selectable = filter.options.slice(1);
      const names = [
        ...new Set(selectable.map((o) => o.group).filter(Boolean)),
      ] as string[];
      if (names.length === 0) return undefined;

      return names.map((group) => ({
        group,
        options: selectable.filter((o) => o.group === group),
      }));
    };

    /**
     * Replaces one group's selection while leaving every other group's alone,
     * so unchecking a type under one custody status does not touch the
     * same-named type under the other.
     */
    const onUpdateGroup = (
      filterType: keyof PopulationFilters,
      groupOptions: FilterOption[],
      selected: FilterOption[],
    ) => {
      const groupValues = new Set(groupOptions.map((o) => o.value));
      const fromOtherGroups = getSelectedOptions(filterType)
        .map((o) => o.value)
        .filter((value) => !groupValues.has(value));

      setPendingFilters({
        ...pendingFilters,
        [filterType]: collapseIfEverything(filterType, [
          ...fromOtherGroups,
          ...selected.map((o) => o.value),
        ]),
      });
    };

    /**
     * Returns "ALL" where the selection covers every option the filter offers.
     * Selecting everything back is the same state the filter started in, so it
     * has to read as "All" again rather than spelling out every value, and it
     * drops out of the query the same way.
     */
    const collapseIfEverything = (
      filterType: keyof PopulationFilters,
      values: string[],
    ): string[] => {
      const selectable = filterOptions[filterType].options
        .slice(1)
        .map((o) => o.value);

      const coversEverything =
        selectable.length > 0 &&
        selectable.every((value) => values.includes(value));

      return coversEverything ? ["ALL"] : values;
    };

    const onUpdateFilters = (
      newOptions: FilterOption[],
      filterType: string,
    ) => {
      setPendingFilters({
        ...pendingFilters,
        [filterType]: collapseIfEverything(
          filterType as keyof PopulationFilters,
          newOptions.map((o) => o.value),
        ),
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
      // TODO(#4658) move metric mode apply logic into FiltersStore once staff Pathways
      // is moved over to new design
      if (pendingMetricMode !== null) {
        filtersStore.setMetricMode(pendingMetricMode);
      }
      trackApplyFilters?.({ ...filtersStore.filters });
      onClose();
    };

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onApply();
    };

    const onReset = () => {
      filtersStore.resetFilters();
      onClose();
    };

    const renderRadioFilter = (filterType: keyof PopulationFilters) => {
      const filter = filterOptions[filterType];
      if (!filter) return null;

      const disabledReason = disabledFilters[filterType];

      return (
        <FilterSection key={filterType}>
          <FilterSectionContent>
            <DisableableFieldset
              disabled={Boolean(disabledReason)}
              title={disabledReason}
            >
              <FilterSectionLayout
                title={filter.title}
                description={filter.description}
              >
                <RadioGroup
                  filter={filter}
                  defaultValue={getSelectedValue(filterType)}
                  onChange={onUpdateFilters}
                />
              </FilterSectionLayout>
            </DisableableFieldset>
          </FilterSectionContent>
        </FilterSection>
      );
    };

    const renderCheckboxFilter = (filterType: keyof PopulationFilters) => {
      const filter = filterOptions[filterType];
      if (!filter) return null;

      const disabledReason = disabledFilters[filterType];
      const groups = optionGroups(filter);

      if (!groups) {
        return (
          <FilterSection key={filterType}>
            <FilterSectionContent>
              <DisableableFieldset
                disabled={Boolean(disabledReason)}
                title={disabledReason}
              >
                <CheckboxGroupWithSelectAllTitle
                  filter={filter}
                  selectedOptions={getSelectedOptions(filterType)}
                  onChange={onUpdateFilters}
                />
              </DisableableFieldset>
            </FilterSectionContent>
          </FilterSection>
        );
      }

      // One filter, several labelled groups. Each group reports only its own
      // options, so the merge keeps the other groups' selections.
      return groups.map(({ group, options }) => (
        <FilterSection key={`${filterType}-${group}`}>
          <FilterSectionContent>
            <DisableableFieldset
              disabled={Boolean(disabledReason)}
              title={disabledReason}
            >
              <CheckboxGroupWithSelectAllTitle
                filter={{
                  ...filter,
                  title: `${filter.title} — ${group}`,
                  options: [filter.options[0], ...options],
                }}
                selectedOptions={getSelectedOptions(filterType).filter((o) =>
                  options.some((opt) => opt.value === o.value),
                )}
                onChange={(selected) =>
                  onUpdateGroup(filterType, options, selected)
                }
              />
            </DisableableFieldset>
          </FilterSectionContent>
        </FilterSection>
      ));
    };

    return (
      <PathwaysModal
        isShowing={isOpen}
        hide={onClose}
        title="Select Filters"
        onSubmit={onSubmit}
        footer={
          <>
            <ResetButton type="button" onClick={onReset}>
              Reset filters
            </ResetButton>
            <ApplyButton type="submit">Apply</ApplyButton>
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
        {(dateInPopulationFilter || enableMetricModeToggle) && (
          <FilterSection>
            <FilterSectionContent>
              <FilterSectionRow>
                {enableMetricModeToggle && metricModeOptions && (
                  <FilterSectionLayout title="Display">
                    <TogglePill
                      leftPill={metricModeOptions[0]}
                      rightPill={metricModeOptions[1]}
                      currentValue={
                        pendingMetricMode ?? filtersStore.currentMetricMode
                      }
                      onChange={setPendingMetricMode}
                    />
                  </FilterSectionLayout>
                )}
                {dateInPopulationFilter && (
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
                )}
              </FilterSectionRow>
            </FilterSectionContent>
          </FilterSection>
        )}
        {orderedFilters.map((filterType) =>
          isSingleSelect(filterType)
            ? renderRadioFilter(filterType)
            : renderCheckboxFilter(filterType),
        )}
      </PathwaysModal>
    );
  },
);

export default FiltersPanel;
