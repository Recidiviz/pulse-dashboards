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

import { Sans12, Sans16, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import simplur from "simplur";
import styled from "styled-components/macro";

import { palette } from "~design-system";
import { PersonInitialsAvatar } from "~ui";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import {
  Client,
  JusticeInvolvedPerson,
  SupervisionTask,
  SupervisionTaskType,
} from "../../WorkflowsStore";
import PersonId from "../PersonId";
import { TaskFrequency } from "./TaskFrequency";
import { TaskListTooltip } from "./WorkflowsTasksTooltip";

const TaskClient = styled.div`
  display: flex;
  align-items: center;
  margin-top: ${rem(spacing.md)};
  cursor: pointer;
  justify-content: space-between;
`;

const TaskClientItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  margin-right: ${rem(spacing.md)};
  max-width: 66%;
`;

const TaskClientName = styled(Sans16).attrs({ as: "span" })`
  color: ${palette.pine4};
  &:hover,
  &:focus {
    cursor: pointer;
  }
`;

const TaskListPersonId = styled.span`
  font-size: ${rem(16)};
`;

const TaskPersonDetails = styled.div<{ isMobile: boolean }>`
  display: flex;
  flex-direction: ${({ isMobile }) => (isMobile ? "column" : "row")};
  gap: ${({ isMobile }) => rem(isMobile ? 2 : 8)};
`;

const DueDateText = styled(Sans12)<{ overdue: boolean }>`
  color: ${({ overdue }) => (overdue ? palette.signal.error : palette.pine4)};
`;

function TaskDueDate({ task }: { task: SupervisionTask }) {
  return (
    <DueDateText overdue={task.isOverdue}>
      {task.dueDateDisplayLong}
    </DueDateText>
  );
}

const TaskFrequencyDetails = styled.div<{ isMobile: boolean }>`
  display: flex;
  flex-direction: ${({ isMobile }) => (isMobile ? "column" : "row")};
  font-size: 12px;
  gap: ${({ isMobile }) => (isMobile ? "2px" : "12px")};
  align-items: ${({ isMobile }) => (isMobile ? "flex-end" : "center")};
  color: ${palette.slate80};
`;

type TaskListItemProps = {
  person: JusticeInvolvedPerson;
  task?: SupervisionTask<SupervisionTaskType>;
};

export const TaskListItemV2: React.FC<TaskListItemProps> = observer(
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
            {!isMobile && (
              <PersonInitialsAvatar
                name={person.displayName}
                size={38}
                solidColor={palette.slate30}
              />
            )}
            <div>
              <TaskClientName>{person.displayName}</TaskClientName>
              <PersonId
                personId={person.displayId}
                pseudoId={person.pseudonymizedId}
              >
                <TaskListPersonId> {person.displayId}</TaskListPersonId>
              </PersonId>
              <TaskPersonDetails isMobile={isMobile}>
                <Sans12>
                  {(person as Client).caseType},{" "}
                  {(person as Client).supervisionLevel}
                </Sans12>
                <TaskDueDate task={taskToDisplay} />
              </TaskPersonDetails>
            </div>
          </TaskClientItem>
          <TaskFrequencyDetails isMobile={isMobile}>
            <div>{task ? null : simplur`${orderedTasks.length} task[|s]`}</div>
            {!isMobile && <div>•</div>}
            <TaskFrequency task={taskToDisplay} />
          </TaskFrequencyDetails>
        </TaskClient>
      </TaskListTooltip>
    );
  },
);
