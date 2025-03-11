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

import { startOfDay } from "date-fns";
import { groupBy } from "lodash";
import { observer } from "mobx-react-lite";
import moment from "moment/moment";
import React from "react";
import { Accordion } from "react-accessible-accordion";

import { CaseloadTasksPresenter } from "../../WorkflowsStore/presenters/CaseloadTasksPresenter";
import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import { TaskListItem } from "./ListItem";
import { TaskListGroup } from "./TaskListGroup";

const formatCalendarHeading = (dueDate: Date): string => {
  return `${moment(dueDate).format("MMM. D")} • ${moment(dueDate).format("dddd")}`;
};

type TasksCalendarViewProps = {
  presenter: CaseloadTasksPresenterV2 | CaseloadTasksPresenter;
};

export const TasksCalendarView: React.FC<TasksCalendarViewProps> = observer(
  function TasksCalendarView({ presenter }) {
    if (presenter.selectedTaskCategory === "DUE_THIS_MONTH") {
      return null;
    }

    const tasks = presenter.orderedTasksForSelectedCategory;

    const groupedTasks = groupBy(tasks, (task) => startOfDay(task.dueDate));

    return (
      <Accordion
        allowMultipleExpanded
        allowZeroExpanded
        preExpanded={Object.keys(groupedTasks).map((_, index) => `${index}`)}
        key={presenter.selectedTaskCategory}
      >
        {Object.entries(groupedTasks).map(([day, tasks], index) => (
          <TaskListGroup
            title={formatCalendarHeading(new Date(day))}
            uuid={`${index}`}
            items={tasks}
            key={day}
            renderer={(task) => (
              <TaskListItem
                person={task.person}
                task={task}
                key={task.person.recordId}
              />
            )}
          />
        ))}
      </Accordion>
    );
  },
);
