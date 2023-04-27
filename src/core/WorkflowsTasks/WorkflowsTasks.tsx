// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
  palette,
  Pill,
  Sans12,
  Sans14,
  Sans16,
  Serif34,
  spacing,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import moment from "moment";
import { rem } from "polished";
import React, { ReactNode } from "react";
import simplur from "simplur";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { pluralizeWord } from "../../utils";
import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import {
  SupervisionNeedType,
  SupervisionTask,
  SupervisionTaskType,
} from "../../WorkflowsStore/Task/types";
import { WorkflowsTasksStore } from "../../WorkflowsStore/Task/WorkflowsTasksStore";
import { getEntries } from "../../WorkflowsStore/utils";
import { JusticeInvolvedPersonAvatar } from "../Avatar";
import { CaseloadSelect } from "../CaseloadSelect";
import { CaseloadTasksHydrator } from "../TasksHydrator/TasksHydrator";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import WorkflowsResults from "../WorkflowsResults";
import { SupervisionTaskCategory, TASK_SELECTOR_LABELS } from "./fixtures";
import { TaskPreviewModal } from "./TaskPreviewModal";
import { TaskListTooltip } from "./WorkflowsTasksTooltip";

const TasksHeader = styled(Serif34)`
  color: ${palette.pine2};
  margin-bottom: ${rem(spacing.md)};
`;

const Caption = styled(Sans14)`
  color: ${palette.slate70};
`;

const TasksDescription = styled(Caption)`
  margin-bottom: ${rem(spacing.lg)};
`;

const TaskCategoryPill = styled(Pill).attrs({
  color: palette.slate10,
})`
  cursor: pointer;
  color: ${palette.slate85};
`;

const TaskCategories = styled.div`
  display: flex;
`;

const TaskAggregateCount = styled.span`
  color: ${palette.signal.links};
`;

const Divider = styled.hr`
  margin: ${rem(spacing.md)} 0;
  height: 1px;
  border: none;
  background-color: ${palette.slate20};
`;

const TaskClient = styled.div`
  display: flex;
  align-items: center;
  margin-top: ${rem(spacing.md)};
  cursor: pointer;
`;

const TaskClientItem = styled.div`
  margin-left: ${rem(spacing.md)};
`;

const TaskClientTasksCount = styled(Sans12)`
  display: inline-block;
  margin-left: 0.5rem;
`;

export const TaskDueDate = styled(Sans12)<{
  overdue: boolean;
  marginLeft?: string;
}>(
  ({ overdue, marginLeft = "auto" }) => `
  color: ${overdue ? palette.signal.error : palette.slate70};
  margin-left: ${marginLeft};
`
);

const TaskClientName = styled(Sans16).attrs({ as: "span" })`
  color: ${palette.pine4};
  &:hover,
  &:focus {
    cursor: pointer;
  }
`;

type TaskListItemProps = {
  person: JusticeInvolvedPerson;
  task?: SupervisionTask<SupervisionTaskType>;
};

const TaskListItem: React.FC<TaskListItemProps> = observer(
  function TaskListItem({ person, task }: TaskListItemProps) {
    const { workflowsStore } = useRootStore();
    const orderedTasks = person.supervisionTasks?.orderedTasks ?? [];
    const taskToDisplay = task || orderedTasks[0];
    if (!taskToDisplay) {
      return null;
    }
    return (
      <TaskListTooltip person={person} tasks={orderedTasks}>
        <TaskClient
          onClick={() =>
            workflowsStore.updateSelectedPerson(person.pseudonymizedId)
          }
        >
          <JusticeInvolvedPersonAvatar name={person.displayName} size={24} />
          <TaskClientItem>
            <TaskClientName>{person.displayName}</TaskClientName>
            <TaskClientTasksCount>
              {task ? null : simplur`${orderedTasks.length} task[|s]`}
            </TaskClientTasksCount>
          </TaskClientItem>
          <TaskDueDate overdue={taskToDisplay.isOverdue}>
            {taskToDisplay.displayName} due {taskToDisplay.dueDateFromToday}
          </TaskDueDate>
        </TaskClient>
      </TaskListTooltip>
    );
  }
);

const NeedListItem: React.FC<TaskListItemProps> = observer(
  function NeedListItem({ person, task }: TaskListItemProps) {
    const { workflowsStore } = useRootStore();
    const orderedTasks = person.supervisionTasks?.orderedTasks ?? [];

    return (
      <TaskListTooltip person={person} tasks={orderedTasks}>
        <TaskClient
          onClick={() =>
            workflowsStore.updateSelectedPerson(person.pseudonymizedId)
          }
        >
          <JusticeInvolvedPersonAvatar name={person.displayName} size={32} />
          <TaskClientItem>
            <TaskClientName>{person.displayName}</TaskClientName>
            <TaskClientTasksCount>
              {orderedTasks.length > 0 &&
                simplur` ${orderedTasks.length} task[|s]`}
            </TaskClientTasksCount>
          </TaskClientItem>
        </TaskClient>
      </TaskListTooltip>
    );
  }
);

type TaskCalendarHeadingProps = {
  dueDate: Date;
};

const TaskCalendarHeading: React.FC<TaskCalendarHeadingProps> = ({
  dueDate,
}) => {
  return (
    <>
      <Divider />
      <Sans14>
        {moment(dueDate).format("MMM. D")} &bull;{" "}
        {moment(dueDate).format("dddd")}
      </Sans14>
    </>
  );
};

type TasksCalendarViewProps = {
  type: SupervisionTaskType;
};

