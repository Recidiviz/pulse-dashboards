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

import { Sans12, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Fragment, useEffect, useState } from "react";
import styled from "styled-components";

import { palette } from "~design-system";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { Client, JusticeInvolvedPerson } from "../../WorkflowsStore";
import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import { Heading } from "../WorkflowsJusticeInvolvedPersonProfile/Heading";
import { OpportunitiesAccordion } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunitiesAccordion";
import { ClientDetailSidebarComponents } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { PreviewModalFooter } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunityProfileFooter";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import AddedTasks from "./AddedTasks";
import { PreviewTasks } from "./PreviewTasks";
import { FilterHeaderRow, TaskSectionFilter } from "./TaskSectionFilter";

export const TaskItemDivider = styled.hr`
  border-top: 1px solid ${palette.slate10};
  margin: 0 -${rem(spacing.md)};
  min-width: 100%;

  &:last-child {
    display: none;
  }
`;

const TaskItemHeader = styled(Sans12)`
  background-color: ${palette.marble2};
  border-bottom: 1px solid ${palette.slate10};
  border-top: 1px solid ${palette.slate10};
  color: ${palette.slate70};
  font-weight: 700;
  margin: 0 -${rem(spacing.md)};
  min-width: 100%;
  padding-top: ${rem(4)};
  padding-bottom: ${rem(4)};
  padding-left: ${rem(16)};
  text-transform: uppercase;
`;

const TaskPreviewFooter = ({
  currentClient,
  navigableClients,
}: {
  currentClient: Client;
  navigableClients: JusticeInvolvedPerson[];
}) => {
  const { workflowsStore } = useRootStore();

  return (
    <PreviewModalFooter
      currentItem={currentClient}
      navigableItems={navigableClients}
      onNavigate={(nextClient: Client) => {
        workflowsStore.updateSelectedPerson(nextClient.pseudonymizedId);
      }}
      itemLabel={"Client"}
    />
  );
};

export const TaskPreviewModal = observer(function TaskPreviewModal({
  presenter,
}: {
  presenter: CaseloadTasksPresenterV2;
}) {
  const {
    workflowsStore: { selectedClient },
    tenantStore: { tasksSidebarComponents },
  } = useRootStore();
  const { customTasks } = useFeatureVariants();

  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    if (selectedClient) {
      selectedClient.supervisionTasks?.trackPreviewed(
        presenter.selectedTaskCategory,
      );
    }
  }, [selectedClient, presenter.selectedTaskCategory]);

  if (!selectedClient) return null;

  const opportunitiesToDisplay = !!Object.values(selectedClient.opportunities)
    .length;

  const showFooter = !presenter.showListView;

  const sidebarComponents = tasksSidebarComponents.map((name, i) => {
    const Component = ClientDetailSidebarComponents[name];
    return (
      <Fragment key={name}>
        {i > 0 && <TaskItemDivider />}
        <Component client={selectedClient} />
      </Fragment>
    );
  });

  return (
    <WorkflowsPreviewModal
      isOpen={!!selectedClient}
      pageContent={
        <article>
          <Heading person={selectedClient} />
          {/* The "Show Hidden" filter + hide-snoozed default are US_MO-only,
              gated on the `customTasks` variant. Other tenants keep the
              original behavior: a plain header showing all tasks. */}
          {customTasks ? (
            <TaskItemHeader>
              <FilterHeaderRow>
                <span>Tasks</span>
                <TaskSectionFilter
                  label="Show Hidden"
                  checked={showHidden}
                  onChange={setShowHidden}
                  testId="tasks-filter"
                />
              </FilterHeaderRow>
            </TaskItemHeader>
          ) : (
            <TaskItemHeader>Tasks</TaskItemHeader>
          )}
          <PreviewTasks
            person={selectedClient}
            showSnoozeDropdown
            hideSnoozed={!!customTasks && !showHidden}
          />
          {customTasks && (
            <AddedTasks
              client={selectedClient}
              renderShell={(body, filter) => (
                <>
                  <TaskItemHeader>
                    <FilterHeaderRow>
                      <span>Added Tasks</span>
                      {filter}
                    </FilterHeaderRow>
                  </TaskItemHeader>
                  {body}
                </>
              )}
            />
          )}
          {opportunitiesToDisplay && (
            <>
              <TaskItemHeader>Opportunities</TaskItemHeader>
              <OpportunitiesAccordion
                hideEmpty
                person={selectedClient}
                showIneligibleOpportunityTypes={false}
              />
            </>
          )}
          <TaskItemHeader>Client Details</TaskItemHeader>
          {sidebarComponents}
        </article>
      }
      footerContent={
        showFooter ? (
          <TaskPreviewFooter
            currentClient={selectedClient}
            navigableClients={presenter.navigablePeople}
          />
        ) : undefined
      }
    />
  );
});
