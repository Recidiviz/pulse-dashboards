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
 * Type filter for the US_ID case notes list.
 *
 * @param types - Every note type this resident has, in display order.
 * @param selectedTypes - The types currently shown.
 * @param countsByType - How many notes each type has.
 * @param onToggleType - Adds or removes one type.
 * @param onSelectOnlyType - Narrows to one type.
 * @param onSelectAllTypes - Selects every type.
 * @param onClearAllTypes - Deselects every type.
 */
export function UsIdCaseNotesFilter({
  types,
  selectedTypes,
  countsByType,
  onToggleType,
  onSelectOnlyType,
  onSelectAllTypes,
  onClearAllTypes,
}: {
  types: Array<string>;
  selectedTypes: Set<string>;
  countsByType: Map<string, number>;
  onToggleType: (type: string) => void;
  onSelectOnlyType: (type: string) => void;
  onSelectAllTypes: () => void;
  onClearAllTypes: () => void;
}) {
  const allSelected = selectedTypes.size === types.length;

  return (
    <Dropdown>
      <FilterToggle>
        <FilterIcon $filters={!allSelected} /> Filters
        {!allSelected && ` (${selectedTypes.size})`}
        <FilterDownArrow />
      </FilterToggle>
      <FilterMenu alignment="right">
        <FilterGroup $isMobile={false}>
          <FilterGroupHeader>Contact Type</FilterGroupHeader>
          {types.map((type) => (
            <FilterItem
              key={type}
              preventCloseOnClickEvent
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                onToggleType(type);
              }}
            >
              <OptionLabel>
                <CheckboxContainer>
                  <Checkbox checked={selectedTypes.has(type)} value={type} />
                </CheckboxContainer>
                {type}
              </OptionLabel>
              <FilterCount>{countsByType.get(type) ?? 0}</FilterCount>
              <SelectOnlyButton
                onClick={(e: React.MouseEvent) => {
                  onSelectOnlyType(type);
                  e.stopPropagation();
                }}
              >
                ONLY
              </SelectOnlyButton>
            </FilterItem>
          ))}
          <ClearAllButton
            preventCloseOnClickEvent
            onClick={allSelected ? onClearAllTypes : onSelectAllTypes}
          >
            {allSelected ? "Clear all filters" : "Select all filters"}
          </ClearAllButton>
        </FilterGroup>
      </FilterMenu>
    </Dropdown>
  );
}
