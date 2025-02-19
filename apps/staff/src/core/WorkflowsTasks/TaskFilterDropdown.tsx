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
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import React from "react";

import { useFeatureVariants } from "../../components/StoreProvider";
import { CaseloadTasksPresenter } from "../../WorkflowsStore/presenters/CaseloadTasksPresenter";
import { TaskFilterField, TaskFilterOption } from "../models/types";

function TaskFilterDropdownItem({
  option,
  onClick,
}: {
  option: TaskFilterOption;
  onClick: () => void;
}) {
  return (
    <DropdownMenuItem onClick={() => onClick()} key={option.value}>
      {option.label ?? option.value}
    </DropdownMenuItem>
  );
}

function TaskFilterDropdownGroup({
  field,
  options,
  presenter,
}: {
  field: TaskFilterField;
  options: TaskFilterOption[];
  presenter: CaseloadTasksPresenter;
}) {
  return options.map((option) => (
    <TaskFilterDropdownItem
      key={option.value}
      option={option}
      onClick={() => presenter.setFilter(field, option)}
    />
  ));
}

export const TaskFilterDropdown = observer(function TaskFilterDropdown({
  presenter,
}: {
  presenter: CaseloadTasksPresenter;
}) {
  const { filters } = presenter;
  const { taskFilters } = useFeatureVariants();

  if (!taskFilters) return null;

  return (
    <Dropdown>
      <DropdownToggle>Filters</DropdownToggle>
      <DropdownMenu>
        <>
          {filters.map(({ field, options }) => (
            <TaskFilterDropdownGroup
              key={field}
              field={field}
              options={options}
              presenter={presenter}
            />
          ))}
        </>
        <DropdownMenuItem onClick={() => presenter.resetFilters()} key="clear">
          Clear
        </DropdownMenuItem>
      </DropdownMenu>
    </Dropdown>
  );
});
