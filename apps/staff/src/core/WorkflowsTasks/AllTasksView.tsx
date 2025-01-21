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

import { observer } from "mobx-react-lite";
import React from "react";
import { Accordion } from "react-accessible-accordion";

import { CaseloadTasksPresenter } from "../../WorkflowsStore/presenters/CaseloadTasksPresenter";
import { TaskListItem } from "./ListItem";
import { TaskListGroup } from "./TaskListGroup";

type AllTasksViewProps = {
  presenter: CaseloadTasksPresenter;
};

export const AllTasksView = observer(function AllTasksViewComponent({
  presenter,
}: AllTasksViewProps) {
  const { clientsWithOverdueTasks, clientsWithUpcomingTasks } = presenter;

  return (
    <Accordion allowMultipleExpanded allowZeroExpanded preExpanded={["0", "1"]}>
      {clientsWithOverdueTasks.length ? (
        <TaskListGroup
          title={"Overdue"}
          uuid={"0"}
          items={clientsWithOverdueTasks}
          renderer={(person) => (
            <TaskListItem person={person} key={person.recordId} />
          )}
        />
      ) : null}
      {clientsWithUpcomingTasks.length ? (
        <TaskListGroup
          title={"Due this month"}
          uuid={"1"}
          items={clientsWithUpcomingTasks}
          renderer={(person) => (
            <TaskListItem person={person} key={person.recordId} />
          )}
        />
      ) : null}
    </Accordion>
  );
});
