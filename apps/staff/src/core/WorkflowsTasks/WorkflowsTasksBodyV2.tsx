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

import { CaseloadTasksPresenter } from "../../WorkflowsStore/presenters/CaseloadTasksPresenter";
import WorkflowsCaseloadTabs from "../WorkflowsCaseloadControlBar";
import { SupervisionTaskCategory, TASK_SELECTOR_LABELS } from "./fixtures";
import { TasksDescription } from "./styles";
import { TasksHeader } from "./styles";

export const WorkflowsTasksBodyV2 = observer(function WorkflowsTasksBodyV2({
  presenter,
}: {
  presenter: CaseloadTasksPresenter;
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
        tabs={presenter.displayedTemporalTaskCategories}
        tabLabels={TASK_SELECTOR_LABELS}
        tabBadges={{
          ALL_TASKS: 13,
          OVERDUE: 4,
          DUE_THIS_WEEK: 2,
          DUE_THIS_MONTH: 7,
        }}
        activeTab={presenter.selectedCategory}
        setActiveTab={(tab: SupervisionTaskCategory) => {
          runInAction(() => {
            presenter.selectedCategory = tab;
          });
        }}
      />
    </>
  );
});