const TasksCalendarView: React.FC<TasksCalendarViewProps> = observer(
  function CalendarTasksViewComponent({ type }) {
    const {
      workflowsStore: { workflowsTasksStore: store },
    } = useRootStore();

    if (store.selectedCategory === "DUE_THIS_MONTH") {
      return null;
    }

    const tasks = store.orderedTasksByCategory[type];

    const calendar = [] as ReactNode[];

    let previous: SupervisionTask<SupervisionTaskType> | null = null;
    for (let index = 0; index < tasks.length; index += 1) {
      const task = tasks[index];

      if (task.isOverdue && !previous) {
        calendar.push(
          <div key="overdue-divider">
            <Divider />
            <Sans14>Overdue</Sans14>
          </div>
        );
      } else if (
        !previous ||
        (!task.isOverdue &&
          !moment(task.dueDate).isSame(previous.dueDate, "day"))
      ) {
        calendar.push(
          <TaskCalendarHeading
            dueDate={task.dueDate}
            key={task.dueDate.toDateString()}
          />
        );
      }

      calendar.push(
        <TaskListItem
          person={task.person}
          key={task.person.recordId}
          task={task}
        />
      );

      previous = task;
    }

    return <>{calendar}</>;
  }
);

const AllTasksView = observer(function AllTasksViewComponent() {
  const {
    workflowsStore: { workflowsTasksStore: store },
  } = useRootStore();

  const [personsWithOverdueTasks, personsWithUpcomingTasks] =
    store.clientsPartitionedByStatus;

  return (
    <>
      {personsWithOverdueTasks.length ? (
        <>
          <Divider />
          <Sans14>Overdue</Sans14>
          {personsWithOverdueTasks.map((person) => (
            <TaskListItem person={person} key={person.recordId} />
          ))}
        </>
      ) : null}
      {personsWithUpcomingTasks.length ? (
        <>
          <Divider />
          <Sans14>Due this month</Sans14>
          {personsWithUpcomingTasks.map((person) => (
            <TaskListItem person={person} key={person.recordId} />
          ))}
        </>
      ) : null}
    </>
  );
});

type NeedsViewProps = {
  type: SupervisionNeedType;
};

const AllNeedsView: React.FC<NeedsViewProps> = observer(
  function AllNeedsViewComponent({ type }) {
    const {
      workflowsStore: { workflowsTasksStore: store },
    } = useRootStore();

    return (
      <>
        <Divider />
        {store.orderedPersonsByNeed[type].map((person) => (
          <NeedListItem person={person} key={person.recordId} />
        ))}
      </>
    );
  }
);

const LIST_VIEWS_BY_CATEGORY = {
  DUE_THIS_MONTH: <AllTasksView />,
  assessment: <TasksCalendarView type="assessment" />,
  contact: <TasksCalendarView type="contact" />,
  homeVisit: <TasksCalendarView type="homeVisit" />,
  employment: <AllNeedsView type="employment" />,
} as Record<SupervisionTaskCategory, JSX.Element>;

const WorkflowsTasks = observer(function WorkflowsTasksComponent() {
  const {
    workflowsStore: {
      workflowsTasksStore: store,
      justiceInvolvedPersonTitle,
      selectedSearchIds,
      workflowsSearchFieldTitle,
    },
  } = useRootStore();

  const COUNTS_BY_CATEGORY = {
    DUE_THIS_MONTH: (s) => {
      const [overdue, upcoming] = s.clientsPartitionedByStatus;
      return overdue.length + upcoming.length;
    },
    assessment: (s) => s.orderedTasksByCategory.assessment.length,
    contact: (s) => s.orderedTasksByCategory.contact.length,
    homeVisit: (s) => s.orderedTasksByCategory.homeVisit.length,
    employment: (s) => s.orderedPersonsByNeed.employment.length,
  } as Record<SupervisionTaskCategory, (s: WorkflowsTasksStore) => number>;

  const empty = (
    <WorkflowsResults
      callToActionText={simplur`None of the ${justiceInvolvedPersonTitle}s on the selected ${[
        selectedSearchIds.length,
      ]} ${pluralizeWord(
        workflowsSearchFieldTitle,
        selectedSearchIds.length
      )}['s|'] caseloads have any tasks. Search for another ${workflowsSearchFieldTitle}.`}
    />
  );

  const initial = (
    <WorkflowsResults
      headerText="Tasks"
      callToActionText="Search for officers above to review clients who have upcoming or overdue tasks."
    />
  );

  return (
    <WorkflowsNavLayout>
      <CaseloadSelect />
      <CaseloadTasksHydrator
        initial={initial}
        empty={empty}
        hydrated={
          <>
            <TasksHeader>Tasks</TasksHeader>
            <TasksDescription>
              The clients below might have upcoming requirements this month.
            </TasksDescription>

            <TaskCategories>
              {getEntries(COUNTS_BY_CATEGORY).map(([category, getCount]) => {
                return (
                  <TaskCategoryPill
                    key={category}
                    filled={category === store.selectedCategory}
                    onClick={() => store.toggleSelectedTaskCategory(category)}
                  >
                    <Caption>
                      {TASK_SELECTOR_LABELS[category]}{" "}
                      <TaskAggregateCount>{getCount(store)}</TaskAggregateCount>
                    </Caption>
                  </TaskCategoryPill>
                );
              })}
            </TaskCategories>

            {LIST_VIEWS_BY_CATEGORY[store.selectedCategory]}
            <TaskPreviewModal />
          </>
        }
      />
    </WorkflowsNavLayout>
  );
});

export { WorkflowsTasks };
