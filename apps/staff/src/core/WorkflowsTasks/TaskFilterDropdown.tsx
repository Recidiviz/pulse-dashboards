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
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

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
  gap: 8px;
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
`;

const StyledFilterDropdownMenuItem = styled(DropdownMenuItem)`
  padding-left: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${palette.pine4};
  height: 17px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;

  &:last-child {
    margin-bottom: 0;
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

const ClearAllButton = styled(DropdownMenuItem)`
  margin-top: 8px;
  margin-bottom: 0 !important;
  padding-left: 0;
  text-transform: uppercase;
  font-weight: 700;
  color: ${palette.pine4};
`;

const TaskFilterDropdownItem = observer(function TaskFilterDropdownItem({
  option,
  onClick,
  checked,
}: {
  option: TaskFilterOption;
  onClick: () => void;
  checked: boolean;
}) {
  return (
    <StyledFilterDropdownMenuItem onClick={() => onClick()} key={option.value}>
      <input readOnly type={"checkbox"} checked={checked} />{" "}
      {option.label ?? option.value}
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
        />
      ))}
    </FilterGroup>
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
        <ClearAllButton key="clear" onClick={() => presenter.resetFilters()}>
          Clear all filters
        </ClearAllButton>
      </FilterDropdownMenu>
    </Dropdown>
  );
});
