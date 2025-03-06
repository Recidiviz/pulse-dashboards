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
import React from "react";

import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import WorkflowsCaseloadTabs from "../WorkflowsCaseloadControlBar";
import { SupervisionTaskCategory, TASK_SELECTOR_LABELS } from "./fixtures";
import { TasksDescription } from "./styles";
import { TasksHeader } from "./styles";
import { TaskPreviewModal } from "./TaskPreviewModal";
import { TasksTable } from "./TasksTable";

export const ManagedComponent = observer(function WorkflowsTasksBodyV2({
  presenter,
}: {
  presenter: CaseloadTasksPresenterV2;
}) {
  return (
    <>
      <TasksHeader>Tasks</TasksHeader>
      <TasksDescription>
        The clients below might have upcoming requirements this month. Data is
        refreshed from the OMS overnight and daily. Where are these tasks pulled
        from?
      </TasksDescription>
      <WorkflowsCaseloadTabs
        tabs={presenter.displayedTaskCategories}
        tabLabels={TASK_SELECTOR_LABELS}
        tabBadges={{
          ALL_TASKS: presenter.countForCategory("ALL_TASKS"),
          OVERDUE: presenter.countForCategory("OVERDUE"),
          DUE_THIS_WEEK: presenter.countForCategory("DUE_THIS_WEEK"),
          DUE_THIS_MONTH: presenter.countForCategory("DUE_THIS_MONTH"),
        }}
        activeTab={presenter.selectedCategory}
        setActiveTab={(tab: SupervisionTaskCategory) => {
          runInAction(() => {
            presenter.selectedCategory = tab;
          });
        }}
      />
      <TasksTable presenter={presenter} />
      <TaskPreviewModal />
    </>
  );
});

function usePresenter() {
  const { workflowsStore, analyticsStore, tenantStore } = useRootStore();
  return new CaseloadTasksPresenterV2(
    workflowsStore,
    tenantStore,
    analyticsStore,
  );
}

export const WorkflowsTasksBodyV2 = withPresenterManager({
  usePresenter,
  managerIsObserver: true,
  ManagedComponent,
});
