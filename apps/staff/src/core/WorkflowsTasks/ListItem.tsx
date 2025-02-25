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
  Sans12,
  Sans16,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import simplur from "simplur";
import styled from "styled-components/macro";

import { PersonInitialsAvatar } from "~ui";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import {
  JusticeInvolvedPerson,
  SupervisionTask,
  SupervisionTaskType,
} from "../../WorkflowsStore";
import { TaskDueDate } from "./styles";
import { TaskListTooltip } from "./WorkflowsTasksTooltip";

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

export const TaskListItem: React.FC<TaskListItemProps> = observer(
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

export const NeedListItem: React.FC<TaskListItemProps> = observer(
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
