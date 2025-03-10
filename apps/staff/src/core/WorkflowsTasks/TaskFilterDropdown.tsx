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

import { useFeatureVariants } from "../../components/StoreProvider";
import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import { TaskFilterField, TaskFilterOption } from "../models/types";

const FilterDropdownToggle = styled(DropdownToggle)`
  padding: 12px 16px;
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

const FilterDropdownMenu = styled(DropdownMenu)`
  transform: translateX(-124px) translateY(4px);
  width: 231px;
  padding: 24px 22px;
  overflow: hidden;
  white-space: nowrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;

  &:not(:first-child) {
    margin-top: 14px;
    padding-top: 22px;
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

  &:last-child {
    margin-bottom: 0;
  }
`;

const ClearAllButton = styled(StyledFilterDropdownMenuItem)`
  margin-top: 8px;
  text-transform: uppercase;
  font-weight: 700;
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
  const { taskFilters } = useFeatureVariants();

  if (!taskFilters) return null;

  return (
    <Dropdown>
      <FilterDropdownToggle>
        <FilterIcon /> Filters <FilterDownArrow />
      </FilterDropdownToggle>
      <FilterDropdownMenu>
        <>
          {filters.map(({ field, options, title }) => (
            <TaskFilterDropdownGroup
              key={field}
              title={title}
              field={field}
              options={options}
              presenter={presenter}
            />
          ))}
        </>
        <ClearAllButton key="clear" onClick={() => presenter.resetFilters()}>
          Clear all filters{" "}
          {presenter.selectedFilterCount !== 0 &&
            `(${presenter.selectedFilterCount})`}
        </ClearAllButton>
      </FilterDropdownMenu>
    </Dropdown>
  );
});
