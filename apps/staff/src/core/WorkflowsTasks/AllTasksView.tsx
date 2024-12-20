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

import { useRootStore } from "../../components/StoreProvider";
import WorkflowsLastSynced from "../WorkflowsLastSynced";
import { TaskListItem } from "./ListItem";
import { TaskListGroup } from "./TaskListGroup";

export const AllTasksView = observer(function AllTasksViewComponent() {
  const {
    workflowsStore: {
      workflowsTasksStore: { clientsPartitionedByStatus },
    },
  } = useRootStore();

  const [personsWithOverdueTasks, personsWithUpcomingTasks] =
    clientsPartitionedByStatus;

  const lastSynced = clientsPartitionedByStatus.flat()[0].lastDataFromState;

  return (
    <Accordion allowMultipleExpanded allowZeroExpanded preExpanded={["0", "1"]}>
      {personsWithOverdueTasks.length ? (
        <TaskListGroup
          title={"Overdue"}
          uuid={"0"}
          items={personsWithOverdueTasks}
          renderer={(person) => (
            <TaskListItem person={person} key={person.recordId} />
          )}
        />
      ) : null}
      {personsWithUpcomingTasks.length ? (
        <TaskListGroup
          title={"Due this month"}
          uuid={"1"}
          items={personsWithUpcomingTasks}
          renderer={(person) => (
            <TaskListItem person={person} key={person.recordId} />
          )}
        />
      ) : null}
      <WorkflowsLastSynced date={lastSynced} />
    </Accordion>
  );
});
