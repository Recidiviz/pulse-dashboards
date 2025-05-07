// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { withPresenterManager } from "~hydration-utils";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import { TableViewToggle } from "../OpportunityCaseloadView/TableViewToggle";
import { MaxWidth } from "../sharedComponents";
import WorkflowsCaseloadTabs from "../WorkflowsCaseloadControlBar";
import { WorkflowsUnderstaffedPill } from "../WorkflowsUnderstaffed";
import { SupervisionTaskCategory, TASK_SELECTOR_LABELS } from "./fixtures";
import { TasksDescription } from "./styles";
import { TasksHeader } from "./styles";
import { TaskFilterDropdown } from "./TaskFilterDropdown";
import { TaskPreviewModal } from "./TaskPreviewModal";
import { TasksList } from "./TasksList";
import { TasksTable } from "./TasksTable";

// TODO(#7571): Add Noir/Cool Grey to design system
const TasksTabUnderline = styled.div`
  border-bottom: #00113326 1px solid;
`;

const TasksTopbarContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  ${MaxWidth}
`;

const TableControls = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${rem(8)};
`;

export const ManagedComponent = observer(function WorkflowsTasksBodyV2({
  presenter,
}: {
  presenter: CaseloadTasksPresenterV2;
}) {
  return (
    <>
      <TasksHeader>
        Tasks
        <WorkflowsUnderstaffedPill />
      </TasksHeader>

      <TasksTopbarContainer>
        <TasksDescription>{presenter.pageDescription}</TasksDescription>
        <TableControls>
          <TableViewToggle presenter={presenter} />
          <TaskFilterDropdown presenter={presenter} />
        </TableControls>
      </TasksTopbarContainer>
      {presenter.showListView ? (
        <TasksList presenter={presenter} />
      ) : (
        <>
          <TasksTabUnderline>
            <WorkflowsCaseloadTabs
              tabs={presenter.displayedTaskCategories}
              tabLabels={TASK_SELECTOR_LABELS}
              tabBadges={{
                ALL_TASKS: presenter.countForCategory("ALL_TASKS"),
                OVERDUE: presenter.countForCategory("OVERDUE"),
                DUE_THIS_WEEK: presenter.countForCategory("DUE_THIS_WEEK"),
                DUE_THIS_MONTH: presenter.countForCategory("DUE_THIS_MONTH"),
              }}
              activeTab={presenter.selectedTaskCategory}
              setActiveTab={(tab: SupervisionTaskCategory) => {
                runInAction(() => {
                  presenter.selectedTaskCategory = tab;
                });
              }}
            />
          </TasksTabUnderline>
          <TasksTable presenter={presenter} />
        </>
      )}
      <TaskPreviewModal presenter={presenter} />
    </>
  );
});

function usePresenter() {
  const { workflowsStore, analyticsStore, tenantStore, firestoreStore } =
    useRootStore();
  const featureVariants = useFeatureVariants();
  return new CaseloadTasksPresenterV2(
    workflowsStore,
    tenantStore,
    analyticsStore,
    firestoreStore,
    featureVariants,
  );
}

export const WorkflowsTasksBodyV2 = withPresenterManager({
  usePresenter,
  managerIsObserver: true,
  ManagedComponent,
});
