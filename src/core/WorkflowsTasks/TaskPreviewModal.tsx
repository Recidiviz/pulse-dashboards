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
import React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import {
  SupervisionNeed,
  SupervisionTask,
  SupervisionTaskType,
} from "../../WorkflowsStore/Task/types";
import { Milestones, Supervision } from "../WorkflowsClientProfile/Details";
import { Heading } from "../WorkflowsClientProfile/Heading";
import { OpportunitiesAccordion } from "../WorkflowsClientProfile/OpportunitiesAccordion";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import { NEED_DISPLAY_NAME, TASK_DISPLAY_NAME } from "./fixtures";
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

const Divider = styled.hr`
  border-color: ${palette.slate10};
  border-style: solid;
  margin: 0 -1.5rem;
`;

const TaskName = styled(Sans16)`
  color: ${palette.pine1};
`;

const TaskDivider = styled(Sans16)`
  color: ${palette.pine1};
  margin: 0 0.5rem;
`;

const PreviewTasks = function PreviewTasks({
  tasks,
  needs,
}: {
  tasks: SupervisionTask<SupervisionTaskType>[];
  needs: SupervisionNeed[];
}) {
  if (!tasks.length && !needs.length) return null;
  return (
    <TasksWrapper>
      <TaskItems>
        {tasks.map((task) => {
          return (
            <TaskItem>
              <TaskName>{TASK_DISPLAY_NAME[task.type]}</TaskName>
              <TaskDivider> &bull; </TaskDivider>
              <TaskDueDate marginLeft="0" overdue={task.isOverdue}>
                Due {task.dueDateFromToday}
              </TaskDueDate>
            </TaskItem>
          );
        })}
        {needs.map((need) => {
          return (
            <TaskItem>
              <TaskName>{NEED_DISPLAY_NAME[need.type]}</TaskName>
            </TaskItem>
          );
        })}
      </TaskItems>
    </TasksWrapper>
  );
};

export const TaskPreviewModal = observer(function TaskPreviewModal() {
  const {
    workflowsStore: { selectedClient },
  } = useRootStore();

  if (!selectedClient) return null;

  return (
    <WorkflowsPreviewModal
      isOpen={!!selectedClient}
      onAfterOpen={() => selectedClient.supervisionTasks?.trackPreviewed()}
      pageContent={
        <article>
          <Heading person={selectedClient} />
          <OpportunitiesAccordion hideEmpty person={selectedClient} />
          {Object.values(selectedClient.verifiedOpportunities).length ? null : (
            <Divider />
          )}
          <PreviewTasks
            tasks={selectedClient.supervisionTasks?.orderedTasks ?? []}
            needs={selectedClient.supervisionTasks?.needs ?? []}
          />
          <Supervision client={selectedClient} />
          <Milestones client={selectedClient} />
        </article>
      }
    />
  );
});
