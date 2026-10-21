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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  palette,
} from "~design-system";

import Checkbox from "../../../../components/Checkbox";
import {
  FilterGroup,
  FilterGroupHeader,
} from "../../../WorkflowsFilters/WorkflowsFilterDropdown";

const FilterToggle = styled(DropdownToggle)`
  padding: ${rem(12)} ${rem(16)};
  height: ${rem(40)};

  &:hover {
    background-color: ${palette.slate10};
    color: ${palette.pine4};
  }
  &:focus {
    background-color: unset;
  }
`;

const FilterIcon = styled.i.attrs({ className: "fa fa-filter" })<{
  $filters: boolean;
}>`
  color: ${({ $filters }) => ($filters ? palette.pine4 : palette.slate30)};
  margin-top: -2px;
  padding-right: 4px;
`;

const FilterDownArrow = styled.i.attrs({ className: "fa fa-caret-down" })`
  margin-top: -2px;
  padding-left: 8px;
`;

const FilterMenu = styled(DropdownMenu)`
  padding: ${rem(24)} ${rem(22)};
  min-width: ${rem(260)};
`;

const RightText = `
  font-size: ${rem(12)};
  font-weight: 500;
  padding: 0 4px;
`;

const FilterCount = styled.div`
  ${RightText}
  color: ${palette.pine4};
`;

const SelectOnlyButton = styled.div`
  ${RightText}
  color: ${palette.pine4};
  display: none;

  &:hover {
    background-color: ${palette.slate10};
    border-radius: 10px;
  }
`;

const FilterItem = styled(DropdownMenuItem)`
  padding-left: 0;
  padding-right: 0;
  overflow: hidden;
  color: ${palette.pine4};
  height: ${rem(25)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${rem(spacing.sm)};

  &:hover {
    color: ${palette.pine1};

    & > ${SelectOnlyButton} {
      display: block;
      color: ${palette.pine1};
    }

    & > ${FilterCount} {
      display: none;
    }
  }

  &:active,
  &:focus {
    background-color: unset;
    color: ${palette.pine1};
  }
`;

const OptionLabel = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: ${rem(8)};
`;

const CheckboxContainer = styled.div`
  & label.Checkbox__container {
    margin-bottom: 0;
    margin-top: ${rem(8)};
    padding-left: 0;
  }
`;

const ClearAllButton = styled(FilterItem)`
  margin-top: ${rem(spacing.md)};
  text-transform: uppercase;
  font-weight: 700;
`;

/**
 * One checkbox group in the filter menu. The options are every value the
 * resident's notes have, in display order.
 */
export type UsIdCaseNotesFilterGroup = {
  title: string;
  options: Array<string>;
  selectedOptions: Set<string>;
  countsByOption: Map<string, number>;
  onToggleOption: (option: string) => void;
  onSelectOnlyOption: (option: string) => void;
};

/**
 * Filter menu for the US_ID case notes list. Each group narrows the list
 * independently.
 *
 * @param groups - The checkbox groups to show, in display order.
 * @param onSelectAll - Selects every option in every group.
 * @param onClearAll - Deselects every option in every group.
 */
export function UsIdCaseNotesFilter({
  groups,
  onSelectAll,
  onClearAll,
}: {
  groups: Array<UsIdCaseNotesFilterGroup>;
  onSelectAll: () => void;
  onClearAll: () => void;
}) {
  const allSelected = groups.every(
    ({ options, selectedOptions }) => selectedOptions.size === options.length,
  );
  const selectedCount = groups.reduce(
    (total, { selectedOptions }) => total + selectedOptions.size,
    0,
  );

  return (
    <Dropdown>
      <FilterToggle>
        <FilterIcon $filters={!allSelected} /> Filters
        {!allSelected && ` (${selectedCount})`}
        <FilterDownArrow />
      </FilterToggle>
      <FilterMenu alignment="right">
        {groups.map(
          ({
            title,
            options,
            selectedOptions,
            countsByOption,
            onToggleOption,
            onSelectOnlyOption,
          }) => (
            <FilterGroup key={title} $isMobile={false}>
              <FilterGroupHeader>{title}</FilterGroupHeader>
              {options.map((option) => (
                <FilterItem
                  key={option}
                  preventCloseOnClickEvent
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    onToggleOption(option);
                  }}
                >
                  <OptionLabel>
                    <CheckboxContainer>
                      <Checkbox
                        checked={selectedOptions.has(option)}
                        value={option}
                      />
                    </CheckboxContainer>
                    {option}
                  </OptionLabel>
                  <FilterCount>{countsByOption.get(option) ?? 0}</FilterCount>
                  <SelectOnlyButton
                    onClick={(e: React.MouseEvent) => {
                      onSelectOnlyOption(option);
                      e.stopPropagation();
                    }}
                  >
                    ONLY
                  </SelectOnlyButton>
                </FilterItem>
              ))}
            </FilterGroup>
          ),
        )}
        <ClearAllButton
          preventCloseOnClickEvent
          onClick={allSelected ? onClearAll : onSelectAll}
        >
          {allSelected ? "Clear all filters" : "Select all filters"}
        </ClearAllButton>
      </FilterMenu>
    </Dropdown>
  );
}
