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
import styled from "styled-components";

import { withPresenterManager } from "~hydration-utils";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { OpportunityCaseloadViewPresenter } from "../../WorkflowsStore/presenters/OpportunityCaseloadViewPresenter";
import { CaseloadSelect } from "../CaseloadSelect";
import ModelHydrator from "../ModelHydrator";
import { SCROLL_PADDING } from "../NavigationLayout";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import { HydratedOpportunityPersonList } from "./HydratedOpportunityPersonList";

const Wrapper = styled.div`
  /* leaving extra space for the Intercom button */
  padding-bottom: ${rem(spacing.md * 4)};
  height: 100%;
`;

// A real block-level spacer, rendered as a sibling of the (possibly
// overflowing) opportunity list/grid content rather than relying on
// Wrapper's own height, since Wrapper's height:100% caps its box regardless
// of how far its overflowing children actually extend.
const ScrollBuffer = styled.div`
  height: ${rem(SCROLL_PADDING)};
`;

const ManagedComponent = observer(function OpportunityCaseloadView({
  presenter,
}: {
  presenter: OpportunityCaseloadViewPresenter;
}) {
  const { opportunityType } = presenter;
  const { isTablet } = useIsMobile(true);
  const { classificationScrollBuffer } = useFeatureVariants();

  return (
    // The Workflows layout should fill the screen.
    <WorkflowsNavLayout limitedWidth={false}>
      <Wrapper>
        {isTablet && <CaseloadSelect />}
        <ModelHydrator hydratable={presenter}>
          <HydratedOpportunityPersonList opportunityType={opportunityType} />
          {classificationScrollBuffer && <ScrollBuffer />}
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
