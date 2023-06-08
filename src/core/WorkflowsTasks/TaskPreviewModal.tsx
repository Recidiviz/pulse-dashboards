// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import {
  Contact,
  Milestones,
  Supervision,
} from "../WorkflowsClientProfile/Details";
import { Heading } from "../WorkflowsClientProfile/Heading";
import { OpportunitiesAccordion } from "../WorkflowsClientProfile/OpportunitiesAccordion";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import { PreviewTasks } from "./PreviewTasks";

export const TaskItemDivider = styled.hr`
  border-top: 1px solid ${palette.slate10};
  margin: 0 -${rem(spacing.md)};
  min-width: 100%;
`;

export const TaskPreviewModal = observer(function TaskPreviewModal() {
  const {
    workflowsStore: { selectedClient },
  } = useRootStore();

  if (!selectedClient) return null;

  return (
    <WorkflowsPreviewModal
      isOpen={!!selectedClient}
      onAfterOpen={() => selectedClient.supervisionTasks?.trackPreviewed()}
      pageContent={
        <article>
          <Heading person={selectedClient} />
          <OpportunitiesAccordion hideEmpty person={selectedClient} />
          {Object.values(selectedClient.verifiedOpportunities).length ? null : (
            <TaskItemDivider />
          )}
          <PreviewTasks person={selectedClient} showSnoozeDropdown />
          <Supervision client={selectedClient} />
          <Milestones client={selectedClient} />
          <Contact client={selectedClient} />
        </article>
      }
    />
  );
});
