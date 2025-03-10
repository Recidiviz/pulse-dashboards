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

import { observer } from "mobx-react-lite";
import React from "react";

import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import { CaseloadTasksPresenter } from "../../WorkflowsStore/presenters/CaseloadTasksPresenter";
import { AllTasksView } from "./AllTasksView";
import { TASK_SELECTOR_LABELS } from "./fixtures";
import {
  TaskAggregateCount,
  TaskCategories,
  TaskCategoryPill,
  TasksBodyContainer,
  TasksCaption,
  TasksDescription,
  TasksHeader,
} from "./styles";
import { TaskPreviewModal } from "./TaskPreviewModal";
import { TasksCalendarView } from "./TasksCalendarView";

function getViewElement(presenter: CaseloadTasksPresenter) {
  switch (presenter.selectedTaskCategory) {
    case "employmentNeed":
      return null;
    case "ALL_TASKS_OLD":
      return <AllTasksView presenter={presenter} />;
    default:
      return <TasksCalendarView presenter={presenter} />;
  }
}

export const ManagedComponent = observer(function WorkflowsTaskBody({
  presenter,
}: {
  presenter: CaseloadTasksPresenter;
}) {
  return (
    <TasksBodyContainer>
      <TasksHeader>Tasks</TasksHeader>
      <TasksDescription>
        The clients below might have upcoming requirements this month.
      </TasksDescription>

      <TaskCategories>
        {presenter.displayedTaskCategories.map((category) => {
          return (
            <TaskCategoryPill
              key={category}
              filled={category === presenter.selectedTaskCategory}
              onClick={() => presenter.toggleSelectedTaskCategory(category)}
            >
              <TasksCaption>
                {TASK_SELECTOR_LABELS[category]}{" "}
                <TaskAggregateCount>
                  {presenter.countForCategory(category)}
                </TaskAggregateCount>
              </TasksCaption>
            </TaskCategoryPill>
          );
        })}
      </TaskCategories>

      {getViewElement(presenter)}
      <TaskPreviewModal />
    </TasksBodyContainer>
  );
});

function usePresenter() {
  const { workflowsStore, analyticsStore, tenantStore } = useRootStore();
  return new CaseloadTasksPresenter(
    workflowsStore,
    tenantStore,
    analyticsStore,
  );
}

export const WorkflowsTasksBody = withPresenterManager({
  usePresenter,
  managerIsObserver: true,
  ManagedComponent,
});
