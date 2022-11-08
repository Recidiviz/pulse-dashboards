// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { useRootStore } from "../../components/StoreProvider";
import { CaseloadSelect } from "../CaseloadSelect";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import { OpportunityClientList } from "./OpportunityClientList";
import { OpportunityPreviewModal } from "./OpportunityPreviewModal";

const Wrapper = styled.div`
  /* leaving extra space for the Intercom button */
  padding-bottom: ${rem(spacing.md * 4)};
`;

type OpportunityCaseloadViewProps = {
  preview?: boolean;
};

export const OpportunityCaseloadView = observer(
  ({ preview = false }: OpportunityCaseloadViewProps) => {
    const {
      workflowsStore: {
        selectedOpportunityType: opportunityType,
        selectedClient,
      },
    } = useRootStore();

    return (
      <WorkflowsNavLayout>
        <Wrapper>
          <CaseloadSelect />
          <OpportunityClientList />
          <OpportunityPreviewModal
            opportunityType={opportunityType}
            selectedClientId={selectedClient?.pseudonymizedId}
          />
        </Wrapper>
      </WorkflowsNavLayout>
    );
  }
);
