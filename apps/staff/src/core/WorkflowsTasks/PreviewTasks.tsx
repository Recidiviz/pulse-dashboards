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

import { palette, Sans14, Sans16, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import useIsMobile from "../../hooks/useIsMobile";
import { formatDate } from "../../utils";
import { SupervisionTask } from "../../WorkflowsStore";
import { PersonProfileProps } from "../WorkflowsJusticeInvolvedPersonProfile/types";
import { NEED_DISPLAY_NAME } from "./fixtures";
import { SnoozeTaskDropdown } from "./SnoozeTaskDropdown";
import { TaskDueDate } from "./styles";
import { TaskItemDivider } from "./TaskPreviewModal";

const TasksWrapper = styled.div``;
const TaskItems = styled.div`
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
`;

const TaskTitle = styled.div<{ isMobile: boolean }>`
  display: flex;
  flex-flow: row ${({ isMobile }) => (isMobile ? "wrap" : "nowrap")};
  justify-content: flex-start;
  align-items: center;
  align-self: flex-start;

  & > div {
    font-size: ${rem(14)};
  }
`;

const TaskItem = styled(Sans16)<{ showSnoozeDropdown?: boolean }>`
  min-height: ${rem(75)};
  padding: 1.5rem 0;
  display: grid;
  grid-template-columns: 5fr ${({ showSnoozeDropdown }) =>
      showSnoozeDropdown ? "1fr" : "auto"};
  align-content: center;
  position: relative;
`;

const TaskName = styled(Sans16)`
  color: ${palette.pine1};
  min-width: fit-content;
`;

const TaskDivider = styled(Sans16)`
  color: ${palette.pine1};
  margin: 0 0.5rem;
`;

const TaskDetails = styled(Sans14)`
  color: rgba(53, 83, 98, 0.9);
  align-self: flex-start;
  padding: 0.5rem 0 0 0;
  white-space: pre-line;
`;

const TaskContent = styled.div`
  display: flex;
  flex-flow: column;
  justify-content: center;
  align-items: flex-start;
  grid-column-start: 1;
`;

const TaskSnoozedDate = styled(Sans14)`
  color: ${palette.slate70};
  line-height: 2;
`;

const TaskItemV2 = styled(Sans16)<{ showSnoozeDropdown?: boolean }>`
  min-height: ${rem(75)};
  padding: 1.5rem 0;
  display: grid;
  grid-template-columns: 180px 180px auto;
  align-content: center;
  position: relative;
`;

const TaskInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const TaskFrequency = styled.div`
  font-size: ${rem(12)};
  margin-top: ${rem(6)};
`;

const TaskTimeline = styled.div`
  font-size: ${rem(12)};
  display: flex;
  flex-direction: column;
  gap: ${rem(16)};
`;

const TaskTimelineDueDate = styled.div<{ overdue: boolean }>`
  color: ${({ overdue }) => (overdue ? palette.signal.error : palette.pine4)};
`;

const TaskPreview = ({
  task,
  showSnoozeDropdown,
}: {
  task: SupervisionTask;
  showSnoozeDropdown: boolean;
}) => {
  const { isMobile } = useIsMobile(true);
  return (
    <div key={task.key}>
      <TaskItem showSnoozeDropdown={showSnoozeDropdown}>
        <TaskContent>
          <TaskTitle isMobile={isMobile}>
            <TaskName>{task.displayName}</TaskName>
            <TaskDivider> &bull; </TaskDivider>
            <TaskDueDate
              font={typography.Sans16}
              marginLeft="0"
              overdue={task.isOverdue && !task.isSnoozed}
              title={task.dueDateDisplayShort}
              isMobile={isMobile}
            >
              {task.dueDateDisplayShort}
            </TaskDueDate>
          </TaskTitle>
          {task.snoozedUntil && (
            <TaskSnoozedDate>
              {"Hidden from Tasks list until " + formatDate(task.snoozedUntil)}
            </TaskSnoozedDate>
          )}
          <TaskDetails>{task.additionalDetails}</TaskDetails>
        </TaskContent>
        {showSnoozeDropdown && (
          <SnoozeTaskDropdown
            task={task}
            taskConfig={
              task.person.supervisionTasks?.tasksConfig?.tasks[task.type]
            }
            operationsInfoInToast={true}
          />
        )}
      </TaskItem>
      <TaskItemDivider />
    </div>
  );
};

const TaskPreviewV2 = ({ task }: { task: SupervisionTask }) => {
  return (
    <>
      <TaskItemV2>
        <TaskInfo>
          <TaskName>{task.displayName}</TaskName>
          <TaskFrequency>
            <i className="fa fa-refresh" /> {task.frequency}
          </TaskFrequency>
        </TaskInfo>
        <TaskTimeline>
          <div>{task.additionalDetails}</div>
          <TaskTimelineDueDate overdue={task.isOverdue}>
            {task.dueDateDisplayShort}
          </TaskTimelineDueDate>
        </TaskTimeline>
        <SnoozeTaskDropdown
          task={task}
          taskConfig={
            task.person.supervisionTasks?.tasksConfig?.tasks[task.type]
          }
          operationsInfoInToast={false} // only for Texas
        />
      </TaskItemV2>
      <TaskItemDivider />
    </>
  );
};

export const PreviewTasks = observer(function PreviewTasks({
  person,
  showSnoozeDropdown,
}: PersonProfileProps & { showSnoozeDropdown: boolean }) {
  const tasks = person.supervisionTasks?.orderedTasks ?? [];
  const needs = person.supervisionTasks?.needs ?? [];

  if (!tasks.length && !needs.length) return null;

  return (
    <TasksWrapper>
      <TaskItems>
        {tasks.map((task) => {
          if (person.stateCode === "US_ID")
            return (
              <TaskPreview
                task={task}
                showSnoozeDropdown={showSnoozeDropdown}
              />
            );
          return <TaskPreviewV2 task={task} key={task.key} />;
        })}
        {needs.map((need) => {
          return (
            <div key={`${need.type}`}>
              <TaskItem key={need.type}>
                <TaskName>{NEED_DISPLAY_NAME[need.type]}</TaskName>
              </TaskItem>
              <TaskItemDivider />
            </div>
          );
        })}
      </TaskItems>
    </TasksWrapper>
  );
});
