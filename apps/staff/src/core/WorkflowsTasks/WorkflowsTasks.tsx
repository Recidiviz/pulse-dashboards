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
import simplur from "simplur";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { pluralizeWord } from "../../utils";
import { CaseloadSelect } from "../CaseloadSelect";
import { MaxWidthWithSidebar } from "../sharedComponents";
import { CaseloadTasksHydrator } from "../TasksHydrator/TasksHydrator";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import WorkflowsResults from "../WorkflowsResults";
import { TasksBodyContainer } from "./styles";
import { WorkflowsTasksBody } from "./WorkflowsTasksBody";
import { WorkflowsTasksBodyV2 } from "./WorkflowsTasksBodyV2";

const CaseloadSelectWrapper = styled.div`
  ${MaxWidthWithSidebar}
`;

const WorkflowsTasks = observer(function WorkflowsTasks() {
  const {
    workflowsStore: {
      justiceInvolvedPersonTitle,
      searchStore: { workflowsSearchFieldTitle, selectedSearchIds },
    },
    currentTenantId,
  } = useRootStore();

  const empty = (
    <TasksBodyContainer>
      <WorkflowsResults
        callToActionText={simplur`None of the ${justiceInvolvedPersonTitle}s on the selected ${[
          selectedSearchIds.length,
        ]} ${pluralizeWord({
          term: workflowsSearchFieldTitle,
          count: selectedSearchIds.length,
        })}['s|'] caseloads have any tasks. Search for another ${workflowsSearchFieldTitle}.`}
      />
    </TasksBodyContainer>
  );

  const initial = (
    <TasksBodyContainer>
      <WorkflowsResults
        headerText="Tasks"
        callToActionText={`Search for ${workflowsSearchFieldTitle}s above to review ${justiceInvolvedPersonTitle}s who have upcoming or overdue tasks.`}
      />
    </TasksBodyContainer>
  );

  return (
    <WorkflowsNavLayout limitedWidth={currentTenantId === "US_ID"}>
      <CaseloadSelectWrapper>
        <CaseloadSelect />
      </CaseloadSelectWrapper>
      <CaseloadTasksHydrator
        initial={initial}
        empty={empty}
        hydrated={
          currentTenantId === "US_ID" ? (
            <WorkflowsTasksBody />
          ) : (
            <WorkflowsTasksBodyV2 />
          )
        }
      />
    </WorkflowsNavLayout>
  );
});

export { WorkflowsTasks };
