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

import { palette, Sans14, Sans16 } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { PersonProfileProps } from "../WorkflowsClientProfile/types";
import { NEED_DISPLAY_NAME } from "./fixtures";
import { SnoozeTaskDropdown } from "./SnoozeTaskDropdown";
import { Divider } from "./TaskPreviewModal";
import { TaskDueDate } from "./WorkflowsTasks";

const TasksWrapper = styled.div``;
const TaskItems = styled.div`
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
`;

const TaskTitle = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  align-self: flex-start;
`;

const TaskItem = styled(Sans16)`
  min-height: ${rem(75)};
  padding: 0.25rem 0;
  display: grid;
  grid-template-columns: 5fr 1fr;
`;

const TaskName = styled(Sans16)`
  color: ${palette.pine1};
`;

const TaskDivider = styled(Sans16)`
  color: ${palette.pine1};
  margin: 0 0.5rem;
`;

const TaskDetails = styled(Sans14)`
  color: rgba(53, 83, 98, 0.9);
  align-self: flex-start;
  padding: 0.25rem 0;
  white-space: pre-line;
`;

const TaskContent = styled.div`
  display: flex;
  flex-flow: column;
  justify-content: center;
  align-items: left;
  grid-column-start: 1;
`;

export const PreviewTasks = observer(function PreviewTasks({
  person,
  showSnoozeDropdown,
}: PersonProfileProps & { showSnoozeDropdown: boolean }) {
  const tasks = person.supervisionTasks?.orderedTasks ?? [];
  const needs = person.supervisionTasks?.needs ?? [];
  const snoozeTasksConfig = person.supervisionTasks?.snoozeTasksConfig;

  if (!tasks.length && !needs.length) return null;

  return (
    <TasksWrapper>
      <TaskItems>
        {tasks.map((task) => {
          return (
            <div key={`${task.type}-${task.person.externalId}`}>
              <TaskItem>
                <TaskContent>
                  <TaskTitle>
                    <TaskName>{task.displayName}</TaskName>
                    <TaskDivider> &bull; </TaskDivider>
                    <TaskDueDate marginLeft="0" overdue={task.isOverdue}>
                      {task.dueDateDisplayShort}
                    </TaskDueDate>
                  </TaskTitle>
                  <TaskDetails>{task.additionalDetails}</TaskDetails>
                </TaskContent>
                {showSnoozeDropdown && (
                  <SnoozeTaskDropdown
                    task={task}
                    snoozeTasksConfig={snoozeTasksConfig?.[task.type]}
                  />
                )}
              </TaskItem>
              <Divider />
            </div>
          );
        })}
        {needs.map((need) => {
          return (
            <TaskItem key={need.type}>
              <TaskName>{NEED_DISPLAY_NAME[need.type]}</TaskName>
            </TaskItem>
          );
        })}
      </TaskItems>
    </TasksWrapper>
  );
});
