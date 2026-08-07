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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React, { useMemo } from "react";
import styled from "styled-components";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import { CaseloadSelect } from "../CaseloadSelect";
import { TableViewToggle } from "../OpportunityCaseloadView/TableViewToggle";
import { MaxWidth, MaxWidthWithSidebar } from "../sharedComponents";
import { CaseloadTasksHydrator } from "../TasksHydrator/TasksHydrator";
import { WorkflowsFilterDropdown } from "../WorkflowsFilters/WorkflowsFilterDropdown";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import WorkflowsResults, { WorkflowsResultsHeader } from "../WorkflowsResults";
import { RoutePlannerLink } from "../WorkflowsTasksRoutePlanner/RoutePlannerLink";
import { WorkflowsUnderstaffedPill } from "../WorkflowsUnderstaffed";
import { TasksBodyContainer } from "./styles";
import { TasksDescriptionContent } from "./TasksDescription";
import { WorkflowsTasksBodyV2 } from "./WorkflowsTasksBodyV2";

const CaseloadSelectWrapper = styled.div`
  ${MaxWidthWithSidebar}
`;

const HeaderAndSearch = styled.div`
  ${MaxWidth}
`;

// Search bar and the table controls (list/table toggle + filter) on one row —
// the search bar grows to fill, pushing the controls to the right.
const SearchRow = styled.div`
  display: flex;
  gap: ${rem(spacing.md)};
  align-items: flex-start;
`;

// The route planner link, on its own line below the description.
const RoutePlannerRow = styled.div`
  margin-top: ${rem(spacing.sm)};
`;

const WorkflowsTasks = observer(function WorkflowsTasks() {
  const {
    workflowsStore,
    tenantStore,
    analyticsStore,
    firestoreStore,
    tasksFilterStore,
  } = useRootStore();
  const featureVariants = useFeatureVariants();

  // Created here (rather than inside WorkflowsTasksBodyV2) so the same presenter
  // instance backs both the table body and the search-bar controls below.
  const presenter = useMemo(
    () =>
      new CaseloadTasksPresenterV2(
        workflowsStore,
        tenantStore,
        tasksFilterStore,
        analyticsStore,
        firestoreStore,
        featureVariants,
      ),
    [
      workflowsStore,
      tenantStore,
      tasksFilterStore,
      analyticsStore,
      firestoreStore,
      featureVariants,
    ],
  );

  const { isTypesenseSearchEnabled } = presenter;

  // The description, with the route planner link on the line below it.
  const description = (
    <>
      <TasksDescriptionContent>
        {presenter.pageDescriptionMarkdown}
      </TasksDescriptionContent>
      {presenter.showRoutePlannerLink && (
        <RoutePlannerRow>
          <RoutePlannerLink />
        </RoutePlannerRow>
      )}
    </>
  );

  if (!isTypesenseSearchEnabled) {
    return (
      <WorkflowsNavLayout limitedWidth={false}>
        <CaseloadSelectWrapper>
          <CaseloadSelect />
        </CaseloadSelectWrapper>
        <CaseloadTasksHydrator
          initial={
            <TasksBodyContainer>
              <WorkflowsResultsHeader
                headerText="Tasks"
                callToActionText={presenter.initialCallToActionText}
                verticallyCentered
              />
            </TasksBodyContainer>
          }
          empty={
            <TasksBodyContainer>
              <WorkflowsResults
                callToActionText={presenter.emptyCallToActionText}
              />
            </TasksBodyContainer>
          }
          hydrated={<WorkflowsTasksBodyV2 presenter={presenter} />}
        />
      </WorkflowsNavLayout>
    );
  }

  const subheader = presenter.subheaderCopy ?? description;

  return (
    <WorkflowsNavLayout limitedWidth={false}>
      <HeaderAndSearch>
        <WorkflowsResultsHeader
          headerText="Tasks"
          headerAccessory={<WorkflowsUnderstaffedPill />}
          callToActionText={subheader}
          align="left"
        />
        <SearchRow>
          <CaseloadSelect />
          {presenter.hasTasks && (
            <>
              <TableViewToggle presenter={presenter} />
              <WorkflowsFilterDropdown presenter={presenter} />
            </>
          )}
        </SearchRow>
      </HeaderAndSearch>
      <CaseloadTasksHydrator
        initial={null}
        empty={null}
        hydrated={<WorkflowsTasksBodyV2 presenter={presenter} />}
      />
    </WorkflowsNavLayout>
  );
});

export { WorkflowsTasks };
