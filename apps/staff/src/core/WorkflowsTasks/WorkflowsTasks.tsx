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
import styled from "styled-components";

import { useRootStore } from "../../components/StoreProvider";
import { CaseloadSelect } from "../CaseloadSelect";
import { MaxWidthWithSidebar } from "../sharedComponents";
import { CaseloadTasksHydrator } from "../TasksHydrator/TasksHydrator";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import WorkflowsResults, { WorkflowsResultsHeader } from "../WorkflowsResults";
import { TasksBodyContainer } from "./styles";
import { WorkflowsTasksBodyV2 } from "./WorkflowsTasksBodyV2";

const CaseloadSelectWrapper = styled.div`
  ${MaxWidthWithSidebar}
`;

const WorkflowsTasks = observer(function WorkflowsTasks() {
  const {
    workflowsStore: {
      justiceInvolvedPersonTitle,
      searchStore: {
        workflowsSearchFieldTitle,
        isTypesenseSearchEnabled,
        selectedSearchIds,
      },
    },
  } = useRootStore();

  const empty = (
    <TasksBodyContainer>
      <WorkflowsResults
        callToActionText={`None of the ${justiceInvolvedPersonTitle}s on the selected caseloads have any tasks. Search for another caseload.`}
      />
    </TasksBodyContainer>
  );

  const initialCta =
    isTypesenseSearchEnabled && workflowsSearchFieldTitle
      ? `Start typing the name of ${workflowsSearchFieldTitle} above to review ${justiceInvolvedPersonTitle}s who have upcoming or overdue tasks.`
      : `Search above to review ${justiceInvolvedPersonTitle}s who have upcoming or overdue tasks.`;

  const isInitial = !selectedSearchIds.length;

  const header = (
    <WorkflowsResultsHeader
      headerText={isInitial ? "Tasks" : undefined}
      callToActionText={isInitial ? initialCta : undefined}
      verticallyCentered={!isTypesenseSearchEnabled}
    />
  );

  return (
    <WorkflowsNavLayout limitedWidth={false}>
      {isTypesenseSearchEnabled && header}
      <CaseloadSelectWrapper>
        <CaseloadSelect />
      </CaseloadSelectWrapper>
      <CaseloadTasksHydrator
        initial={
          isTypesenseSearchEnabled ? null : (
            <TasksBodyContainer>{header}</TasksBodyContainer>
          )
        }
        empty={empty}
        hydrated={<WorkflowsTasksBodyV2 />}
      />
    </WorkflowsNavLayout>
  );
});

export { WorkflowsTasks };
