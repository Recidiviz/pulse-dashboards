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
import React from "react";
import styled from "styled-components/macro";

import { withPresenterManager } from "~hydration-utils";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { OpportunityCaseloadViewPresenter } from "../../WorkflowsStore/presenters/OpportunityCaseloadViewPresenter";
import { CaseloadSelect } from "../CaseloadSelect";
import ModelHydrator from "../ModelHydrator";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import WorkflowsResults from "../WorkflowsResults";
import { HydratedOpportunityPersonList } from "./HydratedOpportunityPersonList";

const Wrapper = styled.div`
  /* leaving extra space for the Intercom button */
  padding-bottom: ${rem(spacing.md * 4)};
  height: 100%;
`;

const ManagedComponent = observer(function OpportunityCaseloadView({
  presenter,
}: {
  presenter: OpportunityCaseloadViewPresenter;
}) {
  const {
    selectedSearchIds,
    opportunityType,
    hasOpportunities,
    ctaTextAndHeaderText,
  } = presenter;
  const { opportunityTableView } = useFeatureVariants();

  const selectedSearchIdsCount = selectedSearchIds?.length || 0;

  return (
    // If we're displaying the table view, the Workflows layout should fill the screen.
    // If we're not, the Workflows layout should be centered and limited-width.
    <WorkflowsNavLayout limitedWidth={!opportunityTableView}>
      <Wrapper>
        <CaseloadSelect />
        <ModelHydrator hydratable={presenter}>
          <React.Fragment>
            {(selectedSearchIdsCount === 0 || !hasOpportunities) && (
              <WorkflowsResults
                headerText={ctaTextAndHeaderText.headerText}
                callToActionText={ctaTextAndHeaderText.ctaText}
              />
            )}
            {selectedSearchIdsCount > 0 && hasOpportunities && (
              <HydratedOpportunityPersonList
                opportunityType={opportunityType}
              />
            )}
          </React.Fragment>
        </ModelHydrator>
      </Wrapper>
    </WorkflowsNavLayout>
  );
});

function usePresenter() {
  const {
    workflowsStore,
    workflowsStore: { opportunityConfigurationStore, selectedOpportunityType },
  } = useRootStore();

  return !selectedOpportunityType
    ? null
    : new OpportunityCaseloadViewPresenter(
        workflowsStore,
        opportunityConfigurationStore,
        selectedOpportunityType,
      );
}

export const OpportunityCaseloadView = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});
