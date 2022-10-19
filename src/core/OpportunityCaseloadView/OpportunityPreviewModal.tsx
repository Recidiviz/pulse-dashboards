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
import { DrawerModal, Icon, palette, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import { Link, useHistory } from "react-router-dom";
import styled from "styled-components/macro";

import { OpportunityType } from "../../WorkflowsStore";
import { workflowsUrl } from "../views";
import { CompliantReportingClientProfile } from "../WorkflowsClientProfile";
import { EarlyTerminationClientProfile } from "../WorkflowsClientProfile/EarlyTerminationClientProfile";
import { EarnedDischargeClientProfile } from "../WorkflowsClientProfile/EarnedDischargeClientProfile";
import { LSUClientProfile } from "../WorkflowsClientProfile/LSUClientProfile";
import { PastFTRDClientProfile } from "../WorkflowsClientProfile/PastFTRDClientProfile";

const PAGE_CONTENT: Record<OpportunityType, any> = {
  compliantReporting: {
    previewContents: (
      <CompliantReportingClientProfile formPrintButton={false} formLinkButton />
    ),
  },
  earlyTermination: {
    previewContents: (
      <EarlyTerminationClientProfile formPrintButton={false} formLinkButton />
    ),
  },
  earnedDischarge: {
    previewContents: <EarnedDischargeClientProfile />,
  },
  LSU: {
    previewContents: <LSUClientProfile formLinkButton />,
  },
  pastFTRD: {
    previewContents: <PastFTRDClientProfile />,
  },
  supervisionLevelDowngrade: {},
};

const ModalControls = styled.div`
  padding: 0 ${rem(spacing.md)};
  margin-bottom: -1.3rem;
  text-align: right;
  z-index: 10;
`;

const Wrapper = styled.div`
  padding: 24px;
`;

type OpportunityCaseloadProps = {
  opportunityType?: OpportunityType;
  isOpen: boolean;
};

export const OpportunityPreviewModal = observer(
  ({ opportunityType, isOpen }: OpportunityCaseloadProps) => {
    const history = useHistory();

    return (
      <DrawerModal
        isOpen={isOpen}
        onRequestClose={() =>
          history.push(workflowsUrl("opportunityClients", { opportunityType }))
        }
      >
        <Wrapper>
          <ModalControls>
            <Link to={workflowsUrl("opportunityClients", { opportunityType })}>
              <Icon kind="Close" size="14" color={palette.pine2} />
            </Link>
          </ModalControls>
          {opportunityType && PAGE_CONTENT[opportunityType].previewContents}
        </Wrapper>
      </DrawerModal>
    );
  }
);
