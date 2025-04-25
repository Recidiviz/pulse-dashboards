// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  palette,
  spacing,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import Checkbox from "../../components/Checkbox";
import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import { TaskFilterField, TaskFilterOption } from "../models/types";

const FilterDropdownToggle = styled(DropdownToggle)`
  padding: 12px 16px;
  height: 41px;
`;

const FilterIcon = styled.i.attrs({
  className: "fa fa-filter",
})`
  color: ${palette.slate30};
  margin-top: -2px;
  padding-right: 4px;
`;

const FilterDownArrow = styled.i.attrs({
  className: "fa fa-caret-down",
})`
  margin-top: -2px;
  padding-left: 8px;
`;

// TODO: Replace the magic numbers with calculations
const FilterDropdownMenu = styled(DropdownMenu)`
  transform: translateX(-394px) translateY(4px);
  padding: 24px 22px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  white-space: nowrap;

  &:not(:first-child) {
    margin-top: 18px;
    padding-top: 18px;
    border-top: ${palette.slate30} 1px solid;
  }
`;

const FilterGroupHeader = styled.div`
  text-transform: uppercase;
  font-size: ${rem(12)};
  font-weight: 700;
  padding: 0;
  padding-bottom: ${rem(spacing.xs)};
`;

const SelectOnlyButton = styled.div`
  border: none;
  color: ${palette.pine4};
  display: none;
  padding-right: ${rem(spacing.xs)};
  margin-left: ${rem(spacing.xs)};
`;

const StyledFilterDropdownMenuItem = styled(DropdownMenuItem)`
  padding-left: 0;
  padding-right: 0;
  overflow: hidden;
  color: ${palette.pine4};
  // 17px text height plus 4px padding top and bottom
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    & > ${SelectOnlyButton} {
      display: block;
    }
  }

  &:active,
  &:focus {
    // Override the default color inversion on hover
    background-color: ${palette.slate10};
    color: ${palette.pine4};
  }
`;

const FilterOptionLabel = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 8px;

  white-space: nowrap;
  overflow: hidden;
`;

const FilterCheckboxContainer = styled.div`
  & label.Checkbox__container {
    margin-bottom: 0;
    margin-top: 8px;
    padding-left: 0;
  }
`;

const FilterGroupColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px;
  border-bottom: ${palette.slate30} 1px solid;
  padding-bottom: 24px;
`;

const FilterGroupColumn = styled.div`
  width: 210px;
`;

const ClearAllButton = styled(StyledFilterDropdownMenuItem)`
  margin-top: ${rem(spacing.md)};
  text-transform: uppercase;
  font-weight: 700;
`;

const TaskFilterDropdownItem = observer(function TaskFilterDropdownItem({
  option,
  onClick,
  onClickOnly,
  checked,
}: {
  option: TaskFilterOption;
  onClick: () => void;
  onClickOnly: () => void;
  checked: boolean;
}) {
  return (
    <StyledFilterDropdownMenuItem
      preventCloseOnClickEvent
      onClick={() => onClick()}
      key={option.value}
    >
      <FilterOptionLabel>
        <FilterCheckboxContainer>
          <Checkbox
            checked={checked}
            value={option.value}
            onChange={() => onClick()}
          />
        </FilterCheckboxContainer>
        {option.label ?? option.value}
      </FilterOptionLabel>
      <SelectOnlyButton
        onClick={(e) => {
          onClickOnly();
          e.stopPropagation();
        }}
      >
        ONLY
      </SelectOnlyButton>
    </StyledFilterDropdownMenuItem>
  );
});

const TaskFilterDropdownGroup = observer(function TaskFilterDropdownGroup({
  field,
  options,
  presenter,
  title,
}: {
  field: TaskFilterField;
  options: TaskFilterOption[];
  presenter: CaseloadTasksPresenterV2;
  title: string;
}) {
  return (
    <FilterGroup>
      <FilterGroupHeader>{title}</FilterGroupHeader>
      {options.map((option) => (
        <TaskFilterDropdownItem
          key={option.value}
          option={option}
          checked={presenter.filterIsSelected(field, option)}
          onClick={() => presenter.toggleFilter(field, option)}
          onClickOnly={() => presenter.setOnlyFilterForField(field, option)}
        />
      ))}
    </FilterGroup>
  );
});

const ClearAll = observer(function ClearAll({
  presenter,
}: {
  presenter: CaseloadTasksPresenterV2;
}) {
  if (presenter.allFiltersSelected) {
    return (
      <ClearAllButton
        preventCloseOnClickEvent
        onClick={() => presenter.clearFilters()}
      >
        Clear all filters
      </ClearAllButton>
    );
  }

  return (
    <ClearAllButton
      preventCloseOnClickEvent
      onClick={() => presenter.resetFilters()}
    >
      Select all filters
    </ClearAllButton>
  );
});

export const TaskFilterDropdown = observer(function TaskFilterDropdown({
  presenter,
}: {
  presenter: CaseloadTasksPresenterV2;
}) {
  const { filters } = presenter;

  return (
    <Dropdown>
      <FilterDropdownToggle
        // TODO(#7899): Replace with a proper onMenuOpen handler
        onMouseUp={() => presenter.trackFilterDropdownOpened()}
      >
        <FilterIcon /> Filters
        <FilterDownArrow />
      </FilterDropdownToggle>
      <FilterDropdownMenu>
        <FilterGroupColumns>
          <FilterGroupColumn>
            {filters
              .slice(0, Math.ceil(filters.length / 2))
              .map(({ field, options, title }) => (
                <TaskFilterDropdownGroup
                  key={field}
                  title={title}
                  field={field}
                  options={options}
                  presenter={presenter}
                />
              ))}
          </FilterGroupColumn>
          <FilterGroupColumn>
            {filters
              .slice(Math.ceil(filters.length / 2))
              .map(({ field, options, title }) => (
                <TaskFilterDropdownGroup
                  key={field}
                  title={title}
                  field={field}
                  options={options}
                  presenter={presenter}
                />
              ))}
          </FilterGroupColumn>
        </FilterGroupColumns>
        <ClearAll presenter={presenter} key="clear" />
      </FilterDropdownMenu>
    </Dropdown>
  );
});
