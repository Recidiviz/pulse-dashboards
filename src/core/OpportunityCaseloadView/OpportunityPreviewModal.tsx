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
import {
  Button,
  DrawerModal,
  Icon,
  palette,
  spacing,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React, { useEffect, useState } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { OpportunityType } from "../../WorkflowsStore";
import { CompliantReportingClientProfile } from "../WorkflowsClientProfile";
import { EarlyTerminationClientProfile } from "../WorkflowsClientProfile/EarlyTerminationClientProfile";
import { EarnedDischargeClientProfile } from "../WorkflowsClientProfile/EarnedDischargeClientProfile";
import { LSUClientProfile } from "../WorkflowsClientProfile/LSUClientProfile";
import { PastFTRDClientProfile } from "../WorkflowsClientProfile/PastFTRDClientProfile";
import { SupervisionLevelDowngradeClientProfile } from "../WorkflowsClientProfile/SupervisionLevelDowngradeClientProfile";
import { UsTnExpirationClientProfile } from "../WorkflowsClientProfile/UsTnExpirationClientProfile";

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
  supervisionLevelDowngrade: {
    previewContents: <SupervisionLevelDowngradeClientProfile />,
  },
  usTnExpiration: {
    previewContents: <UsTnExpirationClientProfile />,
  },
};

const ModalControls = styled.div`
  padding: 0 ${rem(spacing.md)};
  margin-bottom: -1.3rem;
  text-align: right;
  z-index: 10;
`;

const Wrapper = styled.div`
  padding: ${rem(spacing.lg)};
`;

type OpportunityCaseloadProps = {
  opportunityType?: OpportunityType;
  clientIsSelected: boolean;
};

export const OpportunityPreviewModal = observer(
  ({ opportunityType, clientIsSelected }: OpportunityCaseloadProps) => {
    const { workflowsStore } = useRootStore();

    // Managing the modal isOpen state here instead of tying it directly to
    // selectedClient helps to smooth out the open/close transition
    const [modalIsOpen, setModalIsOpen] = useState(clientIsSelected);
    useEffect(() => {
      setModalIsOpen(clientIsSelected);
    }, [clientIsSelected]);

    return (
      <DrawerModal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        onAfterClose={() => {
          workflowsStore.updateSelectedClient(undefined);
        }}
        closeTimeoutMS={1000}
      >
        <Wrapper>
          <ModalControls>
            <Button
              kind="link"
              onClick={() => {
                setModalIsOpen(false);
              }}
            >
              <Icon kind="Close" size="14" color={palette.pine2} />
            </Button>
          </ModalControls>
          {opportunityType && PAGE_CONTENT[opportunityType].previewContents}
        </Wrapper>
      </DrawerModal>
    );
  }
);
