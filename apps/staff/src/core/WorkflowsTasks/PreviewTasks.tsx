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
  Sans14,
  Sans16,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import StopwatchIcon from "../../assets/static/images/stopwatch.svg?react";
import useIsMobile from "../../hooks/useIsMobile";
import { formatDate, formatWorkflowsDate } from "../../utils";
import { SupervisionTask } from "../../WorkflowsStore";
import { formatDateString } from "../models/utils";
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

const TaskItemWrapper = styled.div`
  min-height: ${rem(75)};
  padding: 1.5rem 0;
  position: relative;
`;

const TaskItemV2 = styled(Sans16)<{ showSnoozeDropdown?: boolean }>`
  display: grid;
  grid-template-columns: ${rem(175)} ${rem(175)} auto;
`;

const TaskInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const TaskFrequency = styled.div`
  font-size: ${rem(14)};
  margin-top: ${rem(6)};
`;

const TaskTimelineGroup = styled.div`
  display: grid;
  align-items: baseline;
  grid-template-rows: 1fr auto;
  grid-template-columns: ${rem(16)} auto;
  column-gap: ${rem(6)};
  row-gap: 0;
`;

const TaskTimelineIcon = styled.div`
  height: 100%;
  overflow: hidden;
`;

const TaskTimelineLineWrapper = styled.div`
  width: 100%;
  height: 100%;
  margin-top: ${rem(spacing.xs)};

  display: flex;
  justify-content: center;
`;

const TaskTimelineLine = styled.div`
  width: ${rem(1)};
  height: 100%;
  background-color: ${palette.slate60};
`;

const TaskTimelineText = styled.div`
  font-size: ${rem(14)};

  &:not(:last-child) {
    padding-bottom: ${rem(16)};
  }
`;

const TaskTimelineDueDate = styled.div<{ overdue: boolean }>`
  color: ${({ overdue }) => (overdue ? palette.signal.error : palette.pine4)};
`;

const SnoozedTaskIcon = styled.span`
  color: ${palette.slate60};
`;

const SnoozedTaskText = styled.span`
  color: ${palette.pine1};
`;

const SnoozedTaskInfoBox = styled.div`
  ${typography.Sans14}
  background-color: ${palette.marble4};
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;

  display: flex;
  flex-direction: row;
  gap: ${rem(10)};
`;

const TaskTimelineDonut = ({
  filled = false,
  lineBelow = false,
}: {
  filled?: boolean;
  lineBelow?: boolean;
}) => {
  return (
    <TaskTimelineIcon>
      <svg viewBox="0 0 14 14" aria-hidden={true}>
        <circle cx="50%" cy="50%" r="48%" fill={palette.slate20} />
        <circle
          cx="50%"
          cy="50%"
          r="25%"
          fill={filled ? palette.slate60 : "white"}
        />
      </svg>
      {lineBelow && (
        <TaskTimelineLineWrapper>
          <TaskTimelineLine />
        </TaskTimelineLineWrapper>
      )}
    </TaskTimelineIcon>
  );
};

const SnoozedTaskInfo = ({ task }: { task: SupervisionTask }) => {
  if (!task.isSnoozed || !task.snoozeInfo) return null;
  const { snoozedBy, snoozedUntil, snoozedOn } = task.snoozeInfo;

  const snoozeText = `This task will be hidden until ${formatWorkflowsDate(snoozedUntil)}. Marked as hidden by ${snoozedBy} on ${formatWorkflowsDate(formatDateString(snoozedOn))}.`;
  return (
    <SnoozedTaskInfoBox>
      <SnoozedTaskIcon>
        <StopwatchIcon />
      </SnoozedTaskIcon>
      <SnoozedTaskText>{snoozeText}</SnoozedTaskText>
    </SnoozedTaskInfoBox>
  );
};

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
          {task.snoozeInfo?.snoozedUntil && (
            <TaskSnoozedDate>
              {"Hidden from Tasks list until " +
                formatDate(task.snoozeInfo.snoozedUntil)}
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
      <TaskItemWrapper>
        <TaskItemV2>
          <TaskInfo>
            <TaskName>{task.displayName}</TaskName>
            <TaskFrequency>
              <i className="fa fa-refresh" /> {task.frequency}
            </TaskFrequency>
          </TaskInfo>

          <TaskTimelineGroup>
            <TaskTimelineDonut filled lineBelow />
            <TaskTimelineText>
              <div>{task.additionalDetails}</div>
            </TaskTimelineText>

            <TaskTimelineDonut />
            <TaskTimelineText>
              <TaskTimelineDueDate overdue={task.isOverdue}>
                {task.dueDateDisplayShort}
              </TaskTimelineDueDate>
            </TaskTimelineText>
          </TaskTimelineGroup>

          <SnoozeTaskDropdown
            task={task}
            taskConfig={
              task.person.supervisionTasks?.tasksConfig?.tasks[task.type]
            }
            operationsInfoInToast={false} // only for Texas
          />
        </TaskItemV2>
        <SnoozedTaskInfo task={task} />
      </TaskItemWrapper>
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
