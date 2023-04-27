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

import { palette, Sans16 } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { PersonProfileProps } from "../WorkflowsClientProfile/types";
import { NEED_DISPLAY_NAME } from "./fixtures";
import { TaskDueDate } from "./WorkflowsTasks";

const TasksWrapper = styled.div`
  margin: 0 -1.5rem;
`;
const TaskItems = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

const TaskItem = styled(Sans16)`
  min-height: ${rem(75)};
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  padding-left: 1.5rem;

  &:nth-child(n + 1) {
    border-color: ${palette.slate10};
    border-bottom-style: solid;
    border-width: 1px 0;
  }
`;

const TaskName = styled(Sans16)`
  color: ${palette.pine1};
`;

const TaskDivider = styled(Sans16)`
  color: ${palette.pine1};
  margin: 0 0.5rem;
`;

export const PreviewTasks = observer(function PreviewTasks({
  person,
}: PersonProfileProps) {
  const tasks = person.supervisionTasks?.orderedTasks ?? [];
  const needs = person.supervisionTasks?.needs ?? [];
  if (!tasks.length && !needs.length) return null;
  return (
    <TasksWrapper>
      <TaskItems>
        {tasks.map((task) => {
          return (
            <TaskItem key={`${task.type}-${task.person.externalId}`}>
              <TaskName>{task.displayName}</TaskName>
              <TaskDivider> &bull; </TaskDivider>
              <TaskDueDate marginLeft="0" overdue={task.isOverdue}>
                Due {task.dueDateFromToday}
              </TaskDueDate>
            </TaskItem>
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
