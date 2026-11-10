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

import React, { useState } from "react";

import ArrowDown from "../../assets/arrow-down.svg?react";
import {
  type ApplicationsTableFilters,
  EMPTY_APPLICATIONS_TABLE_FILTERS,
  hasActiveFilters,
  LAST_UPDATED_FILTER_OPTIONS,
  RELEASE_DATE_FILTER_OPTIONS,
  STAGE_FILTER_OPTIONS,
  type StatusFilterOption,
} from "./applicationsTable.filters";
import * as Styled from "./ApplicationsTable.styles";

export interface ApplicationsFilterDropdownProps {
  filters: ApplicationsTableFilters;
  onChange: (filters: ApplicationsTableFilters) => void;
  onClose: () => void;
  hideDraftStage?: boolean;
  statusFilterOptions: readonly StatusFilterOption[];
  showHomePlanFilter?: boolean;
}

type FilterSectionConfig<T extends string> = {
  title: string;
  options: readonly T[];
  selected: T[];
  onToggle: (option: T) => void;
  showDivider?: boolean;
  singleSelect?: boolean;
  itemAfter?: (option: T) => React.ReactNode;
};

function FilterSection<T extends string>({
  title,
  options,
  selected,
  onToggle,
  showDivider = true,
  singleSelect = false,
  itemAfter,
}: FilterSectionConfig<T>) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <Styled.FilterExpandableSection>
        <Styled.FilterSectionHeader
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((open) => !open)}
        >
          <Styled.FilterSectionTitle>{title}</Styled.FilterSectionTitle>
          <Styled.FilterSectionChevron $expanded={isExpanded}>
            <ArrowDown aria-hidden />
          </Styled.FilterSectionChevron>
        </Styled.FilterSectionHeader>
        {isExpanded && (
          <Styled.FilterOptionList
            role="listbox"
            aria-multiselectable={!singleSelect}
          >
            {options.map((option) => {
              const checked = selected.includes(option);
              return (
                <React.Fragment key={option}>
                  <Styled.FilterOptionItem
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => onToggle(option)}
                  >
                    <Styled.FilterCheckbox $checked={checked} aria-hidden />
                    <Styled.FilterOptionLabel>
                      {option}
                    </Styled.FilterOptionLabel>
                  </Styled.FilterOptionItem>
                  {itemAfter?.(option)}
                </React.Fragment>
              );
            })}
          </Styled.FilterOptionList>
        )}
      </Styled.FilterExpandableSection>
      {showDivider && <Styled.FilterSectionDivider />}
    </>
  );
}

function toggleSelection<T extends string>(selected: T[], option: T): T[] {
  return selected.includes(option)
    ? selected.filter((v) => v !== option)
    : [...selected, option];
}

function selectSingle<T extends string>(selected: T[], option: T): T[] {
  return selected.includes(option) ? [] : [option];
}

export const ApplicationsFilterDropdown: React.FC<ApplicationsFilterDropdownProps> =
  React.memo(function ApplicationsFilterDropdown({
    filters,
    onChange,
    onClose,
    hideDraftStage,
    statusFilterOptions,
    showHomePlanFilter,
  }) {
    const stageOptions = hideDraftStage
      ? STAGE_FILTER_OPTIONS.filter((option) => option !== "Draft")
      : STAGE_FILTER_OPTIONS;

    const updateSection = (
      key: keyof ApplicationsTableFilters,
      option: string,
      singleSelect = false,
    ) => {
      onChange({
        ...filters,
        [key]: singleSelect
          ? selectSingle(filters[key] as string[], option)
          : toggleSelection(filters[key] as string[], option),
      } as ApplicationsTableFilters);
    };

    const renderHomePlanItemAfter = React.useCallback(
      (option: (typeof STAGE_FILTER_OPTIONS)[number]) =>
        option === "Approvals" &&
        showHomePlanFilter && (
          <Styled.FilterOptionItem
            type="button"
            role="option"
            aria-selected={filters.homePlan}
            onClick={() =>
              onChange({ ...filters, homePlan: !filters.homePlan })
            }
          >
            <Styled.FilterCheckbox $checked={filters.homePlan} aria-hidden />
            <Styled.FilterOptionLabel>Home Plan</Styled.FilterOptionLabel>
          </Styled.FilterOptionItem>
        ),
      [filters, onChange, showHomePlanFilter],
    );

    return (
      <Styled.FilterDropdownPanel role="dialog" aria-label="Filters">
        <Styled.FilterDropdownSlot>
          <FilterSection
            title="Release date"
            options={RELEASE_DATE_FILTER_OPTIONS}
            selected={filters.releaseDate}
            onToggle={(option) => updateSection("releaseDate", option, true)}
            singleSelect
          />
          <FilterSection
            title="Stage"
            options={stageOptions}
            selected={filters.stage}
            onToggle={(option) => updateSection("stage", option)}
            itemAfter={renderHomePlanItemAfter}
          />
          <FilterSection
            title="Status"
            options={statusFilterOptions}
            selected={filters.status}
            onToggle={(option) => updateSection("status", option)}
          />
          <FilterSection
            title="Last updated"
            options={LAST_UPDATED_FILTER_OPTIONS}
            selected={filters.lastUpdated}
            onToggle={(option) => updateSection("lastUpdated", option, true)}
            showDivider={false}
            singleSelect
          />
        </Styled.FilterDropdownSlot>
        <Styled.FilterDropdownFooter>
          <Styled.FilterClearButton
            type="button"
            disabled={!hasActiveFilters(filters)}
            onClick={() => onChange(EMPTY_APPLICATIONS_TABLE_FILTERS)}
          >
            Clear
          </Styled.FilterClearButton>
          <Styled.FilterCloseButton type="button" onClick={onClose}>
            Close
          </Styled.FilterCloseButton>
        </Styled.FilterDropdownFooter>
      </Styled.FilterDropdownPanel>
    );
  });
