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
import styled from "styled-components/macro";

import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import { MaxWidth } from "../sharedComponents";
import { TaskListGroup } from "./TaskListGroup";
import { TaskListItemV2 } from "./TaskListItemV2";

const TasksListContainer = styled.div`
  ${MaxWidth}
`;

type AllTasksViewProps = {
  presenter: CaseloadTasksPresenterV2;
};

export const TasksList = observer(function TasksList({
  presenter,
}: AllTasksViewProps) {
  const { clientsWithOverdueTasks, clientsWithUpcomingTasks } = presenter;

  return (
    <TasksListContainer>
      <Accordion
        allowMultipleExpanded
        allowZeroExpanded
        preExpanded={["0", "1"]}
      >
        {clientsWithOverdueTasks.length ? (
          <TaskListGroup
            title={"Overdue"}
            uuid={"0"}
            items={clientsWithOverdueTasks}
            renderer={(person) => (
              <TaskListItemV2 person={person} key={person.recordId} />
            )}
          />
        ) : null}
        {clientsWithUpcomingTasks.length ? (
          <TaskListGroup
            title={"Due this month"}
            uuid={"1"}
            items={clientsWithUpcomingTasks}
            renderer={(person) => (
              <TaskListItemV2 person={person} key={person.recordId} />
            )}
          />
        ) : null}
      </Accordion>
    </TasksListContainer>
  );
});
