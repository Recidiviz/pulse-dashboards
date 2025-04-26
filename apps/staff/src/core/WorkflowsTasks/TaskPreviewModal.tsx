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

import { palette, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import {
  Contact,
  Milestones,
  Supervision,
} from "../WorkflowsJusticeInvolvedPersonProfile";
import { Heading } from "../WorkflowsJusticeInvolvedPersonProfile/Heading";
import { OpportunitiesAccordion } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunitiesAccordion";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import { SupervisionTaskCategory } from "./fixtures";
import { PreviewTasks } from "./PreviewTasks";

export const TaskItemDivider = styled.hr`
  border-top: 1px solid ${palette.slate10};
  margin: 0 -${rem(spacing.md)};
  min-width: 100%;

  &:last-child {
    display: none;
  }
`;

const TaskItemHeader = styled.div`
  background-color: ${palette.marble2};
  border-bottom: 1px solid ${palette.slate10};
  color: ${palette.slate70};
  font-family: "Public Sans", sans-serif;
  font-weight: 700;
  margin: 0 -${rem(spacing.md)};
  min-width: 100%;
  padding-top: ${rem(4)};
  padding-bottom: ${rem(4)};
  padding-left: ${rem(16)};
  text-transform: uppercase;
`;

interface SelectedTaskCategoryInterface {
  selectedTaskCategory: SupervisionTaskCategory;
}

export const TaskPreviewModal = observer(function TaskPreviewModal({
  presenter,
}: {
  presenter: SelectedTaskCategoryInterface;
}) {
  const {
    workflowsStore: { selectedClient },
  } = useRootStore();

  if (!selectedClient) return null;

  const opportunitiesToDisplay = !!Object.values(selectedClient.opportunities)
    .length;

  return (
    <WorkflowsPreviewModal
      isOpen={!!selectedClient}
      onAfterOpen={() =>
        selectedClient.supervisionTasks?.trackPreviewed(
          presenter.selectedTaskCategory,
        )
      }
      pageContent={
        <article>
          <Heading person={selectedClient} />
          <TaskItemHeader>Tasks</TaskItemHeader>
          <PreviewTasks person={selectedClient} showSnoozeDropdown />
          <TaskItemDivider />
          {opportunitiesToDisplay && (
            <>
              <TaskItemHeader>Opportunities</TaskItemHeader>
              <OpportunitiesAccordion hideEmpty person={selectedClient} />
            </>
          )}
          <TaskItemHeader>Client Details</TaskItemHeader>
          <Supervision client={selectedClient} />
          <Milestones client={selectedClient} />
          <Contact client={selectedClient} />
        </article>
      }
    />
  );
});
