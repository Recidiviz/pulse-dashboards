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

import { observer } from "mobx-react-lite";
import React from "react";
import simplur from "simplur";

import { useRootStore } from "../../components/StoreProvider";
import { pluralizeWord } from "../../utils";
import { CaseloadTasksPresenter } from "../../WorkflowsStore/presenters/CaseloadTasksPresenter";
import { CaseloadSelect } from "../CaseloadSelect";
import { CaseloadTasksHydrator } from "../TasksHydrator/TasksHydrator";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import WorkflowsResults from "../WorkflowsResults";
import { WorkflowsTasksBody } from "./WorkflowsTasksBody";
import { WorkflowsTasksBodyV2 } from "./WorkflowsTasksBodyV2";

const WorkflowsTasksWithPresenter = observer(
  function WorkflowsTasksWithPresenter({
    presenter,
  }: {
    presenter: CaseloadTasksPresenter;
  }) {
    const {
      workflowsStore: {
        justiceInvolvedPersonTitle,
        searchStore: { workflowsSearchFieldTitle, selectedSearchIds },
      },
      currentTenantId,
    } = useRootStore();

    const empty = (
      <WorkflowsResults
        callToActionText={simplur`None of the ${justiceInvolvedPersonTitle}s on the selected ${[
          selectedSearchIds.length,
        ]} ${pluralizeWord(
          workflowsSearchFieldTitle,
          selectedSearchIds.length,
        )}['s|'] caseloads have any tasks. Search for another ${workflowsSearchFieldTitle}.`}
      />
    );

    const initial = (
      <WorkflowsResults
        headerText="Tasks"
        callToActionText="Search for officers above to review clients who have upcoming or overdue tasks."
      />
    );

    return (
      <WorkflowsNavLayout>
        <CaseloadSelect />
        <CaseloadTasksHydrator
          initial={initial}
          empty={empty}
          hydrated={
            currentTenantId === "US_ID" ? (
              <WorkflowsTasksBody presenter={presenter} />
            ) : (
              <WorkflowsTasksBodyV2 presenter={presenter} />
            )
          }
        />
      </WorkflowsNavLayout>
    );
  },
);

const WorkflowsTasks = React.memo(function WorkflowsTasks() {
  const { workflowsStore, analyticsStore, tenantStore } = useRootStore();

  return (
    <WorkflowsTasksWithPresenter
      presenter={
        new CaseloadTasksPresenter(workflowsStore, tenantStore, analyticsStore)
      }
    />
  );
});

export { WorkflowsTasks };
