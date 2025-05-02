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
import { Accordion } from "react-accessible-accordion";
import styled from "styled-components/macro";

import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import { MaxWidth } from "../sharedComponents";
import { TaskListGroup } from "./TaskListGroup";
import { TaskListItemV2 } from "./TaskListItemV2";
import { EmptyTasksTabView } from "./TasksTable";

const TasksListContainer = styled.div`
  ${MaxWidth}
  height: 100%;
`;

type AllTasksViewProps = {
  presenter: CaseloadTasksPresenterV2;
};

export const TasksList = observer(function TasksList({
  presenter,
}: AllTasksViewProps) {
  const overdue = presenter.orderedPersonsForCategory("OVERDUE");
  const dueThisWeek = presenter.orderedPersonsForCategory("DUE_THIS_WEEK");
  const dueThisMonth = presenter.orderedPersonsForCategory("DUE_THIS_MONTH");
  const upcoming = presenter.clientsWithUpcomingTasks.filter((person) => {
    return (
      !overdue.includes(person) &&
      !dueThisWeek.includes(person) &&
      !dueThisMonth.includes(person)
    );
  });
  const taskGroups = [overdue, dueThisWeek, dueThisMonth, upcoming];
  const labels = ["Overdue", "Due this week", "Due this month", "Upcoming"];
  const uuids = taskGroups.map((_, i) => `${i}`);

  if (
    overdue.length +
      dueThisWeek.length +
      dueThisMonth.length +
      upcoming.length ===
    0
  ) {
    return <EmptyTasksTabView presenter={presenter} />;
  }

  return (
    <TasksListContainer>
      <Accordion allowMultipleExpanded allowZeroExpanded preExpanded={uuids}>
        {taskGroups.map((tasks, i) => {
          return tasks.length ? (
            <TaskListGroup
              title={labels[i]}
              key={labels[i]}
              uuid={uuids[i]}
              items={tasks}
              renderer={(person: JusticeInvolvedPerson) => (
                <TaskListItemV2 person={person} key={person.recordId} />
              )}
            />
          ) : null;
        })}
      </Accordion>
    </TasksListContainer>
  );
});
