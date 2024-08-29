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

import {
  palette,
  Pill,
  Sans12,
  Sans14,
  Sans16,
  Serif34,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import moment from "moment";
import { rem } from "polished";
import React, { ReactNode } from "react";
import simplur from "simplur";
import styled, { FlattenSimpleInterpolation } from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { pluralizeWord } from "../../utils";
import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import {
  SupervisionNeedType,
  SupervisionTask,
  SupervisionTaskType,
} from "../../WorkflowsStore/Task/types";
import { WorkflowsTasksStore } from "../../WorkflowsStore/Task/WorkflowsTasksStore";
import { getEntries } from "../../WorkflowsStore/utils";
import { PersonInitialsAvatar } from "../Avatar";
import { CaseloadSelect } from "../CaseloadSelect";
import { CaseloadTasksHydrator } from "../TasksHydrator/TasksHydrator";
import WorkflowsLastSynced from "../WorkflowsLastSynced";
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
  flex-wrap: wrap;
  row-gap: ${rem(spacing.sm)};
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
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  margin-right: ${rem(spacing.md)};
  min-width: fit-content;
`;

export const TaskDueDate = styled.div<{
  overdue: boolean;
  font: FlattenSimpleInterpolation;
  marginLeft?: string;
  isMobile?: boolean;
}>`
  ${({ font }) => font}
  color: ${({ overdue }) => (overdue ? palette.signal.error : palette.slate70)};
  margin-left: ${({ marginLeft = "auto" }) => marginLeft};
  text-align: right;
  ${({ isMobile }) => isMobile && `font-size: ${rem(12)} !important;`}
`;

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
    const { isMobile } = useIsMobile(true);
    const orderedTasks = person.supervisionTasks?.orderedTasks ?? [];
    const readyOrderedTasks = person.supervisionTasks?.readyOrderedTasks ?? [];
    const taskToDisplay = task || readyOrderedTasks[0];
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
          <TaskClientItem>
            <PersonInitialsAvatar name={person.displayName} size={24} />
            <div>
              <TaskClientName>{person.displayName}</TaskClientName>
              <Sans12>
                {task ? null : simplur`${orderedTasks.length} task[|s]`}
              </Sans12>
            </div>
          </TaskClientItem>
          <TaskDueDate
            font={typography.Sans14}
            overdue={taskToDisplay.isOverdue}
            isMobile={isMobile}
          >
            {taskToDisplay.dueDateDisplayLong}
          </TaskDueDate>
        </TaskClient>
      </TaskListTooltip>
    );
  },
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
          <PersonInitialsAvatar name={person.displayName} size={32} />
          <TaskClientItem>
            <TaskClientName>{person.displayName}</TaskClientName>
            <Sans12>
              {orderedTasks.length > 0 &&
                simplur` ${orderedTasks.length} task[|s]`}
            </Sans12>
          </TaskClientItem>
        </TaskClient>
      </TaskListTooltip>
    );
  },
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
    // Grab the last synced date from someone else in the state, since all dates are the same
    const lastSyncedDate =
      store.workflowsStore.caseloadPersons[0]?.lastDataFromState;

    const calendar = [] as ReactNode[];

    let previous: SupervisionTask<SupervisionTaskType> | null = null;
    for (let index = 0; index < tasks.length; index += 1) {
      const task = tasks[index];

      if (task.isOverdue && !previous) {
        calendar.push(
          <div key="overdue-divider">
            <Divider />
            <Sans14>Overdue</Sans14>
          </div>,
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
          />,
        );
      }

      calendar.push(
        <TaskListItem
          person={task.person}
          key={task.person.recordId}
          task={task}
        />,
      );

      previous = task;
    }

    return (
      <>
        {calendar}
        <WorkflowsLastSynced date={lastSyncedDate} />
      </>
    );
  },
);

const AllTasksView = observer(function AllTasksViewComponent() {
  const {
    workflowsStore: {
      workflowsTasksStore: { clientsPartitionedByStatus },
    },
  } = useRootStore();

  const [personsWithOverdueTasks, personsWithUpcomingTasks] =
    clientsPartitionedByStatus;

  const lastSynced = clientsPartitionedByStatus.flat()[0].lastDataFromState;

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
      <WorkflowsLastSynced date={lastSynced} />
    </>
  );
});

type NeedsViewProps = {
  type: SupervisionNeedType;
};

// This component is not currently in use since we aren't showing any needs,
// but I do not want to delete it since we may add new ones
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  },
);

const LIST_VIEWS_BY_CATEGORY = {
  DUE_THIS_MONTH: <AllTasksView />,
  assessment: <TasksCalendarView type="assessment" />,
  contact: <TasksCalendarView type="contact" />,
  homeVisit: <TasksCalendarView type="homeVisit" />,
  employment: <TasksCalendarView type="employment" />,
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
    employment: (s) => s.orderedTasksByCategory.employment.length,
  } as Record<SupervisionTaskCategory, (s: WorkflowsTasksStore) => number>;

  const empty = (
    <WorkflowsResults
      callToActionText={simplur`None of the ${justiceInvolvedPersonTitle}s on the selected ${[
        selectedSearchIds.length,
      ]} ${pluralizeWord(
        workflowsSearchFieldTitle,
        selectedSearchIds.length,
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
